import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://www.sail-research.com/training/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
const {inlineContent,lessonContent}=await import('../../tmp/curriculum-render/lesson-content.js');
const host=document.createElement('div');
const malicious='## Heading\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n<img src=x onerror=alert(1)>\n\n<button data-action="logout">click</button>\n\n```python\nprint("<img onerror=boom>")\n```\n\n```math\n\\href{javascript:alert(1)}{x}\n```';
host.innerHTML=lessonContent(malicious);
assert.equal(host.querySelector('script,img,button,iframe,object'),null);
assert.equal(host.querySelector('[onclick],[onerror],[data-action],[data-form]'),null);
assert.equal([...host.querySelectorAll('a')].some(a=>a.href.startsWith('javascript:')),false);
assert.match(host.querySelector('pre code').textContent,/<img onerror=boom>/);
assert.ok(host.querySelector('h3'));
const manifest=JSON.parse(await readFile('curriculum/manifest.json','utf8'));
// Captions sit inside paragraphs: formatting must survive without block nodes or executable markup.
host.innerHTML=`<p>${inlineContent('**Estimated project effort:** 12–20 hours. *Prerequisites:* a `baseline` and [guide](https://example.com).')}</p>`;
assert.equal(host.querySelector('strong').textContent,'Estimated project effort:');
assert.equal(host.querySelector('em').textContent,'Prerequisites:');
assert.equal(host.querySelector('code').textContent,'baseline');
assert.equal(host.querySelector('a').getAttribute('rel'),'noopener noreferrer');
assert.equal(host.querySelectorAll('p').length,1);
host.innerHTML=inlineContent(malicious);
assert.equal(host.querySelector('script,img,button,iframe,object,h3,pre,table'),null);
assert.equal(host.querySelector('[onclick],[onerror],[data-action],[data-form]'),null);
assert.equal([...host.querySelectorAll('a')].some(a=>a.href.startsWith('javascript:')),false);
const captionChecks=[];
for(const row of [...manifest.lessons,...manifest.modules,...manifest.projects]){
 for(const field of ['description','outcomes']){
  if(!row[field])continue;
  host.innerHTML=inlineContent(row[field]);
  assert.equal(host.querySelector('p,div,script,img,button,iframe,object'),null);
  if(row[field].includes('**')){
   assert.ok(host.querySelector('strong'),`Caption bold missing: ${row.id}/${field}`);
   assert.ok(!host.textContent.includes('**'),`Caption syntax leaked: ${row.id}/${field}`);
  }
  captionChecks.push({id:row.id,field,bold:host.querySelectorAll('strong').length,status:'passed'});
 }
}
const checks=[];
for(const lesson of manifest.lessons){
 const source=await readFile(`curriculum/${lesson.file}`,'utf8');
 host.innerHTML=lessonContent(source);
 assert.equal(host.querySelector('.katex-error'),null,`Formula parse error: ${lesson.file}`);
 assert.equal(host.querySelector('script,iframe,img,button'),null);
 for(const a of host.querySelectorAll('a')){
  assert.ok(a.href.startsWith('https:'));
  assert.equal(a.getAttribute('rel'),'noopener noreferrer');
 }
 assert.ok(host.querySelectorAll('h3,h4').length>=5,`Lesson structure: ${lesson.file}`);
 assert.ok(host.textContent.includes('Primary reading'));
 checks.push({file:lesson.file,headings:host.querySelectorAll('h3,h4').length,
   code_blocks:host.querySelectorAll('pre code').length,formulas:host.querySelectorAll('.katex').length,
   tables:host.querySelectorAll('table').length,links:host.querySelectorAll('a').length,status:'passed'});
}
await mkdir('docs/training-curriculum-qa',{recursive:true});
await writeFile('docs/training-curriculum-qa/renderer-checks.json',JSON.stringify({
 security_payloads:'passed; raw HTML is literal text, unsafe URLs are removed, no action attributes survive',
 captions:captionChecks,lessons:checks},null,2)+'\n');
console.log(`Renderer security, ${captionChecks.length} captions/outcomes and ${checks.length} complete lesson renders passed.`);
