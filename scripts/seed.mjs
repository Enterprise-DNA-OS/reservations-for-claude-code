import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
const db=await getDb();
try {
 if(db.mode==='postgres'&&process.env.ALLOW_DEMO_SEED!=='yes')throw Error('Demo seed is local only. Use a disposable database and ALLOW_DEMO_SEED=yes for hosted testing.');
 await db.exec('BEGIN');
 try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
 console.log('Seed PASS: Harbour Kitchen and Laneway Dining, fictional demo records.');
}finally{await db.close();}
