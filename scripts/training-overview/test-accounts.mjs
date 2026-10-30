// Real endpoint tests. Credentials stay exclusively in ignored tmp/ fixtures.
import {createClient} from '@supabase/supabase-js';
import {randomBytes,randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env.local');
const url=process.env.SUPABASE_URL,key='sb_publishable_dW6VM2wj55-8rysyeIRubQ_s--GnMD7';
const service=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=async p=>{const r=await p;if(r.error)throw new Error(r.error.message);return r.data;};
const fixturePath='tmp/training-account-fixture.json',report=[];
if(process.argv[2]==='cleanup'){
 const f=JSON.parse(await fs.readFile(fixturePath,'utf8'));
 if(f.cleaned){console.log('Account QA already cleaned.');process.exit(0);}
 assert.match(f.email,/^atlas-qa-provisioned-[a-z0-9]{8}@example\.com$/);
 const users=await ok(service.auth.admin.listUsers({page:1,perPage:1000}));
 for(const user of users.users.filter(u=>u.email===f.email))await ok(service.auth.admin.deleteUser(user.id));
 if(f.extraTrack){const track=await ok(service.from('training_tracks').select('slug').eq('id',f.extraTrack.id).maybeSingle());assert.ok(!track||track.slug===f.extraTrack.slug&&track.slug.startsWith('atlas-qa-'));if(track)await ok(service.from('training_tracks').delete().eq('id',f.extraTrack.id));}
 await fs.writeFile(fixturePath,JSON.stringify({cleaned:true,at:new Date().toISOString()}));console.log('Removed isolated account QA resources.');process.exit(0);
}
const base=JSON.parse(await fs.readFile('tmp/training-production-fixture.json','utf8'));
assert.ok(!base.cleaned&&base.track.slug.startsWith('atlas-qa-'));
const apis={},tokens={};
for(const role of ['admin','student','reviewer']){const u=base.users.find(u=>u.name===role);assert.ok(u.password,'Recreate the QA fixture to retain its local password.');const api=client();const auth=await ok(api.auth.signInWithPassword({email:u.email,password:u.password}));apis[role]=api;tokens[role]=auth.session.access_token;}
const request=async(token,body,origin='https://www.sail-research.com')=>{const response=await fetch(url+'/functions/v1/training-accounts',{method:'POST',headers:{apikey:key,'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{}),origin},body:JSON.stringify(body)});return {status:response.status,data:await response.json(),headers:response.headers};};
const test=async(name,fn)=>{await fn();report.push({name,passed:true});console.log('PASS',name);};
const suffix=randomUUID().slice(0,8),email=`atlas-qa-provisioned-${suffix}@example.com`,password=randomBytes(21).toString('base64url');
const f={email,password,baseTrackId:base.track.id};await fs.writeFile(fixturePath,JSON.stringify(f,null,2));
const payload={action:'create_student',email,password,full_name:'Atlas Provisioned Student',affiliation:'VinUniversity',track_id:base.track.id};
await test('Public self-signup is disabled while admin-issued accounts need no confirmation email',async()=>{
 const settings=await(await fetch(url+'/auth/v1/settings',{headers:{apikey:key}})).json();assert.equal(settings.disable_signup,true);assert.equal(settings.mailer_autoconfirm,false);
 const signup=await client().auth.signUp({email,password});assert.ok(signup.error);assert.equal(signup.error.code,'signup_disabled');
});
await test('Endpoint rejects missing/forged JWTs, student/reviewer callers and a foreign browser origin',async()=>{
 assert.equal((await request(null,payload)).status,401);assert.equal((await request('not-a-jwt',payload)).status,401);
 assert.equal((await request(tokens.student,payload)).status,403);assert.equal((await request(tokens.reviewer,payload)).status,403);
 assert.equal((await request(tokens.admin,payload,'https://untrusted.example')).status,403);
});
await test('Student provisioning rejects role injection, invalid passwords and inactive or missing courses',async()=>{
 assert.equal((await request(tokens.admin,{...payload,role:'admin'})).status,400);
 assert.equal((await request(tokens.admin,{...payload,password:'short'})).status,400);
 assert.equal((await request(tokens.admin,{...payload,track_id:randomUUID()})).status,400);
 const extraTrack=await ok(service.from('training_tracks').insert({slug:`atlas-qa-extra-${suffix}`,title:'Atlas QA — additional password course',is_active:false}).select().single());f.extraTrack=extraTrack;await fs.writeFile(fixturePath,JSON.stringify(f,null,2));
 assert.equal((await request(tokens.admin,{...payload,track_id:extraTrack.id})).status,400);
 await ok(service.from('training_tracks').update({is_active:true}).eq('id',extraTrack.id));
 assert.equal((await ok(service.from('training_profiles').select('id').eq('email',email))).length,0);
});
await test('An admin issues a confirmed password account and enrollment without sending email',async()=>{
 const r=await request(tokens.admin,payload);assert.equal(r.status,201,JSON.stringify(r.data));assert.ok(!JSON.stringify(r.data).includes(password));
 f.enrollment=r.data.enrollment;f.profile=await ok(service.from('training_profiles').select('*').eq('email',email).single());
 f.id=f.profile.auth_user_id;await fs.writeFile(fixturePath,JSON.stringify(f,null,2));
 assert.equal(f.profile.role,'student');assert.equal(f.enrollment.invite_id,null);assert.equal(f.enrollment.track_id,base.track.id);
 assert.equal(Math.round((new Date(f.enrollment.deadline_at)-new Date(f.enrollment.created_at))/86400000),base.track.duration_weeks_max*7);
 const {user}=await ok(service.auth.admin.getUserById(f.id));assert.ok(user.email_confirmed_at);assert.ok(!user.confirmation_sent_at&&!user.invited_at);
 const issued=client();await ok(issued.auth.signInWithPassword({email,password}));await ok(issued.auth.signOut());
 assert.equal(r.headers.get('access-control-allow-origin'),'https://www.sail-research.com');assert.equal(r.headers.get('cache-control'),'no-store');
});
await test('Duplicate creation preserves the original password and enrollment',async()=>{
 assert.equal((await request(tokens.admin,{...payload,password:randomBytes(21).toString('base64url')})).status,409);
 const original=client();await ok(original.auth.signInWithPassword({email,password}));await ok(original.auth.signOut());
 assert.equal((await ok(service.from('training_enrollments').select('id').eq('profile_id',f.profile.id))).length,1);
});
await test('Existing enrollment is idempotent; additional course uses the same account and password',async()=>{
 const r=await request(tokens.admin,{action:'enroll_student',profile_id:f.profile.id,track_id:base.track.id});assert.equal(r.status,200);assert.equal(r.data.enrollment.id,f.enrollment.id);assert.equal(r.data.enrollment.deadline_at,f.enrollment.deadline_at);
 const second=await request(tokens.admin,{action:'enroll_student',profile_id:f.profile.id,track_id:f.extraTrack.id});assert.equal(second.status,200);assert.notEqual(second.data.enrollment.id,f.enrollment.id);
 const student=client();await ok(student.auth.signInWithPassword({email,password}));assert.equal((await ok(student.from('training_enrollments').select('id'))).length,2);await ok(student.auth.signOut());
});
await test('Admin can reset a student password; old password stops working and staff accounts are protected',async()=>{
 const target={action:'reset_password',profile_id:f.profile.id,password:randomBytes(21).toString('base64url')};
 assert.equal((await request(tokens.student,target)).status,403);assert.equal((await request(tokens.reviewer,target)).status,403);
 assert.equal((await request(tokens.admin,{...target,profile_id:base.users.find(u=>u.name==='admin').profile.id})).status,403);
 assert.equal((await request(tokens.admin,{...target,password:'short'})).status,400);
 const r=await request(tokens.admin,target);assert.equal(r.status,200);assert.ok(r.data.password_updated);assert.ok(!JSON.stringify(r.data).includes(target.password));
 assert.ok((await client().auth.signInWithPassword({email,password})).error);f.password=target.password;await fs.writeFile(fixturePath,JSON.stringify(f,null,2));
 const student=client();await ok(student.auth.signInWithPassword({email,password:f.password}));await ok(student.auth.signOut());
});
await test('Direct provisioning RPC and editable user metadata cannot bypass admin authorization',async()=>{
 const args={target_auth_user_id:f.id,student_email:email,student_name:'Attempt',student_affiliation:'',target_track_id:base.track.id};
 for(const api of [client(),apis.student,apis.admin])assert.ok((await api.rpc('provision_training_student',args)).error);
 await ok(apis.student.auth.updateUser({data:{role:'admin'}}));const session=await ok(apis.student.auth.getSession());assert.equal((await request(session.session.access_token,{action:'reset_password',profile_id:f.profile.id,password:randomBytes(21).toString('base64url')})).status,403);
});
await fs.mkdir('docs/training-production-qa',{recursive:true});await fs.writeFile('docs/training-production-qa/account-results.json',JSON.stringify({at:new Date().toISOString(),tests:report},null,2));
console.log(`${report.length} account-management integration groups passed. Disposable credentials retained only under ignored tmp/ for desktop QA.`);
