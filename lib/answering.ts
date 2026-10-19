import {applicable,sections,search,validDate,type Policy,type Passage,type Hit,type SourceLocation} from './core.js';
import type {SearchOptions} from './retrieval.js';

export const ANSWER_METHOD='bounded-extractive-v1';
type Intent='limit'|'deadline'|'approval'|'eligibility'|'requirements';
export type Citation={passageId:string;rowId:string;documentId:string;version:string;title:string;quote:string;startLine:number;endLine:number;source?:SourceLocation;role:'support'|'context'};
export type ExtractiveAnswer={kind:'extractive';decision:'answered'|'refused'|'unavailable';reason:string;message:string;question:string;options:SearchOptions;method:string;retrieval:'keyword'|'semantic';citations:Citation[];rankedIds:string[]};
const words=(s:string)=>s.toLowerCase().match(/[a-z0-9]+/g)?.map(w=>w.length>4&&w.endsWith('s')&&!w.endsWith('ss')?w.slice(0,-1):w)??[];
export function parseQuestion(question:string):{intent:Intent;topic:string}|null{
 const q=question.trim().replace(/\?$/,'').trim();
 const forms:[RegExp,Intent][]=[[/^what is the (.+) (?:limit|allowance)$/i,'limit'],[/^what is the (.+) deadline$/i,'deadline'],[/^who approves (.+)$/i,'approval'],[/^what is the (.+) approval rule$/i,'approval'],[/^who is eligible for (.+)$/i,'eligibility'],[/^what are the (.+) requirements$/i,'requirements'],[/^what is the (.+) requirement$/i,'requirements']];
 for(const [re,intent]of forms){const m=q.match(re);if(m&&words(m[1]).length>0&&words(m[1]).length<=10&&!/\b(and|or|except|unless)\b|[?!;]/i.test(m[1]))return{intent,topic:m[1]};}
 return null;
}
function explicitSupport(p:Passage,intent:Intent,topic:string){
 const tokens=new Set(words(p.text));if(!words(topic).every(t=>tokens.has(t)))return false;
 const fullBody=p.text.replace(/^.*\n/,'');
 if(/not (?:specified|defined|established)|does not define|undecided|unspecified|to be determined|draft proposal/i.test(fullBody))return false;
 // A heading may supply the topic to the leading statement, but unrelated later
 // sentences must not donate a number/obligation to a different requested fact.
 const statements=fullBody.split(/\n|(?<=[.!?])\s+/).filter(s=>s.trim());
 const body=statements.filter((s,i)=>i===0||words(topic).every(t=>words(s).includes(t))).join('\n');
 if(intent==='limit'){
  const number='(?:\\d+(?:[,.]\\d+)*|one|two|three|four|five|six|seven|eight|nine|ten|fourteen|thirty|sixty)';
  return new RegExp('\\b(?:(?:up to|maximum of|no more than)\\s+'+number+'|(?:limit|allowance)\\s+(?:is\\s+|of\\s+)?(?:(?:LKR|USD|EUR|GBP)\\s+)?'+number+')\\b','i').test(body);
 }
 if(intent==='deadline')return /\b(?:within|at least|no later than|before|after)\b/i.test(body)&&/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|fourteen|thirty|sixty)\s+(?:business |calendar )?(?:minutes?|hours?|days?|weeks?)\b/i.test(body);
 if(intent==='approval')return !/no approval|approval is not required/i.test(body)&&/\b(?:approval|approved)\s+(?:from|by)\s+[a-z]|\b[a-z -]+\s+(?:must approve|approves)\b|\b(?:manager|supervisor|director|committee|owner|finance|people operations|department head)\b.{0,45}\bapproval/i.test(body);
 if(intent==='eligibility')return /\b(?:applies (?:only )?to|eligible|covered)\b/i.test(body);
 return /\b(?:must|required|shall)\b/i.test(body)&&!/\b(?:not|never) required\b/i.test(body);
}
const headingFor:Record<Intent,RegExp>={limit:/limit|allowance|per diem/i,deadline:/deadline|submission|reporting/i,approval:/approval/i,eligibility:/eligibility|scope/i,requirements:/requirements|security/i};
function cite(p:Passage,role:Citation['role']):Citation{return{passageId:p.id,rowId:p.policy.id,documentId:p.policy.documentId,version:p.policy.version,title:p.policy.title,quote:p.text,startLine:p.startLine,endLine:p.endLine,...(p.source?{source:p.source}:{}),role};}
export function verifyCitation(c:Citation,policies:Policy[],options:SearchOptions){
 const p=policies.find(p=>p.id===c.rowId&&p.status==='approved'&&applicable(p,options.date,'approved')&&(!options.department||options.department==='all'||p.department===options.department));
 const passage=p&&sections(p).find(s=>s.id===c.passageId);
 return !!passage&&JSON.stringify(cite(passage,c.role))===JSON.stringify(c);
}
export function extractiveAnswer(policies:Policy[],question:string,options:SearchOptions,input:{hits?:Hit[];retrieval?:'keyword'|'semantic';error?:string}={}):ExtractiveAnswer{
 const base={kind:'extractive' as const,question,options:{...options},method:ANSWER_METHOD,retrieval:input.retrieval??'keyword',citations:[] as Citation[],rankedIds:[] as string[]};
 const refuse=(reason:string,message:string):ExtractiveAnswer=>({...base,decision:'refused',reason,message});
 if(input.error)return{...base,decision:'unavailable',reason:'retrieval-failed',message:'Evidence could not be loaded or searched. Retry; this is not a finding that no policy exists.'};
 if(!validDate(options.date)||!['approved','draft','archived','all'].includes(options.status))return{...base,decision:'unavailable',reason:'invalid-filters',message:'Choose a valid date and status.'};
 if(options.status!=='approved')return refuse('unapproved-scope','Answers require Approved only. Other statuses remain available for evidence review.');
 const eligible=policies.filter(p=>p.status==='approved'&&applicable(p,options.date,'approved')&&(!options.department||options.department==='all'||p.department===options.department));
 if(!eligible.length)return refuse('no-eligible-evidence','There is insufficient approved evidence under these date and department filters.');
 const fresh=new Map(eligible.flatMap(sections).map(p=>[p.id,p]));
 const ranked=input.hits??search(policies,question,options);
 const passages:Passage[]=[];
 for(const hit of ranked.slice(0,10)){const p=fresh.get(hit.id);if(!p||p.text!==hit.text||p.policy.id!==hit.policy.id)return{...base,decision:'unavailable',reason:'invalid-citation',message:'Retrieved evidence no longer matches the current source. Search again.'};if(!passages.some(s=>s.id===p.id))passages.push(p);}
 base.rankedIds=passages.map(p=>p.id);
 const parsed=parseQuestion(question);if(!parsed)return refuse('unsupported-question','This question is outside the supported direct question forms. Inspect evidence or use a supported form; no answer has been inferred.');
 const supported=passages.filter(p=>explicitSupport(p,parsed.intent,parsed.topic));
 const ids=new Set(supported.map(p=>p.policy.id));
 if(!ids.size)return refuse('no-support','The retrieved evidence does not explicitly support this requested fact. Similarity or shared words alone are insufficient.');
 if(ids.size!==1)return refuse('ambiguous-evidence','Multiple approved policies may support this topic. Authority or applicability needs human review; no answer was selected.');
 const allMatchingIds=new Set([...fresh.values()].filter(p=>explicitSupport(p,parsed.intent,parsed.topic)).map(p=>p.policy.id));
 if(allMatchingIds.size>1)return refuse('ambiguous-evidence','Other eligible policies explicitly match this fact, including outside the retrieved shortlist. Authority needs human review.');
 const selected=eligible.find(p=>p.id===[...ids][0])!;
 if(eligible.some(p=>p.id!==selected.id&&p.documentId===selected.documentId))return refuse('ambiguous-evidence','Overlapping approved editions need human authority review before answering.');
 const all=sections(selected);
 if(all.length>16||all.reduce((n,p)=>n+p.text.length,0)>12000)return refuse('context-too-large','The full qualification context exceeds this bounded answer view. Inspect the source instead.');
 // PDF/DOCX display headings identify pages/paragraphs; use the actual text heading.
 const preferred=supported.filter(p=>headingFor[parsed.intent].test(p.text.split('\n')[0]));
 const supportIds=new Set((preferred.length?preferred:supported).map(p=>p.id));
 const citations=all.map(p=>cite(p,supportIds.has(p.id)?'support':'context'));
 if(!citations.every(c=>verifyCitation(c,eligible,options)))return{...base,decision:'unavailable',reason:'invalid-citation',message:'Source verification failed. No answer is shown.'};
 return{...base,decision:'answered',reason:'explicit-evidence',message:'Exact source quotations follow. Read all context, including exclusions and approval conditions. This is not generated advice or a personalized permission decision.',citations};
}
