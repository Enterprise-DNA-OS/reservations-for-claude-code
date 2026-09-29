#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const reads={
 venues:'select id,name,timezone,capacity from venues order by name',
 tables:'select t.id,v.name venue,t.name,t.seats from dining_tables t join venues v on v.id=t.venue_id order by v.name,t.name',
 'service-sheet':"select reference,venue,guest,arrival,finish,dining_table,covers,status,allergy_note,kitchen_ack_by from v_service where ends_at>now() and status in ('enquiry','confirmed','seated') order by starts_at",
 'covers-forecast':'select * from v_covers where service_date>=current_date order by service_date,venue,channel',
 'guest-book':'select * from v_guest_history order by name',
 'no-shows':'select name,no_shows,visits,upcoming from v_guest_history where no_shows>0 order by no_shows desc,name',
 'lapsed-guests':"select name,visits,to_char(last_visit,'YYYY-MM-DD') last_visit from v_guest_history where last_visit<now()-interval '60 days' and upcoming=0 order by last_visit",
 'kitchen-handover':"select reference,venue,guest,arrival,allergy_note,kitchen_ack_by from v_service where allergy_note<>'' and ends_at>now() and status in ('confirmed','seated') order by starts_at",
 'enquiries':"select reference,venue,guest,arrival,covers,notes from v_service where status='enquiry' order by starts_at",
 'channel-review':'select venue,channel,count(*) bookings,sum(covers) covers,count(*) filter(where status=\'no-show\') no_shows,count(*) filter(where status=\'cancelled\') cancellations from v_service group by venue,channel order by venue,channel',
 attention:'select * from v_attention order by reason,reference',
 compliance:'select * from v_compliance order by rule,record',
 'weekly-review':"select 'Attention' section,reference record,reason detail from v_attention union all select 'Compliance',record,finding from v_compliance union all select 'Repeat no-shows',name,no_shows::text || ' missed visits, ' || upcoming::text || ' upcoming' from v_guest_history where no_shows>0",
};
const need=(v,label)=>{if(v===undefined||String(v).trim()==='')throw Error(`${label} is required`);return String(v).trim();};
const integer=(v,label)=>{if(!/^\d+$/.test(String(v))||+v<1)throw Error(`${label} must be a positive integer`);return +v;};
const instant=v=>{need(v,'Timestamp');if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp needs ISO date, time and explicit UTC offset');return v;};
const status=v=>{const s=need(v,'Status').toLowerCase().replace(/^noshow$|^no show$/,'no-show');if(!['enquiry','confirmed','seated','completed','cancelled','no-show'].includes(s))throw Error(`Unknown booking status: ${v}`);return s;};
export async function resolve(db,kind,value){
 const spec={guest:['guests','name'],venue:['venues','name'],booking:['bookings','reference'],table:['dining_tables','name']}[kind];
 if(!spec)throw Error('Unknown record kind');need(value,kind);
 const [relation,column]=spec;
 const rows=await db.query(`select * from ${relation} where id::text ilike $1 or ${column} ilike $2 order by ${column}`,[`${value}%`,`%${value}%`]);
 const exact=rows.filter(r=>r.id===value||r[column].toLowerCase()===value.toLowerCase());
 const found=exact.length?exact:rows;
 if(found.length!==1)throw Error(`${kind}: ${found.length?'ambiguous, choose an id':'not found'}\n${found.map(r=>`${r.id}  ${r[column]}`).join('\n')}`);
 return found[0];
}
async function tx(db,work){await db.exec('BEGIN');try{const result=await work();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
const entities=['venues','dining_tables','guests','bookings','booking_notes'];
export async function run(db,args){
 const options={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');options[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const [command='help',...rest]=pos;
 if(command==='help')return [{commands:[...Object.keys(reads),'guest','booking','add-guest','add-venue','add-table','book','assign','status','acknowledge','log','retention-review','draft-confirmation','import resdiary','export'].join(', '),usage:'npm run reservations -- <command> [name or id] --flag=value [--json]'}];
 if(reads[command])return db.query(reads[command]);
 if(command==='guest'){const g=await resolve(db,'guest',rest[0]);return {guest:g,bookings:await db.query('select * from bookings where guest_id=$1 order by starts_at',[g.id])};}
 if(command==='booking'){const b=await resolve(db,'booking',rest[0]);return {booking:await db.query('select * from v_service where id=$1',[b.id]),notes:await db.query('select author,body,created_at from booking_notes where booking_id=$1 order by created_at',[b.id])};}
 if(command==='add-venue')return db.query('insert into venues(name,timezone,capacity) values($1,$2,$3) returning *',[need(rest[0],'Name'),await zone(db,options.timezone),integer(options.capacity,'Capacity')]);
 if(command==='add-guest')return db.query('insert into guests(name,email,phone,notes) values($1,$2,$3,$4) returning *',[need(rest[0],'Name'),options.email||'',options.phone||'',options.notes||'']);
 if(command==='add-table'){const v=await resolve(db,'venue',options.venue);return db.query('insert into dining_tables(venue_id,name,seats) values($1,$2,$3) returning *',[v.id,need(rest[0],'Name'),integer(options.seats,'Seats')]);}
 if(command==='book'){
 const g=await resolve(db,'guest',options.guest),v=await resolve(db,'venue',options.venue);
 return db.query('insert into bookings(reference,guest_id,venue_id,starts_at,ends_at,covers,status,channel,allergy_note,notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning reference,status',[
 need(rest[0],'Reference'),g.id,v.id,instant(options.start),instant(options.end),integer(options.covers,'Covers'),status(options.status||'confirmed'),options.channel||'phone',options.allergy||'',options.notes||'']);
 }
 if(command==='assign'){const b=await resolve(db,'booking',rest[0]),t=await resolve(db,'table',rest[1]);return db.query('update bookings set table_id=$1 where id=$2 returning reference,table_id',[t.id,b.id]);}
 if(command==='status'){const b=await resolve(db,'booking',rest[0]);return tx(db,async()=>{const result=await db.query('update bookings set status=$1 where id=$2 returning reference,status',[status(rest[1]),b.id]);await db.query('insert into booking_notes(booking_id,author,body) values($1,$2,$3)',[b.id,need(options.by,'--by'),`Status ${b.status} -> ${status(rest[1])}: ${need(options.reason,'--reason')}`]);return result;});}
 if(command==='acknowledge'){const b=await resolve(db,'booking',rest[0]);if(!b.allergy_note)throw Error('No recorded allergy to acknowledge');return db.query('update bookings set kitchen_ack_by=$1,kitchen_ack_at=now() where id=$2 returning reference,kitchen_ack_by',[need(options.by,'--by'),b.id]);}
 if(command==='log'){const b=await resolve(db,'booking',rest[0]);return db.query('insert into booking_notes(booking_id,author,body) values($1,$2,$3) returning *',[b.id,need(options.by,'--by'),need(rest[1],'Note')]);}
 if(command==='retention-review'){const g=await resolve(db,'guest',rest[0]);if(!/^\d{4}-\d\d-\d\d$/.test(options.next||''))throw Error('--next requires YYYY-MM-DD');return db.query("update guests set retention_review_on=$1,notes=notes || E'\nRetention review: ' || $2 where id=$3 returning name,retention_review_on",[options.next,need(options.reason,'Lawful purpose'),g.id]);}
 if(command==='draft-confirmation'){const b=await resolve(db,'booking',rest[0]);const [s]=await db.query('select * from v_service where id=$1',[b.id]);if(!['confirmed','seated'].includes(s.status))throw Error('Only confirmed or seated bookings can have a confirmation drafted');const dir=path.join(REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${b.id}-confirmation.txt`);fs.writeFileSync(file,`DRAFT. Review before sending.\nHello ${s.guest},\nYour booking at ${s.venue} is for ${s.covers} guests on ${s.arrival} (venue local time).\nPlease contact the venue to discuss dietary needs.\n`);return [{file}];}
 if(command==='export'){const data={format:'reservations-v1',exported_at:new Date().toISOString()};for(const e of entities)data[e]=await db.query(`select * from ${e} order by id`);if(options.out){const file=path.resolve(options.out);fs.writeFileSync(file,JSON.stringify(data,null,2),{flag:'wx'});return [{file}];}return data;}
 if(command==='import'&&rest[0]==='resdiary')return importResdiary(db,rest[1],options);
 throw Error(`Unknown command: ${command}. Run help.`);
}
async function zone(db,value){need(value,'--timezone');if(!(await db.query('select name from pg_timezone_names where name=$1',[value])).length)throw Error(`Unknown timezone: ${value}`);return value;}
// Editable report columns vary. A JSON map binds our canonical keys to exported labels.
export async function importResdiary(db,file,options={}){
 const rows=parseCsv(fs.readFileSync(need(file,'CSV file'),'utf8'));if(!rows.length)throw Error('CSV has no records');
 const mapping=options.map?JSON.parse(fs.readFileSync(options.map,'utf8')):{};
 const aliases={reference:['Booking Reference','Reference','Booking ID'],name:['Customer Name','Name','Guest Name'],email:['Customer Email','Email'],phone:['Phone','Telephone','Mobile'],start:['Visit Date and Time','Visit Date & Time','Start'],end:['End','End Time'],covers:['Covers','Party Size'],status:['Status','Booking Status'],channel:['Channel','Booking Source'],allergy:['Allergy Note','Dietary Requirements'],notes:['Notes','Booking Notes']};
 const get=(row,key)=>pick(row,...(mapping[key]?[mapping[key]]:aliases[key]));
 const v=await resolve(db,'venue',options.venue);
 const duration=options['duration-minutes']?integer(options['duration-minutes'],'Duration'):null;
 const prepared=[];
 for(const [index,row] of rows.entries()){
 try{
 const start=get(row,'start');let startISO;
 if(/(?:Z|[+-]\d\d:\d\d)$/.test(start)){startISO=instant(start.replace(' ','T'));}
 else {
  need(options.timezone,'--timezone for local visit times');await zone(db,options.timezone);
  let local=start.trim().replace('T',' ');
  if(options['date-order']==='dmy')local=local.replace(/^(\d\d)\/(\d\d)\/(\d{4})/,'$3-$2-$1');
  if(!/^\d{4}-\d\d-\d\d \d\d:\d\d(?::\d\d)?$/.test(local))throw Error('Visit time must be YYYY-MM-DD HH:MM; use --date-order=dmy for DD/MM/YYYY');
  const [r]=await db.query("select ($1::timestamp at time zone $2) as stamp, to_char(($1::timestamp at time zone $2) at time zone $2,'YYYY-MM-DD HH24:MI:SS') as roundtrip, to_char((($1::timestamp at time zone $2)-interval '1 hour') at time zone $2,'YYYY-MM-DD HH24:MI:SS') as earlier, to_char((($1::timestamp at time zone $2)+interval '1 hour') at time zone $2,'YYYY-MM-DD HH24:MI:SS') as later",[local,options.timezone]);
  const expected=local.length===16?local+':00':local;
  if(r.roundtrip!==expected||r.earlier===expected||r.later===expected)throw Error('Ambiguous or missing daylight-saving time: provide an explicit UTC offset');
  startISO=new Date(r.stamp).toISOString();
 }
 const end=get(row,'end');if(!end&&!duration)throw Error('Missing End: provide --duration-minutes explicitly');
 const endISO=end?instant(end.replace(' ','T')):new Date(Date.parse(startISO)+duration*60000).toISOString();
 if(Date.parse(endISO)<=Date.parse(startISO))throw Error('End must follow start');
 prepared.push({ref:`resdiary:${v.id}:${need(get(row,'reference'),'Booking Reference')}`,name:need(get(row,'name'),'Customer Name'),email:get(row,'email').trim().toLowerCase(),phone:get(row,'phone'),start:startISO,end:endISO,covers:integer(get(row,'covers'),'Covers'),status:status(get(row,'status')),channel:get(row,'channel')||'import',allergy:get(row,'allergy'),notes:get(row,'notes')});
 }catch(e){throw Error(`CSV row ${index+2}: ${e.message}`);}}
 if(new Set(prepared.map(r=>r.ref)).size!==prepared.length)throw Error('Duplicate booking reference in CSV');
 return tx(db,async()=>{
 let inserted=0,unchanged=0;
 for(const r of prepared){
 const [existing]=await db.query('select * from bookings where reference=$1',[r.ref]);
 if(existing){
  const [g]=await db.query('select * from guests where id=$1',[existing.guest_id]);
  if(new Date(existing.starts_at).getTime()!==Date.parse(r.start)||new Date(existing.ends_at).getTime()!==Date.parse(r.end)||existing.covers!==r.covers||existing.status!==r.status||existing.channel!==r.channel||existing.allergy_note!==r.allergy||existing.notes!==r.notes||g.name!==r.name||g.email!==r.email||g.phone!==r.phone)throw Error(`Changed export for ${r.ref}: reconcile explicitly, import never overwrites local history`);
  unchanged++;continue;
 }
 // Match the whole identity, not a shared email address alone.
 let [g]=await db.query('select id from guests where name=$1 and email=$2 and phone=$3 order by created_at limit 1',[r.name,r.email,r.phone]);
 if(!g)[g]=await db.query('insert into guests(name,email,phone) values($1,$2,$3) returning id',[r.name,r.email,r.phone]);
 await db.query('insert into bookings(reference,venue_id,guest_id,starts_at,ends_at,covers,status,channel,allergy_note,notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[r.ref,v.id,g.id,r.start,r.end,r.covers,r.status,r.channel,r.allergy,r.notes]);inserted++;
 }
 if(options['dry-run'])throw Object.assign(Error('dry-run'),{preview:{rows:prepared.length,inserted,unchanged,dry_run:true}});
 return [{rows:prepared.length,inserted,unchanged,dry_run:false}];
 }).catch(e=>{if(e.preview)return [e.preview];throw e;});
}
export function format(result){if(!Array.isArray(result))return JSON.stringify(result,null,2);if(!result.length)return '  (none)';return table(result,Object.keys(result[0]).map(key=>({key,label:key,format:v=>v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
