// Integration tests use an isolated temporary course and disposable Auth users.
// No existing course, enrollment, profile or assessment is changed.
import {createClient} from '@supabase/supabase-js';
import {randomUUID,randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env.local');
const url=process.env.SUPABASE_URL,key='sb_publishable_dW6VM2wj55-8rysyeIRubQ_s--GnMD7';
const service=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=async p=>{const r=await p;if(r.error)throw new Error(r.error.message);return r.data;};
const report=[],test=async(name,fn)=>{await fn();report.push({name,passed:true});console.log('PASS',name);};
const mode=process.argv[2]||'seed';
const file='tmp/training-production-fixture.json';
if(mode==='cleanup'){
 const x=JSON.parse(await fs.readFile(file,'utf8'));
 if(x.cleaned){console.log('QA fixture already cleaned.');process.exit(0);}
 assert.ok(x.track?.slug?.startsWith('atlas-qa-'),'Cleanup requires an isolated Atlas QA course.');
 const actualTrack=await ok(service.from('training_tracks').select('slug').eq('id',x.track.id).maybeSingle());
 assert.ok(!actualTrack||actualTrack.slug===x.track.slug,'Refusing to remove a different course.');
 for(const u of x.users){assert.match(u.email,/^atlas-qa-(admin|student|outsider|reviewer)-[a-z0-9]{8}@example\.com$/);const {user}=await ok(service.auth.admin.getUserById(u.id));assert.equal(user.email,u.email,'Refusing to remove a different Auth identity.');}
 if(x.project){const p=await ok(service.from('training_projects').select('slug').eq('id',x.project.id).maybeSingle());assert.ok(!p||p.slug===x.project.slug&&p.slug.startsWith('atlas-qa-'),'Refusing to remove a different project.');}
 if(x.track)await ok(service.from('training_enrollments').delete().eq('track_id',x.track.id));
 if(x.track)await ok(service.from('training_tracks').delete().eq('id',x.track.id));
 if(x.project)await ok(service.from('training_projects').delete().eq('id',x.project.id));
 for(const u of x.users)await ok(service.auth.admin.deleteUser(u.id));
 await fs.writeFile(file,JSON.stringify({cleaned:true,at:new Date().toISOString()}));
 console.log('Disposed of the isolated Atlas QA course and test identities.');process.exit(0);
}
if(mode==='links'){
 const x=JSON.parse(await fs.readFile(file,'utf8'));x.login={};
 for(const u of x.users){const data=await ok(service.auth.admin.generateLink({type:'magiclink',email:u.email,options:{redirectTo:'https://www.sail-research.com/training/'}}));x.login[u.name]={email:u.email,tokenHash:data.properties.hashed_token};x.redirectTo=new URL(data.properties.action_link).searchParams.get('redirect_to');}
 await fs.writeFile(file,JSON.stringify(x,null,2));console.log('Fresh test sign-in links saved locally. Production email redirect:',x.redirectTo);process.exit(0);
}
if(mode==='complete'){
 const x=JSON.parse(await fs.readFile(file,'utf8')),apis={};
 for(const name of ['student','reviewer']){const u=x.users.find(u=>u.name===name),data=await ok(service.auth.admin.generateLink({type:'magiclink',email:u.email})),c=client();await ok(c.auth.verifyOtp({token_hash:data.properties.hashed_token,type:'email'}));apis[name]=c;}
 for(const target of [...x.modules.filter(m=>m.pillar!=='project').map(m=>({module_id:m.id})),{project_id:x.project.id}]){
  let sub=(await ok(service.from('training_submissions').select('*').eq('enrollment_id',x.enrollment.id).eq(target.module_id?'module_id':'project_id',target.module_id||target.project_id).order('submitted_at',{ascending:false}).order('id',{ascending:false}).limit(1)))[0];
  if(!sub)sub=await ok(apis.student.rpc('submit_training_work',{target_enrollment_id:x.enrollment.id,target_module_id:target.module_id||null,target_project_id:target.project_id||null,submission_drive_url:'https://drive.google.com/',submission_note:'Disposable certificate rendering verification.'}));
  await ok(apis.reviewer.rpc('review_training_submission',{target_submission_id:sub.id,review_result:'pass',review_comment:'Disposable QA completion: required artifacts accepted for certificate rendering verification.'}));
 }
 const cert=await ok(service.from('training_certificates').select('*').eq('enrollment_id',x.enrollment.id).single());x.certificateCode=cert.certificate_code;await fs.writeFile(file,JSON.stringify(x,null,2));console.log('Disposable QA student completed; certificate ready for browser verification.');process.exit(0);
}
const suffix=randomUUID().slice(0,8),users=[],apis={};
for(const name of ['admin','student','outsider','reviewer']){
 const email=`atlas-qa-${name}-${suffix}@example.com`,password=randomBytes(30).toString('base64url');
 const {user}=await ok(service.auth.admin.createUser({email,password,email_confirm:true}));
 const profile=await ok(service.from('training_profiles').insert({auth_user_id:user.id,email,full_name:name==='student'?'Atlas QA Student':name==='admin'?'Atlas QA Admin':name==='reviewer'?'Atlas QA Reviewer':'Atlas QA Outsider',role:name==='outsider'?'student':name}).select().single());
 const api=client();await ok(api.auth.signInWithPassword({email,password}));users.push({name,id:user.id,email,profile,password});apis[name]=api;
}
const a=apis.admin,s=apis.student,o=apis.outsider,r=apis.reviewer;
const track=await ok(a.from('training_tracks').insert({slug:`atlas-qa-${suffix}`,title:'Atlas QA — disposable training course',description:'Isolated deployment verification. No real student records.',duration_weeks_min:4,duration_weeks_max:6,is_active:true}).select().single());
await fs.writeFile(file,JSON.stringify({users,track},null,2));
const spec=[['Math Foundations','math'],['Deep Learning','deep_learning'],['Trustworthy AI','trustworthy_ai'],['Distributed & Federated Learning','distributed_learning'],['Efficient Machine Learning','efficient_ml'],['Mini-project','project']];
const modules=await ok(a.from('training_modules').insert(spec.map(([title,pillar],i)=>({track_id:track.id,title,pillar,slug:`chapter-${i+1}`,order_index:(i+1)*10,description:`${title}: connect your assumptions to a careful experiment.`,outcomes:'Identify the assumptions behind a result.\nBuild a reproducible comparison.\nReport evidence and limitations.',assignment_brief:'Create a reproducible experiment. Include the code, environment, a short report, a baseline comparison and discussion of limitations.'}))).select());
const lessons=await ok(a.from('training_lessons').insert(modules.flatMap(m=>[{module_id:m.id,title:m.pillar==='trustworthy_ai'?'Backdoor attacks & defenses':`${m.title} — reading`,lesson_type:'Reading',description:'Read the source material and explain its assumptions.',content:'Start with the research question.\n\nIdentify what is assumed about the data, model and evaluation. Keep those assumptions separate from the observations.\n\nRead the evaluation carefully. Record the baseline, metrics, dataset split and implementation choices.\n\nWrite a short critique that makes one limitation and one follow-up experiment explicit.',order_index:10},{module_id:m.id,title:m.pillar==='trustworthy_ai'?'A controlled robustness experiment':`${m.title} — practical`,lesson_type:'Practical',description:'Run a focused comparison and make the evidence reproducible.',content:'Define a small experiment before you implement it.\n\nKeep the setup fixed across the baseline and the intervention. Record the configuration, dependencies, random seeds and metrics.\n\nSeparate observed changes from conclusions. Describe what the experiment does and does not establish.',order_index:20}])).select());
const project=await ok(a.from('training_projects').insert({title:'Atlas QA — Robustness under distribution shift',slug:`atlas-qa-${suffix}`,pillar:'trustworthy_ai',difficulty:'standard',description:'Investigate how a model’s behavior changes when evaluation conditions differ from training.',expected_output:'Code, a short report and slides. Include the question, method, evidence, limitations and reproduction instructions.',created_by_profile_id:users[0].profile.id}).select().single());
const invite=await ok(a.from('training_invites').insert({track_id:track.id,email_allowed:users[1].email,max_uses:1,expires_at:new Date(Date.now()+86400000).toISOString(),created_by_profile_id:users[0].profile.id}).select().single());
const fixture={users,track,modules,lessons,project,invite,login:{}};
await fs.writeFile(file,JSON.stringify(fixture,null,2));
const denied=async(p)=>assert.ok((await p).error,'Expected server-side denial');
let e,submissions=[];
await test('Anonymous access cannot read training records or submit work',async()=>{
 const anon=client();for(const table of ['training_profiles','training_modules']){const v=await anon.from(table).select('*');assert.ok(v.error||v.data.length===0);}await denied(anon.rpc('submit_training_work',{target_enrollment_id:randomUUID()}));
});
await test('Invite binds verified email; wrong student cannot enroll',async()=>{
 await denied(o.rpc('enroll_training',{invite_token:invite.token,full_name:'Wrong student'}));
 e=await ok(s.rpc('enroll_training',{invite_token:invite.token,full_name:'Atlas QA Student',affiliation:'VinUniversity'}));fixture.enrollment=e;
 assert.equal(e.track_id,track.id);assert.equal(Math.round((new Date(e.deadline_at)-new Date(e.created_at))/86400000),42);
});
await test('Student cannot edit curriculum, escalate roles or see another student',async()=>{
 const rows=await ok(s.from('training_modules').update({title:'Unauthorized'}).eq('id',modules[0].id).select());assert.equal(rows.length,0);
 await denied(s.from('training_profiles').update({role:'admin'}).eq('id',users[1].profile.id));
 await denied(s.rpc('set_training_staff_role',{target_profile_id:users[1].profile.id,new_role:'admin'}));
 assert.deepEqual(await ok(o.from('training_enrollments').select('*')),[]);assert.deepEqual(await ok(o.from('training_modules').select('*')),[]);
});
await test('Admin edits courses and lessons; reviewer cannot edit curriculum',async()=>{
 await ok(a.from('training_lessons').update({content:lessons[0].content+'\n\nDocument your next question.'}).eq('id',lessons[0].id));
 assert.equal((await ok(r.from('training_modules').update({title:'Unauthorized'}).eq('id',modules[0].id).select())).length,0);
 await ok(a.rpc('update_training_enrollment',{target_enrollment_id:e.id,new_deadline:e.deadline_at,new_project_id:project.id,new_reviewer_id:users[3].profile.id}));
});
await test('Lesson progress and submission drafts persist behind ownership policies',async()=>{
 await ok(s.from('training_lesson_progress').insert({enrollment_id:e.id,lesson_id:lessons[0].id}));
 await ok(s.from('training_drafts').upsert({enrollment_id:e.id,target_key:modules[0].id,drive_url:'https://drive.google.com/',note:'Private QA draft'}));
 assert.equal((await ok(s.from('training_drafts').select('*'))).length,1);assert.deepEqual(await ok(o.from('training_drafts').select('*')),[]);
 await denied(o.from('training_drafts').insert({enrollment_id:e.id,target_key:modules[0].id}));
});
const send=(m)=>s.rpc('submit_training_work',{target_enrollment_id:e.id,target_module_id:m,submission_drive_url:'https://drive.google.com/',submission_note:'Isolated QA submission — no real assessment.'});
const grade=(sub,result)=>r.rpc('review_training_submission',{target_submission_id:sub.id,review_result:result,review_comment:`QA ${result}: reproducibility checked using disposable artifacts.`});
await test('Server enforces HTTPS, target assignment, pending review and revision-only resubmission',async()=>{
 await denied(s.rpc('submit_training_work',{target_enrollment_id:e.id,target_module_id:modules[0].id,submission_drive_url:'javascript:alert(1)'}));
 const sub=await ok(send(modules[0].id));submissions.push(sub);await denied(send(modules[0].id));
 await denied(s.rpc('review_training_submission',{target_submission_id:sub.id,review_result:'excellent',review_comment:'Self review'}));
 await ok(grade(sub,'fail'));await denied(send(modules[0].id));await ok(grade(sub,'revision'));
 const revised=await ok(send(modules[0].id));submissions[0]=revised;await denied(grade(sub,'pass'));await ok(grade(revised,'pass'));await denied(send(modules[0].id));
});
await test('Hard deadline is enforced by database, including lesson progress',async()=>{
 await ok(service.from('training_enrollments').update({deadline_at:new Date(Date.now()-1000).toISOString()}).eq('id',e.id));
 await denied(send(modules[1].id));await denied(s.from('training_lesson_progress').insert({enrollment_id:e.id,lesson_id:lessons[1].id}));
 await ok(service.from('training_enrollments').update({deadline_at:e.deadline_at}).eq('id',e.id));
});
await test('Certificate requires all required modules and assigned project; issue and revoke follow real reviews',async()=>{
 await denied(a.rpc('set_training_final_result',{target_enrollment_id:e.id,target_result:'pass'}));
 for(const m of modules.filter(m=>m.pillar!=='project').slice(1)){const sub=await ok(send(m.id));submissions.push(sub);await ok(grade(sub,'excellent'));}
 const psub=await ok(s.rpc('submit_training_work',{target_enrollment_id:e.id,target_project_id:project.id,submission_drive_url:'https://drive.google.com/'}));submissions.push(psub);await ok(grade(psub,'excellent'));
 const cert=await ok(s.from('training_certificates').select('*').eq('enrollment_id',e.id).single());assert.equal(cert.result,'pass');
 const anon=client();assert.equal((await ok(anon.rpc('verify_training_certificate',{lookup_code:cert.certificate_code}))).length,1);
 await ok(grade(submissions[2],'revision'));assert.equal((await ok(anon.rpc('verify_training_certificate',{lookup_code:cert.certificate_code}))).length,0);
 fixture.certificateCode=cert.certificate_code;
});
// Restore the QA fixture to the source overview's 2-complete / revision state.
for(const sub of submissions.slice(3))await ok(service.from('training_submissions').delete().eq('id',sub.id));
await ok(service.from('training_reviews').delete().eq('submission_id',submissions[1].id));
await ok(grade(submissions[1],'pass'));
for(const u of users){const data=await ok(service.auth.admin.generateLink({type:'magiclink',email:u.email,options:{redirectTo:'https://www.sail-research.com/training/'}}));fixture.login[u.name]={email:u.email,tokenHash:data.properties.hashed_token};fixture.redirectTo=new URL(data.properties.action_link).searchParams.get('redirect_to');}
fixture.submissions=submissions;await fs.writeFile(file,JSON.stringify(fixture,null,2));
await fs.mkdir('docs/training-production-qa',{recursive:true});await fs.writeFile('docs/training-production-qa/integration-results.json',JSON.stringify({at:new Date().toISOString(),tests:report},null,2));
console.log(`${report.length} production integration checks passed. Disposable fixture retained for browser QA. Redirect: ${fixture.redirectTo}`);
