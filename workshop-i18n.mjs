import {EN} from './workshop-en.mjs';
const KEY='github-workshop-language';
export function resolveLanguage(search='',saved=null){const requested=new URLSearchParams(search).get('lang');return ['ko','en'].includes(requested)?requested:['ko','en'].includes(saved)?saved:'ko';}
function savedLanguage(){try{return localStorage.getItem(KEY);}catch{return null;}}
let language=resolveLanguage(globalThis.location?.search||'',savedLanguage());
export const getLanguage=()=>language;
export function setLanguage(value){if(!['ko','en'].includes(value))return;language=value;try{localStorage.setItem(KEY,value);}catch{/* Private browsing may block storage. The URL still retains the choice. */}}
const owner=name=>name==='나'?'my':name==='지수'?"Emma's":name==='민수'?"Noah's":name;
const patterns=[
 [/^내 저장소가 병합 결과 (.+)을 받아왔습니다\.$/,m=>`My repository received merge result ${m[1]}.`],
 [/^지수도 main에서 병합 결과 (.+)을 확인했습니다\. 로컬 happy의 해결 기록 R도 남아 있습니다\.$/,m=>`Emma also received ${m[1]} on main. Resolution commit R remains on her local happy branch.`],
 [/^(.+)의 기록 (\w+) 보기$/,m=>`View ${owner(m[1])} commit ${m[2]}`],
 [/^(.+)의 기준본 (\w+) 보기$/,m=>`View ${owner(m[1])} main at ${m[2]}`],
 [/^기록 (\d+)$/,m=>`Commits ${m[1]}`],
 [/^이슈 (\d+): (.+), (.+)$/,m=>`Issue ${m[1]}: ${translate(m[2])}, ${translate(m[3])}`],
 [/^PR (\d+), (.+), (.+), 자세히 보기$/,m=>`PR ${m[1]}, ${translate(m[2])}, ${translate(m[3])}, view details`],
 [/^(.+)의 현재 파일 보기$/,m=>`View ${owner(m[1])} working file`],
 [/^([a-z][a-z0-9-]*) 기록 (\w+)$/,m=>`${m[1]} commit ${m[2]}`],
 [/^지금 동작하는 곳 · (.+)$/,m=>`Action on · ${translate(m[1])}`],
 [/^이슈 #(\d+)$/,m=>`Issue #${m[1]}`],
 [/^([a-z][a-z0-9-]*) 브랜치$/,m=>`${m[1]} branch`],
 [/^기록 (\w+)의 파일 내용$/,m=>`File at commit ${m[1]}`],
 [/^이전 기록: (.+)$/,m=>`Parent commits: ${m[1]}`],
 [/^개념 이름 · (.+)$/,m=>`Concept · ${translate(m[1])}`],
 [/^담당자: (.+) · (.+)$/,m=>`Assigned to: ${translate(m[1])} · ${translate(m[2])}`],
 [/^작성: (.+) · 검토·병합: 지수$/,m=>`Author: ${translate(m[1])} · Review and merge: Emma`],
 [/^상태: (.+)$/,m=>`Status: ${translate(m[1])}`],
 [/^지수가 병합 기록 (\w+)을 만들었습니다\.$/,m=>`Emma created merge commit ${m[1]}.`],
 [/^(.+)가 로컬에서 해결한 R을 이 PR에 Push했습니다\.$/,m=>`${translate(m[1])} pushed local resolution R to this PR.`],
 [/^(.+) 저장소의 기록$/,m=>`${translate(m[1])} repository commits`],
 [/^기준본 main: (.+)$/,m=>`Main: ${m[1]}`],
 [/^(\d+  )(.*)$/,m=>m[1]+translate(m[2])],
];
// The simulation keeps its original text and identifiers. Localization is presentation-only.
export function translate(value){
 const source=String(value??'');if(language==='ko')return source;
 const core=source.trim();let result=EN[core];
 if(result===undefined){for(const [pattern,format] of patterns){const match=core.match(pattern);if(match){result=format(match);break;}}}
 if(result===undefined&&core.includes('\n'))result=core.split('\n').map(translate).join('\n');
 if(result===undefined&&core.includes(' · '))result=core.split(' · ').map(translate).join(' · ');
 if(result===undefined)return source;
 return source.slice(0,source.indexOf(core))+result+source.slice(source.indexOf(core)+core.length);
}
const textSources=new WeakMap(),attributeSources=new WeakMap();
export function localize(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
  if(node.parentElement?.closest('script,style,[data-no-translate]'))continue;
  if(!textSources.has(node))textSources.set(node,node.nodeValue);
  node.nodeValue=translate(textSources.get(node));
 }
 for(const element of [root,...root.querySelectorAll('[aria-label],[title],[placeholder]')]){
  if(element.closest('[data-no-translate]'))continue;
  let values=attributeSources.get(element);if(!values){values=new Map();attributeSources.set(element,values);}
  for(const attr of ['aria-label','title','placeholder']){if(!element.hasAttribute(attr))continue;if(!values.has(attr))values.set(attr,element.getAttribute(attr));element.setAttribute(attr,translate(values.get(attr)));}
 }
}
