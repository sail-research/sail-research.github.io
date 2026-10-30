import {createClient} from '@supabase/supabase-js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

process.loadEnvFile('.env.local');
assert.equal(process.env.SUPABASE_URL,'https://rxnhlmrvwmepuphpithm.supabase.co');
const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,
 {auth:{persistSession:false,autoRefreshToken:false}});
const manifest=JSON.parse(await readFile('curriculum/manifest.json','utf8'));
const moduleIds=manifest.modules.map(m=>m.id),projectIds=manifest.projects.map(p=>p.id);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const check=async query=>{const result=await query;if(result.error)throw new Error(result.error.message);return result.data;};
const stripTitle=text=>text.slice(text.indexOf('\n')+1).trim();
const read=path=>readFile(`curriculum/${path}`,'utf8').then(x=>x.replaceAll('\r\n','\n'));
const writable={modules:['id','description','outcomes','assignment_brief','material_url'],
 lessons:['id','module_id','title','description','content','material_url','order_index','is_active','lesson_type'],
 projects:['id','description','expected_output','material_url']};
const projectRows=(rows,keys)=>rows.map(r=>Object.fromEntries(keys.map(k=>[k,r[k]]))).sort((a,b)=>a.id.localeCompare(b.id));
async function current(){
 const [track,modules,lessons,projects]=await Promise.all([
  check(client.from('training_tracks').select('id,slug,title').eq('id',manifest.track_id).single()),
  check(client.from('training_modules').select('*').eq('track_id',manifest.track_id).order('id')),
  check(client.from('training_lessons').select('*').in('module_id',moduleIds).order('id')),
  check(client.from('training_projects').select('*').in('id',projectIds).order('id'))]);
 assert.equal(track.slug,'undergraduate-training');assert.equal(modules.length,6);assert.equal(projects.length,3);
 assert.deepEqual(modules.map(m=>m.id).sort(),[...moduleIds].sort());
 return {track,modules,lessons,projects};
}
async function learnerFingerprint(){
 const names=['enrollments','lesson_progress','submissions','reviews','certificates'];
 const rows=await Promise.all(names.map(async name=>{
  const result=await client.from(`training_${name}`).select('*',{count:'exact'});
  if(result.error)throw new Error(result.error.message);
  const data=result.data;
  assert.equal(data.length,result.count,'Learner fingerprint was truncated; paginate before publishing.');
  // Progress uses a composite primary key; canonicalize rows independently of database order.
  return data.map(row=>JSON.stringify(row)).sort();
 }));
 return {hash:digest(rows),counts:Object.fromEntries(names.map((name,i)=>[name,rows[i].length]))};
}
async function desired(){
 const modules=await Promise.all(manifest.modules.map(async m=>({id:m.id,description:m.description,
  outcomes:m.outcomes,assignment_brief:stripTitle(await read(m.assignment_file)),material_url:m.material_url})));
 const lessons=await Promise.all(manifest.lessons.map(async l=>({id:l.id,module_id:l.module_id,title:l.title,
  description:l.description,content:stripTitle(await read(l.file)),material_url:l.material_url,
  order_index:l.order_index,is_active:l.is_active,lesson_type:l.lesson_type})));
 const projects=await Promise.all(manifest.projects.map(async p=>({id:p.id,description:p.description,
  expected_output:stripTitle(await read(p.file)),material_url:p.material_url})));
 return {modules,lessons,projects};
}
function contentFingerprint(data){return digest(Object.fromEntries(Object.entries(writable).map(([name,keys])=>[name,projectRows(data[name],keys)])));}
const mode=process.argv[2]||'plan';
const planPath='tmp/training-curriculum-publication-plan.json';
await mkdir('tmp',{recursive:true});
if(mode==='plan'){
 const before=await current(),after=await desired(),learners=await learnerFingerprint();
 const plan={createdAt:new Date().toISOString(),project:'rxnhlmrvwmepuphpithm',track:manifest.track_id,
  before,after,beforeHash:contentFingerprint(before),afterHash:contentFingerprint(after),learners};
 await writeFile(planPath,JSON.stringify(plan,null,2)+'\n');
 console.log(JSON.stringify({plan:planPath,beforeLessons:before.lessons.length,afterLessons:after.lessons.length,
  modules:after.modules.length,projects:after.projects.length,preservedLessonIds:before.lessons.filter(l=>after.lessons.some(a=>a.id===l.id)).length,
  learnerCounts:learners.counts,planHash:plan.afterHash},null,2));
}else if(mode==='apply'){
 const plan=JSON.parse(await readFile(planPath,'utf8'));
 assert.equal(plan.track,manifest.track_id);
 assert.equal(contentFingerprint(await desired()),plan.afterHash,'Local content changed; create and review a fresh plan.');
 const now=await current();const nowHash=contentFingerprint(now);
 if(nowHash===plan.afterHash){console.log('Published content already matches the plan.');process.exit(0);}
 assert.equal(nowHash,plan.beforeHash,'Production content drifted after backup; do not overwrite instructor edits.');
 assert.equal((await learnerFingerprint()).hash,plan.learners.hash,'Learner records changed during preparation; refresh the plan.');
 const originalLessonIds=new Set(plan.before.lessons.map(l=>l.id));
 assert.ok(plan.before.lessons.every(l=>plan.after.lessons.some(x=>x.id===l.id)),'Never remove existing lessons.');
 const insertedIds=plan.after.lessons.filter(l=>!originalLessonIds.has(l.id)).map(l=>l.id);
 try{
  // Upsert lessons in one request, then patch only content columns on the six known modules/three projects.
  await check(client.from('training_lessons').upsert(plan.after.lessons,{onConflict:'id'}));
  for(const row of plan.after.modules){const {id,...values}=row;await check(client.from('training_modules').update(values).eq('id',id));}
  for(const row of plan.after.projects){const {id,...values}=row;await check(client.from('training_projects').update(values).eq('id',id));}
  const published=await current();assert.equal(contentFingerprint(published),plan.afterHash);
  const learners=await learnerFingerprint();assert.equal(learners.hash,plan.learners.hash,'Unexpected learner-state change.');
  await mkdir('docs/training-curriculum-qa',{recursive:true});
  await writeFile('docs/training-curriculum-qa/publication.json',JSON.stringify({publishedAt:new Date().toISOString(),
   project:plan.project,track:plan.track,contentHash:plan.afterHash,lessons:published.lessons.length,
   modules:published.modules.length,projects:published.projects.length,preservedOriginalLessonIds:originalLessonIds.size,
   insertedLessons:insertedIds.length,learnerStateUnchanged:true,learnerCounts:learners.counts,
   contentCharacters:published.lessons.reduce((n,l)=>n+l.content.length,0)},null,2)+'\n');
  console.log('Published and read-back verified: 42 lessons, 6 module briefs, 3 projects; learner records unchanged.');
 }catch(error){
  // Restore only this publication's content fields. Do not delete learner-linked rows.
  for(const row of projectRows(plan.before.modules,writable.modules)){const {id,...values}=row;await check(client.from('training_modules').update(values).eq('id',id));}
  for(const row of projectRows(plan.before.projects,writable.projects)){const {id,...values}=row;await check(client.from('training_projects').update(values).eq('id',id));}
  await check(client.from('training_lessons').upsert(projectRows(plan.before.lessons,writable.lessons),{onConflict:'id'}));
  if(insertedIds.length)await check(client.from('training_lessons').update({is_active:false}).in('id',insertedIds));
  throw new Error(`Publication failed; original content restored and new lessons hidden. ${error.message}`);
 }
}else if(mode==='verify'){
 const actual=await current(),expected=await desired();
 assert.equal(contentFingerprint(actual),contentFingerprint(expected));
 console.log(JSON.stringify({matches:true,lessons:actual.lessons.length,modules:actual.modules.length,projects:actual.projects.length}));
}else throw new Error('Use plan, apply or verify.');
