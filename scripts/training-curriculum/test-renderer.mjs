import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://www.sail-research.com/training/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
const {lessonContent}=await import('../../tmp/curriculum-render/lesson-content.js');
const host=document.createElement('div');
const malicious='## Heading\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n<img src=x onerror=alert(1)>\n\n<button data-action="logout">click</button>\n\n```python\nprint("<img onerror=boom>")\n```\n\n```math\n\\href{javascript:alert(1)}{x}\n```';
host.innerHTML=lessonContent(malicious);
assert.equal(host.querySelector('script,img,button,iframe,object'),null);
assert.equal(host.querySelector('[onclick],[onerror],[data-action],[data-form]'),null);
assert.equal([...host.querySelectorAll('a')].some(a=>a.href.startsWith('javascript:')),false);
assert.match(host.querySelector('pre code').textContent,/<img onerror=boom>/);
assert.ok(host.querySelector('h3'));
const manifest=JSON.parse(await readFile('curriculum/manifest.json','utf8'));
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
 lessons:checks},null,2)+'\n');
console.log(`Renderer security and ${checks.length} complete lesson renders passed.`);
