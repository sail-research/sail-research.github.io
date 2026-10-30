import { createClient, type Session } from '@supabase/supabase-js';
import {config,type PortalData,type Row,escape as h,date,title,initials,asset,button,field,submit,empty,external,href,isAdmin,isStaff,myEnrollment,trackModules,completedCount,moduleGrade,safeUrl,slug,latestReview,latestSubmission} from './training-live/shared';
import * as student from './training-live/student';
import * as admin from './training-live/admin';
import { lessonContent } from './training-live/lesson-content';
import {studentAccountForm,studentAccountDialog,enrollmentForm,signInDetails} from './training-live/accounts';
import { designScreens } from '../data/trainingDesigns';

const supabase=createClient(config.url,config.key,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
const root=document.querySelector<HTMLElement>('#training-root')!;
const dialog=document.querySelector<HTMLDialogElement>('[data-training-dialog]')!;
const dialogContent=document.querySelector<HTMLElement>('[data-training-dialog-content]')!;
const toast=document.querySelector<HTMLElement>('[data-training-toast]')!;
const d:PortalData={profile:null,user:null,tracks:[],modules:[],lessons:[],projects:[],enrollments:[],profiles:[],submissions:[],reviews:[],certificates:[],progress:[],drafts:[],reviewDrafts:[]};
const certificatePage=document.body.hasAttribute('data-certificate-page');
let session:Session|null=null,ready=false,view='',params=new URLSearchParams(),certificate:Row|null=null,verifyCode=new URL(location.href).searchParams.get('code')||'',verifyChecked=false,toastTimer:ReturnType<typeof setTimeout>,revision=0,navigationSequence=0;
const staffViews=['operations','students','student','curriculum','projects','reviews','review'];
const adminViews=['curriculum','projects'];
const checkResult=async(result:any)=>{const r=await result;if(r.error)throw new Error(r.error.message);return r.data;};
function notify(message:string){toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,5500);}
function sizeTextareas(scope:ParentNode){scope.querySelectorAll<HTMLTextAreaElement>('textarea.ds-input').forEach(el=>{el.style.height='auto';el.style.height=`${Math.min(el.name==='content'?600:1200,Math.max(105,el.scrollHeight+2))}px`;});}
function openDialog(content:string){dialogContent.innerHTML=content;if(!dialog.open)dialog.showModal();sizeTextareas(dialog);dialog.querySelector<HTMLElement>('input,select,textarea,button')?.focus();}
function closeDialog(){dialog.close();dialogContent.innerHTML='';}
function route(next:string,p:Record<string,string>={}){navigationSequence++;const hash=href(next,p);if(location.hash===hash)render();else location.hash=hash;}
function selectedModule(){const e=myEnrollment(d);const tid=params.get('track')||e?.track_id||d.tracks[0]?.id;return d.modules.find(m=>m.id===params.get('module')&&(isStaff(d)||m.track_id===tid&&m.is_active))||d.modules.find(m=>m.track_id===tid&&(isStaff(d)||m.is_active)&&!['pass','excellent'].includes(e?moduleGrade(d,e,m):''))||d.modules.find(m=>m.track_id===tid&&(isStaff(d)||m.is_active));}
async function load(){
 const current=++revision;
 const {data:auth,error}=await supabase.auth.getUser();
 if(error||!auth.user){session=null;d.user=null;d.profile=null;for(const k of ['tracks','modules','lessons','projects','enrollments','profiles','submissions','reviews','certificates','progress','drafts','reviewDrafts']) (d as any)[k]=[];return;}
 d.user=auth.user;
 let profile=await checkResult(supabase.from('training_profiles').select('*').eq('auth_user_id',auth.user.id).maybeSingle());
 if(!profile){d.profile=null;for(const k of ['tracks','modules','lessons','projects','enrollments','profiles','submissions','reviews','certificates','progress','drafts','reviewDrafts'])(d as any)[k]=[];return;}
 d.profile=profile;
 try{d.selectedEnrollmentId=sessionStorage.getItem(`sail-training-course-${profile.id}`)||'';}catch{d.selectedEnrollmentId='';}
 const names=['tracks','modules','lessons','projects','enrollments','profiles','submissions','reviews','certificates','lesson_progress','drafts',...(isStaff(d)?['review_drafts']:[])];
 const results=await Promise.all(names.map(async name=>{let query=supabase.from(`training_${name}`).select('*');if(name==='submissions')query=query.order('submitted_at',{ascending:false}).order('id',{ascending:false});else if(name==='reviews')query=query.order('reviewed_at',{ascending:false}).order('id',{ascending:false});else if(['modules','lessons'].includes(name))query=query.order('order_index');else if(name==='enrollments')query=query.order('created_at',{ascending:false});return [name,await checkResult(query)] as const;}));
 if(current!==revision)return;
 for(const [name,data] of results)(d as any)[name==='lesson_progress'?'progress':name==='review_drafts'?'reviewDrafts':name]=data||[];
 for(const record of [...d.modules,...d.lessons,...d.projects]){if(record.material_url){try{record.material_url=safeUrl(record.material_url);}catch{record.material_url=null;}}}
 if(!isStaff(d))d.reviewDrafts=[];
}
async function reload(){await load();render();}
function nav(){
 if(!d.user||view==='verify')return '';
 const links=isStaff(d)?[['Overview','operations'],['Students','students'],...(isAdmin(d)?[['Curriculum','curriculum'],['Projects','projects']]:[]),['Reviews','reviews']]:[['Overview','overview'],['Curriculum','module'],[view==='overview'?'My submissions':'Submissions','feedback']];
 return `<nav aria-label="Training navigation">${links.map(([label,id])=>`<a href="${href(id)}" class="${view===id||(view==='review'&&id==='reviews')||(view==='student'&&id==='students')?'selected':''}" ${view===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
const headings:Record<string,[string,string,string]>={enrollment:['Your research journey begins here.','A guided path from foundations to your first research project.','Your enrollment'],module:['Look beyond the headline accuracy.','Build the knowledge and habits behind a careful research argument.','Module overview'],lesson:['Read carefully. Think critically.','Connect the ideas to evidence and a reproducible experiment.','Lesson'],assignment:['Show the work. Explain the evidence.','A focused experiment, a clear argument, and the materials to reproduce it.','Assignment'],feedback:['Every review is a step forward.','Review your outcomes, feedback, and submission history.','Submissions & feedback'],project:['Bring your foundations together.','A small, thoughtful research project that connects learning with evidence.','Mini-project'],result:['A foundation for what comes next.','Your program outcome and verified record of completion.','Program result'],operations:['Good learning needs thoughtful guidance.','A shared view of students, submissions, and the next useful action.','Operations overview'],students:['Every learner, at a glance.','Follow each student’s progress through the research training program.','Students'],student:['A foundation in progress.','Learning progress, feedback, and the next step for this student.','Student detail'],curriculum:['Shape a thoughtful learning path.','Organize the foundations, reading, experiments, and the three SAIL pillars.','Curriculum editor'],projects:['A first question. A real experiment.','A library of focused research opportunities for the final assessment.','Project library'],reviews:['A clear outcome. A useful next step.','Read the evidence and give students feedback they can act on.','Review queue'],review:['Review the evidence. Guide the next step.','A useful review makes the reasoning clear and the next action possible.','Submission review']};
// Reuse the approved screen copy; identity, module names and outcomes stay live.
for(const s of designScreens)headings[s.id]=[s.heading,s.description,s.title];
headings.login[2]='Sign in';
function render(){
 if(!ready)return;
 const [hash,query='']=location.hash.slice(1).split('?');params=new URLSearchParams(query);view=certificatePage?'verify':(hash==='training-main'?'':hash)||(!d.user?'login':isStaff(d)?'operations':myEnrollment(d)?'overview':'enrollment');
 if(view!=='verify'){
  if(!d.user)view='login';
  else if(!isStaff(d)&&!myEnrollment(d))view='enrollment';
  else if(staffViews.includes(view)&&!isStaff(d))view='overview';
  else if(adminViews.includes(view)&&!isAdmin(d))view='operations';
  else if(isStaff(d)&&['overview','module','lesson','assignment','project','result','feedback','enrollment','login'].includes(view))view='operations';
 }
 const publicView=['login','verify'].includes(view),e=myEnrollment(d),m=selectedModule();
 let content='',isOverview=view==='overview'&&e;
 if(view==='login')content=student.login(d);
 else if(view==='enrollment')content=student.enrollment(d);
 else if(view==='verify')content=student.verify(certificate,verifyCode,verifyChecked);
 else if(isOverview)content=student.overview(d,e!,m!);
 else if(view==='module'&&e)content=m?(m.pillar==='project'?student.project(d,e):student.moduleView(d,e,m)):empty('No modules published for your track yet.');
 else if(view==='lesson'&&e){const l=d.lessons.find(x=>x.id===params.get('lesson')&&x.module_id===m?.id&&x.is_active)||d.lessons.find(x=>x.module_id===m?.id&&x.is_active);content=m&&l?student.lessonView(d,e,m,l):empty('This lesson is unavailable.');}
 else if(view==='assignment'&&e)content=m?(m.pillar==='project'?student.project(d,e):student.assignment(d,e,m)):empty('This module is unavailable.');
 else if(view==='feedback'&&e)content=student.feedback(d,e,params.get('target')||'');
 else if(view==='project'&&e)content=student.project(d,e);
 else if(view==='result'&&e)content=student.result(d,e);
 else if(view==='operations')content=admin.operations(d);
 else if(view==='students')content=admin.studentsTable(d);
 else if(view==='student'){const enrolled=d.enrollments.find(x=>x.id===params.get('enrollment'))||d.enrollments[0];content=enrolled?admin.student(d,enrolled):empty('No students enrolled yet.');}
 else if(view==='curriculum')content=admin.curriculum(d,m,params.get('track')||'');
 else if(view==='projects')content=admin.projects(d,params.get('project')||'');
 else if(view==='review')content=admin.review(d,d.submissions.find(x=>x.id===params.get('submission')));
 else if(view==='reviews')content=`<form class="tp-filters" data-form="queue-filter">${field('Review status','status',params.get('status')||'submitted','select',{options:[['submitted','Waiting for review'],['all','All outcomes'],['revision','Revision'],['pass','Pass'],['excellent','Excellent'],['fail','Fail']]})}${submit('Filter reviews')}</form>${admin.queue(d,params.get('status')||'submitted')}`;
 else content=empty('This workspace is unavailable. Use the navigation to continue.');
 const heading=headings[view]&&[...headings[view]];let customHeading=heading?.[0];
 if(view==='module'&&m){customHeading=m.title;heading![1]=m.description||heading![1];}
 if(view==='assignment'&&m){customHeading=m.pillar==='trustworthy_ai'?'A controlled robustness experiment':`${m.title} — assignment`;}
 if(view==='lesson'){const l=d.lessons.find(l=>l.id===params.get('lesson'));customHeading=l?.title||m?.title||'Lesson';heading![1]=l?.description||'Read carefully and connect the ideas to evidence.';}
 if(view==='student'){const enrolled=d.enrollments.find(x=>x.id===params.get('enrollment'))||d.enrollments[0],p=d.profiles.find(p=>p.id===enrolled?.profile_id);customHeading=p?.full_name||'Student';heading![1]=`${p?.affiliation||'Undergraduate research training'} · ${p?.email||''} · Enrolled ${date(enrolled?.start_date)}`;}
 if(view==='result'&&e&&!d.certificates.some(c=>c.enrollment_id===e.id&&!c.revoked_at)){customHeading='Your learning journey continues.';heading![1]='Review your program progress and the foundations to strengthen next.';}
 if(view==='feedback'&&e){const s=params.get('target')?latestSubmission(d,e.id,params.get('target')!):d.submissions.find(s=>s.enrollment_id===e.id),r=latestReview(d,s);if(!r){customHeading='Your work is ready for review.';heading![1]='Your submission history and reviewer feedback appear here.';}else if(r.result==='pass')customHeading='A strong step forward.';else if(r.result==='excellent')customHeading='Thoughtful work. Outstanding progress.';else if(r.result==='fail')customHeading='Build the foundations. Try again stronger.';}
 const profileMarkup=d.user&&view!=='verify'?`<button class="${isOverview?'profile-trigger':'ds-profile-trigger ds-top-profile'}" data-action="profile" aria-label="Open profile menu"><span class="${isOverview?'atlas-avatar':'ds-avatar'}">${initials(d.profile?.full_name||'Student')}</span><span>${h(d.profile?.full_name)}</span>${isOverview?`<img src="${asset('atlas-icon-profile-chevron')}" alt="" />`:''}</button>`:'<span>VinUniversity · SAIL</span>';
 root.innerHTML=`<div class="ds-canvas atlas screen-${h(view)} ${isStaff(d)?'ds-admin':''} ${publicView?'ds-public':''}" data-design-canvas data-family="atlas" data-screen="${h(view)}"><header class="${isOverview?'atlas-topbar':'ds-topbar'}"><a class="${isOverview?'atlas-brand':'ds-wordmark'}" href="/"><img src="${asset('atlas-logo')}" width="104" height="56" alt="SAIL — Security and AI Lab" /><span>Research Academy</span></a>${nav()}<div class="${isOverview?'profile-wrap atlas-profile':'ds-top-profile'}">${profileMarkup}</div></header>${isOverview?content:`<main class="ds-main" id="training-main" tabindex="-1">${!publicView&&heading?`<div class="ds-breadcrumb"><span>${isStaff(d)?'Training operations':'Research training'} <i>/</i> <strong>${heading[2]}</strong></span><time>${date(new Date(),true)}</time></div><header class="ds-page-heading"><div><p class="ds-overline">${isStaff(d)?'Program workspace':['module','lesson','assignment'].includes(view)?h(m?.title):'Your research journey'}</p><h1>${h(customHeading)}</h1><p class="ds-lead">${h(heading[1])}</p></div></header>`:''}${content}</main>`}</div>`;
 root.setAttribute('aria-busy','false');document.title=`${heading?.[2]||title(view)} · SAIL Research Academy`;
 sizeTextareas(root);
}

function requireAdmin(){if(!isAdmin(d))throw new Error('Admin permission is required.');}
function requireStaff(){if(!isStaff(d))throw new Error('Reviewer permission is required.');}
async function manageStudentAccount(payload:Record<string,unknown>){
 const {data,error}=await supabase.functions.invoke('training-accounts',{body:payload});
 if(error){let message='Unable to manage the student account. Please retry.';try{if(error.context instanceof Response)message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
 if(!data||data.error)throw new Error(data?.error||'The account service returned no result.');return data;
}
function showError(form:HTMLFormElement|null,error:unknown){const message=error instanceof Error?error.message:'Something went wrong. Please retry.';const target=form?.querySelector('[data-form-error]');if(target)target.textContent=message;else notify(message);}
function formData(form:HTMLFormElement){const f=new FormData(form);return {str:(key:string)=>String(f.get(key)||'').trim(),bool:(key:string)=>f.has(key),num:(key:string)=>Number(f.get(key)),url:(key:string)=>f.get(key)?safeUrl(f.get(key)):null};}
async function saveSubmissionDraft(form:HTMLFormElement){const f=formData(form),e=myEnrollment(d);if(!e)throw new Error('Enrollment required.');await checkResult(supabase.from('training_drafts').upsert({enrollment_id:e.id,target_key:form.dataset.target,drive_url:f.str('drive_url'),note:f.str('note'),updated_at:new Date().toISOString()}));notify('Draft saved to your account.');}
async function saveReviewDraft(form:HTMLFormElement){requireStaff();const f=formData(form);await checkResult(supabase.from('training_review_drafts').upsert({reviewer_profile_id:d.profile!.id,submission_id:form.dataset.id,result:f.str('result'),comment:f.str('comment'),updated_at:new Date().toISOString()}));notify('Review draft saved privately.');}

document.addEventListener('submit',async event=>{
 const form=(event.target as Element).closest<HTMLFormElement>('form[data-form]');if(!form)return;event.preventDefault();const f=formData(form),type=form.dataset.form!;
 const buttons=[...form.querySelectorAll<HTMLButtonElement>('button')];buttons.forEach(b=>b.disabled=true);form.querySelector('[data-form-error]')?.replaceChildren();
 try{
  if(type==='password-login'){
   const account=f.str('account'),email=account.toLowerCase()==='sailresearch'?'sailresearch@admin.sail-research.com':account;
   await checkResult(supabase.auth.signInWithPassword({email,password:String(new FormData(form).get('password')||'')}));
   await load();closeDialog();route(isStaff(d)?'operations':'overview');render();return;
  }
  if(type==='verify'){verifyCode=f.str('code');certificate=(await checkResult(supabase.rpc('verify_training_certificate',{lookup_code:verifyCode})))?.[0]||null;verifyChecked=true;render();return;}
  if(type==='profile'){if(f.str('full_name').length<2)throw new Error('Enter your full name.');await checkResult(supabase.from('training_profiles').update({full_name:f.str('full_name'),affiliation:f.str('affiliation')}).eq('id',d.profile!.id));await load();closeDialog();render();notify('Profile updated.');return;}
  if(type==='submission'){
   if(!f.bool('consent'))throw new Error('Confirm sharing permissions and reproduction instructions first.');const e=myEnrollment(d)!;
   await checkResult(supabase.rpc('submit_training_work',{target_enrollment_id:e.id,target_module_id:form.dataset.project==='true'?null:form.dataset.target,target_project_id:form.dataset.project==='true'?form.dataset.target:null,submission_drive_url:safeUrl(f.str('drive_url')),submission_note:f.str('note')}));await load();route('feedback',{target:form.dataset.target!});render();notify('Work submitted for review.');return;
  }
  if(type==='queue-filter'){await load();route('reviews',{status:f.str('status')});return;}
  if(type==='choose-track'){route('curriculum',{track:f.str('track')});return;}
  if(type==='review'){requireStaff();await checkResult(supabase.rpc('review_training_submission',{target_submission_id:form.dataset.id,review_result:f.str('result'),review_comment:f.str('comment')}));await reload();notify('Feedback published. The student can now see this review.');return;}
  requireAdmin();
  if(type==='create-student'){
   const password=String(new FormData(form).get('password')||'');
   const result=await manageStudentAccount({action:'create_student',email:f.str('email'),full_name:f.str('full_name'),affiliation:f.str('affiliation'),password,track_id:f.str('track_id')});
   await load();render();openDialog(signInDetails(result.email,password,true));return;
  }
  if(type==='reset-student-password'){
   const password=String(new FormData(form).get('password')||''),profile=d.profiles.find(p=>p.id===form.dataset.id);
   if(!profile||profile.role!=='student')throw new Error('Choose a student account.');
   await manageStudentAccount({action:'reset_password',profile_id:profile.id,password});openDialog(signInDetails(profile.email,password,false));return;
  }
  if(type==='enroll-student'){
   const result=await manageStudentAccount({action:'enroll_student',profile_id:f.str('profile_id'),track_id:f.str('track_id')});
   await load();closeDialog();route('student',{enrollment:result.enrollment.id});render();notify('Student enrollment is ready. Their password is unchanged.');return;
  }
  if(type==='module-details'){await checkResult(supabase.from('training_modules').update({outcomes:f.str('outcomes'),assignment_brief:f.str('assignment_brief'),material_url:f.url('material_url')}).eq('id',form.dataset.id));}
  if(type==='module'||type==='new-module'){
   const payload={title:f.str('title'),pillar:f.str('pillar'),description:f.str('description'),order_index:f.num('order_index'),is_required:type==='module'?f.str('is_required')==='true':f.bool('is_required'),is_active:f.bool('is_active'),...(type==='new-module'?{track_id:form.dataset.context!,slug:slug(f.str('title'))}:{})};
   if(type==='module')await checkResult(supabase.from('training_modules').update(payload).eq('id',form.dataset.id));else {const x=await checkResult(supabase.from('training_modules').insert(payload).select().single());route('curriculum',{module:x.id});}
  }
  if(type==='lesson'){
   const payload={title:f.str('title'),description:f.str('description'),content:f.str('content'),material_url:f.url('material_url'),lesson_type:f.str('lesson_type'),order_index:f.num('order_index'),is_active:f.bool('is_active')};
   await checkResult(form.dataset.id?supabase.from('training_lessons').update(payload).eq('id',form.dataset.id):supabase.from('training_lessons').insert({...payload,module_id:form.dataset.context}));
  }
  if(type==='project'){
   const payload={title:f.str('title'),description:f.str('description'),pillar:f.str('pillar'),difficulty:f.str('difficulty'),material_url:f.url('material_url'),expected_output:f.str('expected_output'),is_active:f.bool('is_active')};
   await checkResult(form.dataset.id?supabase.from('training_projects').update(payload).eq('id',form.dataset.id):supabase.from('training_projects').insert({...payload,slug:slug(f.str('title')),created_by_profile_id:d.profile!.id}));
  }
  if(type==='track'){
   const min=f.num('duration_weeks_min'),max=f.num('duration_weeks_max');if(!Number.isInteger(min)||min<1||max<min||max>52)throw new Error('Choose a valid duration between 1 and 52 weeks.');
   const payload={title:f.str('title'),description:f.str('description'),duration_weeks_min:min,duration_weeks_max:max,is_active:f.bool('is_active')};
   await checkResult(form.dataset.id?supabase.from('training_tracks').update(payload).eq('id',form.dataset.id):supabase.from('training_tracks').insert({...payload,slug:slug(f.str('title'))}));
  }
  if(type==='enrollment'){
   const e=d.enrollments.find(x=>x.id===form.dataset.id)!;
   if(e.assigned_project_id!==f.str('assigned_project_id')&&d.submissions.some(s=>s.enrollment_id===e.id&&s.project_id))throw new Error('This student already submitted a project. Preserve that assignment; review their work before changing it.');
   await checkResult(supabase.rpc('update_training_enrollment',{target_enrollment_id:e.id,new_deadline:new Date(`${f.str('deadline_at')}:00+07:00`).toISOString(),new_project_id:f.str('assigned_project_id')||null,new_reviewer_id:f.str('reviewer_profile_id')||null,new_result:f.str('final_result')||null}));
  }
  if(type==='staff'){if(f.str('profile_id')===d.profile!.id)throw new Error('Ask another admin to change your own role.');await checkResult(supabase.rpc('set_training_staff_role',{target_profile_id:f.str('profile_id'),new_role:f.str('role')}));}
  await load();closeDialog();render();notify('Changes saved to the training program.');
 }catch(error){showError(form,error);}finally{buttons.forEach(b=>b.disabled=false);}
});


document.addEventListener('click',async event=>{
 const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');if(anchor&&dialog.contains(anchor))closeDialog();
 const linkSequence=anchor?++navigationSequence:navigationSequence;
 const [nextView,nextQuery='']=(anchor?.getAttribute('href')||'').slice(1).split('?');
 if(anchor&&d.user&&['feedback','result','reviews'].includes(nextView)){
  event.preventDefault();const sequence=linkSequence;
  try{await load();if(sequence!==navigationSequence)return;const p:Record<string,string>={};new URLSearchParams(nextQuery).forEach((v,k)=>p[k]=v);route(nextView,p);render();}catch(error){showError(null,error);}return;
 }
 const b=(event.target as Element).closest<HTMLElement>('[data-action]');if(!b)return;const action=b.dataset.action,id=b.dataset.id;event.preventDefault();
 try{
  if(action==='close-dialog'){closeDialog();return;}
  if(action==='admin-login'){openDialog(`<h2 id="tp-dialog-title">Program admin sign-in.</h2><p class="ds-small">Use your existing SAIL CMS account or a training account with a password.</p><form data-form="password-login">${field('Account or email','account','sailresearch','text',{required:true})}${field('Password','password','','password',{required:true})}<div class="ds-action-row">${submit('Sign in')}${button('Cancel','close-dialog','',true)}</div><p class="tp-form-error" data-form-error role="alert"></p></form>`);return;}
  if(action==='refresh'){await reload();closeDialog();notify('Workspace refreshed.');return;}
  if(action==='logout'){await checkResult(supabase.auth.signOut());session=null;await load();closeDialog();history.replaceState(null,'','/training/');render();return;}
  if(action==='profile'){openDialog(`<h2 id="tp-dialog-title">${h(d.profile?.full_name)}</h2><p>${h(d.user?.email)} · ${h(title(d.profile?.role))}</p><p class="ds-small">Your account permissions are managed by the SAIL program team.</p>${!isStaff(d)&&myEnrollment(d)?`<div class="ds-action-row"><a class="ds-action secondary" href="#project">My mini-project</a><a class="ds-action secondary" href="#result">My certificate & result</a></div>${d.enrollments.filter(e=>e.profile_id===d.profile?.id).length>1?`<h3 class="ds-lower-heading">Your courses</h3>${d.enrollments.filter(e=>e.profile_id===d.profile?.id).map(e=>`<p>${button(d.tracks.find(t=>t.id===e.track_id)?.title||'Training course','select-enrollment',`data-id="${e.id}"`,true)}</p>`).join('')}`:''}`:''}<div class="ds-action-row">${button('Edit profile','edit-profile','',true)}${button('Sign out','logout')}${button('Close','close-dialog','',true)}</div>`);return;}
  if(action==='edit-profile'){openDialog(`<h2 id="tp-dialog-title">Your profile.</h2><form data-form="profile">${field('Full name','full_name',d.profile?.full_name,'text',{required:true})}${field('Affiliation','affiliation',d.profile?.affiliation)}<div class="ds-action-row">${submit('Save profile')}${button('Cancel','close-dialog','',true)}</div><p class="tp-form-error" data-form-error role="alert"></p></form>`);return;}
  if(action==='select-enrollment'){const e=d.enrollments.find(e=>e.id===id&&e.profile_id===d.profile?.id);if(e){d.selectedEnrollmentId=e.id;try{sessionStorage.setItem(`sail-training-course-${d.profile!.id}`,e.id);}catch{}closeDialog();route('overview');render();}return;}
  if(action==='select-module'){route('overview',{module:id!});return;}
  if(action==='go-lesson'){const l=d.lessons.find(l=>l.id===id);if(l)route('lesson',{module:l.module_id,lesson:l.id});return;}
  if(action==='complete-lesson'){b.setAttribute('disabled','');const e=myEnrollment(d)!;await checkResult(supabase.from('training_lesson_progress').insert({enrollment_id:e.id,lesson_id:id}));await reload();notify('Lesson completed.');return;}
  if(action==='save-submission-draft'){await saveSubmissionDraft(b.closest('form')!);await load();return;}
  if(action==='print-certificate'){window.print();return;}
  if(action==='view-certificate'){const certificate=document.querySelector('.ds-certificate');if(certificate)openDialog(`<h2 id="tp-dialog-title">Your certificate.</h2>${certificate.outerHTML}<div class="ds-action-row">${button('Print / save as PDF','print-certificate')}${button('Close','close-dialog','',true)}</div>`);return;}
  if(action==='select-grade'){const form=b.closest('form')!;form.querySelectorAll('[role="radio"]').forEach(x=>{x.setAttribute('aria-checked',String(x===b));x.classList.toggle('selected',x===b);});form.querySelector<HTMLInputElement>('[name="result"]')!.value=b.dataset.grade!;return;}
  if(action==='save-review-draft'){await saveReviewDraft(b.closest('form')!);return;}
  if(action==='student-submissions'){requireStaff();const list=d.submissions.filter(s=>s.enrollment_id===id&&(!b.dataset.target||s.module_id===b.dataset.target||s.project_id===b.dataset.target));openDialog(`<h2 id="tp-dialog-title">Submission history</h2>${list.map(s=>`<div class="ds-panel"><p>${date(s.submitted_at)}</p>${external('Open submitted work',s.drive_url)}<p>${h(s.note)}</p><a class="tp-link" href="${href('review',{submission:s.id})}" data-action="close-then-review" data-id="${s.id}">Review this version</a></div>`).join('')||empty('No submissions yet.')}`);return;}
  if(action==='close-then-review'){closeDialog();route('review',{submission:id!});return;}
  requireAdmin();
  if(action==='new-student'){openDialog(`<h2 id="tp-dialog-title">Create a student account.</h2>${studentAccountForm(d)}`);return;}
  if(action==='student-account'){const p=d.profiles.find(p=>p.id===id&&p.role==='student');if(!p)throw new Error('Choose a student account.');openDialog(studentAccountDialog(p));return;}
  if(action==='enroll-existing-student'){openDialog(enrollmentForm(d));return;}
  if(action==='generate-password'){const input=b.closest('form')?.querySelector<HTMLInputElement>('[name="password"]');if(input){const random=crypto.getRandomValues(new Uint8Array(18));input.value=Array.from(random,x=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[x&63]).join('');}return;}
  if(action==='toggle-password'){const scope=b.closest('form')||dialogContent;const input=scope.querySelector<HTMLInputElement>('[name="password"],[name="issued_password"]');if(input){input.type=input.type==='password'?'text':'password';b.textContent=input.type==='password'?'Show password':'Hide password';}return;}
  if(action==='copy-account-details'){const email=dialogContent.querySelector<HTMLInputElement>('[name="login_email"]')?.value,password=dialogContent.querySelector<HTMLInputElement>('[name="issued_password"]')?.value;if(email&&password){await navigator.clipboard.writeText(`SAIL Research Training\nhttps://www.sail-research.com/training/\nEmail: ${email}\nPassword: ${password}`);notify('Account details copied. Share them privately with the student.');}return;}
  if(action==='module-details-editor'){openDialog(admin.editorForm('module-details',d,d.modules.find(m=>m.id===id)!));return;}
  if(action==='preview-module'){const m=d.modules.find(m=>m.id===id)!,lessons=d.lessons.filter(l=>l.module_id===id&&l.is_active);openDialog(`<h2 id="tp-dialog-title">${h(m.title)}</h2><p class="ds-small">Course preview · Published learning content</p><img class="ds-module-art" src="${asset('atlas-network-illustration')}" alt="SAIL research network" /><p class="tp-paragraphs">${h(m.description)}</p><h3>Learning outcomes</h3><p class="tp-paragraphs">${h(m.outcomes)}</p><h3>Lessons & materials</h3>${lessons.map(l=>`<section class="ds-panel"><h3>${h(l.title)}</h3><p class="tp-paragraphs">${h(l.description)}</p>${lessonContent(l.content)}${external('Open materials',l.material_url)}</section>`).join('')}<h3>Assignment brief</h3>${lessonContent(m.assignment_brief)}${external('Assignment materials',m.material_url)}`);return;}
  if(action==='toggle-module'){const m=d.modules.find(m=>m.id===id)!;if(m.is_active){openDialog(`<h2 id="tp-dialog-title">Hide this module?</h2><p>Students will no longer see this module. Submitted work and reviews stay in the program record.</p><div class="ds-action-row">${button('Hide module','confirm-archive-module',`data-id="${id}"`)}${button('Cancel','close-dialog','',true)}</div>`);}else{await checkResult(supabase.from('training_modules').update({is_active:true}).eq('id',id));await reload();notify('Module is visible to students.');}return;}
  if(action==='staff-editor'){openDialog(admin.editorForm('staff',d));return;}
  if(action==='new-track'||action==='edit-track'){const t=action==='edit-track'?d.tracks.find(t=>t.id===params.get('track'))||d.tracks[0]:{};openDialog(admin.editorForm('track',d,t));return;}
  if(action==='new-module'){openDialog(admin.editorForm('new-module',d,{},b.dataset.track!));return;}
  if(action==='new-lesson'||action==='edit-lesson'){const l=d.lessons.find(x=>x.id===id);openDialog(admin.editorForm('lesson',d,l||{},action==='new-lesson'?id!:l!.module_id));return;}
  if(action==='new-project'||action==='edit-project'){openDialog(admin.editorForm('project',d,d.projects.find(p=>p.id===id)||{}));return;}
  if(action==='preview-project'){const p=d.projects.find(p=>p.id===id)!;openDialog(`<h2 id="tp-dialog-title">${h(p.title)}</h2><p class="tp-paragraphs">${h(p.description)}</p><h3>Expected output</h3>${lessonContent(p.expected_output)}${external('Project materials',p.material_url)}`);return;}
  if(action==='toggle-project'){const p=d.projects.find(p=>p.id===id)!;await checkResult(supabase.from('training_projects').update({is_active:!p.is_active}).eq('id',id));await reload();return;}
  if(action==='enrollment-editor'){openDialog(admin.editorForm('enrollment',d,d.enrollments.find(x=>x.id===id)!));return;}
  if(action==='archive-module'){openDialog(`<h2 id="tp-dialog-title">Archive this module?</h2><p>Students will no longer see this module. Existing submissions and reviews remain in the program record.</p><div class="ds-action-row">${button('Archive module','confirm-archive-module',`data-id="${id}"`)}${button('Cancel','close-dialog','',true)}</div>`);return;}
  if(action==='confirm-archive-module'){await checkResult(supabase.from('training_modules').update({is_active:false}).eq('id',id));closeDialog();await reload();notify('Module archived.');return;}
 }catch(error){b.removeAttribute('disabled');showError(b.closest('form'),error);}
});
document.addEventListener('keydown',e=>{const target=e.target as HTMLElement;if(target.matches('[role="radio"]')&&['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const list=[...target.parentElement!.querySelectorAll<HTMLElement>('[role="radio"]')],idx=(list.indexOf(target)+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+list.length)%list.length;list[idx].click();list[idx].focus();}});
document.addEventListener('input',event=>{const el=event.target as Element;if(el.matches('textarea.ds-input'))sizeTextareas(el.parentElement!);});
window.addEventListener('hashchange',()=>{if(location.hash==='#training-main')return;if(dialog.open)closeDialog();render();window.scrollTo({top:0});});
supabase.auth.onAuthStateChange((event,next)=>{
 session=next;
 if(!ready)return;
 if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED')setTimeout(()=>reload().catch(error=>notify(error.message)),0);
});
async function init(){
 try{
  const url=new URL(location.href),authError=url.searchParams.get('error_description')||new URLSearchParams(location.hash.slice(1)).get('error_description');
  const tokenHash=url.searchParams.get('token_hash');if(tokenHash){await checkResult(supabase.auth.verifyOtp({token_hash:tokenHash,type:'email'}));url.searchParams.delete('token_hash');url.searchParams.delete('type');history.replaceState(null,'',url.pathname+url.search);}
  const result=await supabase.auth.getSession();if(result.error)throw result.error;session=result.data.session;
  if(session)await load();
  if(certificatePage&&verifyCode){certificate=(await checkResult(supabase.rpc('verify_training_certificate',{lookup_code:verifyCode})))?.[0]||null;verifyChecked=true;}
  if(location.hash.includes('access_token=')||location.hash.includes('error_description='))history.replaceState(null,'',location.pathname+location.search);
  ready=true;render();if(authError)notify(`Sign-in link could not be used: ${authError}`);
 }catch(error){ready=true;render();openDialog(`<h2 id="tp-dialog-title">Unable to open your workspace.</h2><p>${h(error instanceof Error?error.message:'Please refresh and try again.')}</p><div class="ds-action-row">${button('Retry','refresh')}${button('Sign out','logout','',true)}</div>`);}
}
init();
