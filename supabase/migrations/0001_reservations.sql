create table venues (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 timezone text not null default 'Pacific/Auckland', capacity integer not null check(capacity>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table dining_tables (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references venues,
 name text not null, seats integer not null check(seats>0), unique(venue_id,name),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table guests (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 email text not null default '', phone text not null default '', notes text not null default '',
 retention_review_on date not null default (current_date+365),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table bookings (
 id uuid primary key default gen_random_uuid(), reference text not null unique,
 venue_id uuid not null references venues, guest_id uuid not null references guests,
 table_id uuid references dining_tables, starts_at timestamptz not null, ends_at timestamptz not null,
 covers integer not null check(covers>0), status text not null default 'confirmed'
 check(status in ('enquiry','confirmed','seated','completed','cancelled','no-show')),
 channel text not null default 'phone', allergy_note text not null default '',
 kitchen_ack_by text not null default '', kitchen_ack_at timestamptz,
 notes text not null default '', check(ends_at>starts_at),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index bookings_start on bookings(starts_at);
create index bookings_guest on bookings(guest_id);
create table booking_notes (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references bookings,
 body text not null check(length(trim(body))>0), author text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger touch_venues before update on venues for each row execute function touch_updated();
create trigger touch_tables before update on dining_tables for each row execute function touch_updated();
create trigger touch_guests before update on guests for each row execute function touch_updated();
create trigger touch_bookings before update on bookings for each row execute function touch_updated();
create trigger touch_notes before update on booking_notes for each row execute function touch_updated();
-- Lock the physical dining table before testing overlaps. Adjacent sessions are allowed.
create function protect_assignment() returns trigger language plpgsql as $$
declare t dining_tables;
begin
 if new.table_id is not null then
  select * into t from dining_tables where id=new.table_id for update;
  if t.venue_id<>new.venue_id then raise exception 'Dining table belongs to another venue'; end if;
  if new.covers>t.seats then raise exception 'Party exceeds dining table seats'; end if;
  if new.status in ('confirmed','seated') and exists (
   select 1 from bookings b where b.table_id=new.table_id and b.id<>new.id and b.reference<>new.reference
   and b.status in ('confirmed','seated') and b.starts_at<new.ends_at and b.ends_at>new.starts_at
  ) then raise exception 'Dining table already reserved for this time'; end if;
 end if;
 return new;
end $$;
create trigger booking_assignment before insert or update on bookings for each row execute function protect_assignment();
create view v_service as
 select b.id,b.reference,v.id venue_id,v.name venue,g.name guest,
 to_char(b.starts_at at time zone v.timezone,'YYYY-MM-DD HH24:MI') arrival,
 (b.starts_at at time zone v.timezone)::date service_date,
 to_char(b.ends_at at time zone v.timezone,'HH24:MI') finish,
 coalesce(t.name,'UNASSIGNED') dining_table,b.covers,b.status,b.channel,
 b.allergy_note,b.kitchen_ack_by,b.notes,b.starts_at,b.ends_at
 from bookings b join venues v on v.id=b.venue_id join guests g on g.id=b.guest_id
 left join dining_tables t on t.id=b.table_id;
create view v_guest_history as
 select g.id,g.name,g.email,g.phone,g.retention_review_on,
 count(b.id) filter(where b.status='completed') visits,
 count(b.id) filter(where b.status='no-show') no_shows,
 max(b.starts_at) filter(where b.status='completed') last_visit,
 count(b.id) filter(where b.status in ('enquiry','confirmed','seated') and b.ends_at>now()) upcoming
 from guests g left join bookings b on b.guest_id=g.id group by g.id;
create view v_attention as
 select reference,guest,venue,'Kitchen handover needed' reason from v_service
 where allergy_note<>'' and kitchen_ack_by='' and status in ('confirmed','seated') and ends_at>now()
 union all select reference,guest,venue,'No dining table assigned' from v_service
 where dining_table='UNASSIGNED' and status='confirmed' and ends_at>now()
 union all select reference,guest,venue,'Service outcome overdue' from v_service
 where ends_at<now() and status in ('confirmed','seated')
 union all select reference,guest,venue,'Enquiry needs follow-up' from v_service
 where status='enquiry';
create view v_covers as
 select venue,service_date,channel,count(*) bookings,sum(covers) covers,
 count(*) filter(where status='no-show') no_shows,
 sum(covers) filter(where status in ('confirmed','seated','completed')) expected_or_served
 from v_service group by venue,service_date,channel;
create view v_compliance as
 select reference record,'ALLERGEN-HANDOVER' rule,'Recorded allergy requires kitchen acknowledgement' finding
 from v_service where allergy_note<>'' and kitchen_ack_by='' and status in ('confirmed','seated') and ends_at>now()
 union all select name,'RETENTION-REVIEW','Review lawful purpose before retaining or deleting guest history'
 from guests where retention_review_on<current_date;
