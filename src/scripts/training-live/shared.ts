export type Row = Record<string, any>;
export const config = { url:'https://rxnhlmrvwmepuphpithm.supabase.co', key:'sb_publishable_dW6VM2wj55-8rysyeIRubQ_s--GnMD7' };
export const pillars: Record<string,string> = { math:'Math Foundations',deep_learning:'Deep Learning',trustworthy_ai:'Trustworthy AI',distributed_learning:'Distributed & Federated Learning',efficient_ml:'Efficient Machine Learning',project:'Mini-project' };
export const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]!));
export const asset = (name:string) => `/training-overview/assets/${name}.png`;
export const title = (v:unknown) => String(v || 'Not started').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
export const initials = (name:string) => name.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
export const date = (v:unknown,long=false) => v ? new Intl.DateTimeFormat('en',{timeZone:'Asia/Ho_Chi_Minh',month:long?'long':'short',day:'numeric',year:'numeric'}).format(new Date(String(v).length===10?`${v}T00:00:00+07:00`:String(v))) : '—';
export const badge = (v:unknown) => `<span class="ds-badge ${escape(String(v||'Not started').toLowerCase().replaceAll(' ','-'))}">${escape(title(v))}</span>`;
export const button = (label:string,action:string,attrs='',secondary=false) => `<button type="button" class="ds-action${secondary?' secondary':''}" data-action="${action}" ${attrs}>${escape(label)}</button>`;
export const textButton = (label:string,action:string,attrs='') => `<button type="button" class="ds-text-action" data-action="${action}" ${attrs}>${escape(label)}</button>`;
export const href = (view:string,params:Record<string,string>={}) => `#${view}${Object.keys(params).length?'?'+new URLSearchParams(params):''}`;
export const link = (label:string,view:string,params:Record<string,string>={},cls='ds-text-action') => `<a class="${cls}" href="${href(view,params)}">${escape(label)}</a>`;
let fieldId=0;
export const field = (label:string,name:string,value:unknown='',type='text',opts:{required?:boolean;hint?:string;options?:[string,string][];readonly?:boolean;placeholder?:string}={}) => {
 const id=`field-${name}-${++fieldId}`;
 return `<div class="ds-field${type==='textarea'?' multiline':''}"><label class="ds-label" for="${id}">${escape(label)}</label>${type==='select'?`<select class="ds-input" id="${id}" name="${name}" ${opts.required?'required':''}>${(opts.options||[]).map(([v,l])=>`<option value="${escape(v)}" ${v===String(value)?'selected':''}>${escape(l)}</option>`).join('')}</select>`:type==='textarea'?`<textarea class="ds-input" id="${id}" name="${name}" rows="4" ${opts.required?'required':''} ${opts.readonly?'readonly':''}>${escape(value)}</textarea>`:`<input class="ds-input" id="${id}" name="${name}" type="${type}" value="${escape(value)}" ${opts.required?'required':''} ${opts.readonly?'readonly':''} placeholder="${escape(opts.placeholder||'')}" ${type==='email'?'autocomplete="email"':type==='password'?'autocomplete="current-password"':''} />`}${opts.hint?`<small class="ds-field-hint">${escape(opts.hint)}</small>`:''}</div>`;
};
export const check = (label:string,name:string,checked=true) => `<label class="tp-form-check"><input type="checkbox" name="${name}" ${checked?'checked':''} />${escape(label)}</label>`;
export const submit = (label:string) => `<button class="ds-action" type="submit">${escape(label)}</button>`;
export const empty = (message:string) => `<p class="tp-empty">${escape(message)}</p>`;
export const paragraphs = (v:unknown) => `<div class="tp-paragraphs">${escape(v)}</div>`;
export const details = (pairs:[string,unknown][]) => `<dl class="ds-details">${pairs.map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>`;
export function safeUrl(value:unknown): string {
 const u = new URL(String(value));
 if(u.protocol!=='https:' || u.username || u.password || !u.hostname.includes('.') || /^(localhost|127\.|0\.|\[|169\.254\.)/.test(u.hostname)) throw new Error('Use a shared HTTPS link accessible to your reviewer.');
 return u.href;
}
export const external = (label:string,url:unknown) => {try{return `<a class="tp-link" href="${escape(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;}catch{return `<span class="ds-muted">${escape(label)} · Not attached yet</span>`;}};
export const slug = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'course';
export interface PortalData { profile:Row|null; user:Row|null; tracks:Row[]; modules:Row[]; lessons:Row[]; projects:Row[]; enrollments:Row[]; profiles:Row[]; submissions:Row[]; reviews:Row[]; certificates:Row[]; progress:Row[]; drafts:Row[]; reviewDrafts:Row[]; invites:Row[]; invite:Row|null; inviteToken:string; selectedEnrollmentId?:string; }
export const isAdmin = (d:PortalData) => ['admin','super_admin'].includes(d.profile?.role);
export const isStaff = (d:PortalData) => ['reviewer','admin','super_admin'].includes(d.profile?.role);
export const latestSubmission = (d:PortalData,eid:string,target:string) => d.submissions.find(s=>s.enrollment_id===eid&&(s.module_id===target||s.project_id===target));
export const latestReview = (d:PortalData,s?:Row) => s && d.reviews.find(r=>r.submission_id===s.id);
export const moduleGrade = (d:PortalData,e:Row,m:Row) => {
 const target=m.pillar==='project'?e.assigned_project_id:m.id;
 const s=latestSubmission(d,e.id,target);return latestReview(d,s)?.result || (s?'Submitted':'Not started');
};
export const trackModules = (d:PortalData,e:Row) => d.modules.filter(m=>m.track_id===e.track_id&&m.is_active);
export const completedCount = (d:PortalData,e:Row) => trackModules(d,e).filter(m=>['pass','excellent'].includes(moduleGrade(d,e,m))).length;
export const myEnrollment = (d:PortalData) => d.enrollments.find(e=>e.id===d.selectedEnrollmentId&&e.profile_id===d.profile?.id)||d.enrollments.find(e=>e.profile_id===d.profile?.id);
