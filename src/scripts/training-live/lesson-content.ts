import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';

const escapeText = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const markdown = new Marked({gfm:true, breaks:true, renderer:{
  html({text}) { return escapeText(text); },
  heading({tokens,depth}) { const level=Math.min(6,Math.max(3,depth+1)); return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>`; },
  code({text,lang}) {
    if(lang?.trim()==='math') return `<div class="tp-math">${escapeText(text)}</div>`;
    return `<pre><code>${escapeText(text)}</code></pre>`;
  },
  image({text}) { return escapeText(text); },
  link({href,tokens}) {
    const label=this.parser.parseInline(tokens);
    try { const url=new URL(href, 'https://www.sail-research.com');
      if(url.protocol!=='https:'||url.username||url.password) return label;
      return `<a href="${escapeText(url.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    } catch { return label; }
  },
}});

/** Content is editable by staff. Raw HTML, event attributes and action routing are never accepted. */
export function lessonContent(value: unknown): string {
  const safe=DOMPurify.sanitize(markdown.parse(String(value??''),{async:false}) as string, {
    ALLOWED_TAGS:['p','br','h3','h4','h5','h6','strong','em','del','blockquote','ul','ol','li','pre','code','table','thead','tbody','tr','th','td','hr','a','div'],
    ALLOWED_ATTR:['href','target','rel','class','start','align'], ALLOW_DATA_ATTR:false, ALLOW_ARIA_ATTR:false,
  });
  const template=document.createElement('template'); template.innerHTML=safe;
  template.content.querySelectorAll('.tp-math').forEach(el=>{
    const source=el.textContent||'';
    // Only KaTeX-generated markup is inserted after sanitizing. No trusted HTML/URL commands.
    el.innerHTML=katex.renderToString(source,{displayMode:true,throwOnError:false,trust:false,strict:'warn',maxExpand:200,maxSize:20,output:'htmlAndMathml'});
  });
  template.content.querySelectorAll('table').forEach(table=>{
    const wrap=document.createElement('div');wrap.className='tp-table-scroll';wrap.tabIndex=0;
    wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Lesson table');
    table.replaceWith(wrap);wrap.append(table);
  });
  return `<div class="tp-lesson-content">${template.innerHTML}</div>`;
}
