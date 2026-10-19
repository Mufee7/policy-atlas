import {sections,applicable,type Policy,type Passage} from './core.js';
export type ReviewStatus='needs-review'|'potential-conflict'|'compatible'|'historical-change'|'needs-clarification';
export type Constraint={topic:string;label:string;value:string;unit:string;basis:string;passage:Passage;conditional:boolean};
export type Scope={included:string[];excluded:string[];excerpt:string|null};
export type Finding={topic:string;label:string;before:Constraint;after:Constraint;kind:'potential-conflict'|'historical-change'|'draft-comparison'|'scope-difference'|'outside-date'|'needs-context';reason:string};
const NUMBERS:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,thirty:30,sixty:60};
const NUM='(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|thirty|sixty)';
const numeric=(s:string)=>NUMBERS[s.toLowerCase()]??Number(s);
export function policyScope(policy:Policy):Scope{
 const lines=policy.content.replace(/\r\n?/g,'\n').split(/\n|(?<=[.!?])\s+/);const scopeLines=lines.filter(l=>/\b(applies (?:only )?to|not covered|excluded|does not apply)\b/i.test(l));
 const included=new Set<string>(),excluded=new Set<string>();
 for(const line of scopeLines){const lower=line.toLowerCase();const negative=/not covered|excluded|does not apply/.test(lower);const target=negative?excluded:included;
  if(/interns?\b/.test(lower))target.add('interns');if(/contractors?\b/.test(lower))target.add('contractors');
  if(/permanent(?: full[- ]time)? employees/.test(lower))target.add('permanent employees');else if(/administrators?\b/.test(lower))target.add('administrators');else if(/employees?\b/.test(lower))target.add('employees');
 }
 return{included:[...included],excluded:[...excluded],excerpt:scopeLines.length?scopeLines.join('\n'):null};
}
export function disjointScope(a:Scope,b:Scope){return(a.included.length>0&&a.included.every(s=>b.excluded.includes(s)))||(b.included.length>0&&b.included.every(s=>a.excluded.includes(s)));}
export function constraints(policy:Policy):Constraint[]{
 const result:Constraint[]=[];
 for(const passage of sections(policy)){
  const text=passage.text.toLowerCase();const conditional=/\b(unless|except|exception|special approval|subject to|provided that|only if)\b/.test(text);
  const add=(topic:string,label:string,value:string,unit:string,basis='')=>{if(result.length>=200)throw new Error('This bounded review supports up to 200 extracted constraints per document. Use a smaller policy document.');result.push({topic,label,value,unit,basis,passage,conditional});};
  if(/remote|work(?:ing)? from home|home[- ]working/.test(text)){
   const re=new RegExp('(?:up to|maximum of|no more than)\\s+'+NUM+'\\s+(?:remote[- ]work\\s+)?days?\\s+(?:per|a|each)\\s+week','g');for(const m of text.matchAll(re))add('remote-days','Weekly remote-work allowance',String(numeric(m[1])),'days per week');
  }
  if(/per diem|meal allowance/.test(text)&&/domestic/.test(text)){
   for(const m of text.matchAll(/\b(lkr|usd|eur|gbp)\s*([\d,]+(?:\.\d{1,2})?)\b/g))if(/per (?:travel )?day/.test(text))add('domestic-meals','Domestic daily meal allowance',String(Number(m[2].replace(/,/g,''))),m[1].toUpperCase()+' per day');
  }
  if(/incident|breach/.test(text)){
   const re=new RegExp('within\\s+'+NUM+'\\s+(minutes?|hours?)','g');for(const m of text.matchAll(re)){const minutes=numeric(m[1])*(m[2].startsWith('hour')?60:1);const basis=/discovery|discovering|detection/.test(text)?'discovery':/receipt|receiving/.test(text)?'receipt':'unspecified';add('incident-deadline','Incident reporting deadline',String(minutes),'minutes',basis);}
  }
  if(/(?:customer|client) (?:data|records|details)/.test(text)&&/personal cloud storage/.test(text)){
   const negatives=/\b(must not|do not|may not|shall not|cannot|can't|not allowed|not permitted|prohibited|forbidden)\b/g;const banned=new RegExp(negatives.source).test(text);const allowed=/\b(may|allowed|permitted)\b/.test(text.replace(negatives,''));
   if(banned&&!allowed)add('personal-cloud','Customer data in personal cloud storage','prohibited','permission');else if(allowed&&!banned)add('personal-cloud','Customer data in personal cloud storage','permitted','permission');
  }
 }
 return result;
}
export function periodsOverlap(a:Policy,b:Policy){const from=a.effectiveFrom>b.effectiveFrom?a.effectiveFrom:b.effectiveFrom;const until=a.effectiveUntil&&b.effectiveUntil?(a.effectiveUntil<b.effectiveUntil?a.effectiveUntil:b.effectiveUntil):a.effectiveUntil||b.effectiveUntil;return !until||from<until;}
export function inspectConflictPair(left:Policy,right:Policy,date:string){
 const leftScope=policyScope(left),rightScope=policyScope(right);const a=constraints(left),b=constraints(right);const findings:Finding[]=[];const agreements:{label:string;before:Constraint;after:Constraint}[]=[];let sameTopic=0;
 for(const before of a)for(const after of b){if(before.topic!==after.topic||before.unit!==after.unit)continue;sameTopic++;if(sameTopic>50)throw new Error('More than 50 comparable rule pairs were found. This bounded review needs smaller, more focused documents. No partial conclusion is shown.');if(before.value===after.value&&before.basis===after.basis){agreements.push({label:before.label,before,after});continue;}
  let kind:Finding['kind'],reason:string;
  if(!periodsOverlap(left,right)){kind='historical-change';reason='The recorded effective periods do not overlap. This difference is not a simultaneous conflict on these dates.';}
  else if(left.status!=='approved'||right.status!=='approved'){kind='draft-comparison';reason='At least one edition is draft or archived. Do not treat it as a competing approved rule.';}
  else if(disjointScope(leftScope,rightScope)){kind='scope-difference';reason='Explicit inclusion and exclusion statements indicate different covered groups. Verify that those scope statements are complete.';}
  else if(!applicable(left,date,'approved')||!applicable(right,date,'approved')){kind='outside-date';reason='Both documents are not in effect on the selected review date. Review their effective periods.';}
  else if(before.conditional||after.conditional||before.basis!==after.basis||before.basis==='unspecified'){kind='needs-context';reason='An exception/condition or uncertain deadline anchor may explain this difference. More context is needed.';}
  else{kind='potential-conflict';reason=left.documentId===right.documentId?'Different values occur in overlapping approved versions of the same policy. Authority and version precedence need owner review.':'Different values occur for the same supported topic and unit in jointly effective approved documents. Scope and authority still need human verification.';}
  findings.push({topic:before.topic,label:before.label,before,after,kind,reason});
 }
 return{findings,agreements,sameTopic,leftScope,rightScope,overlap:periodsOverlap(left,right),jointlyActive:applicable(left,date,'approved')&&applicable(right,date,'approved'),scopeDisjoint:disjointScope(leftScope,rightScope)};
}
export const RULES=[
 {name:'Remote-work allowance',description:'Explicit “up to / maximum of / no more than N days per week” in a passage about remote work.'},
 {name:'Domestic meal allowance',description:'Explicit LKR/USD/EUR/GBP daily amount in a passage naming domestic meal allowance or per diem. Different currencies are not compared.'},
 {name:'Incident reporting deadline',description:'Explicit “within N minutes/hours” for incidents or breaches. Hours are normalized to minutes; deadline anchors and conditions are checked.'},
 {name:'Personal cloud storage',description:'Explicit permission or prohibition concerning customer/client data in personal cloud storage. Ambiguous mixed polarity is skipped.'},
];

export function conflictReportData(analysis:ReturnType<typeof inspectConflictPair>){
 const brief=(c:Constraint)=>({topic:c.topic,label:c.label,value:c.value,unit:c.unit,basis:c.basis,conditional:c.conditional,evidence:{documentId:c.passage.policy.documentId,version:c.passage.policy.version,id:c.passage.policy.id,title:c.passage.policy.title,startLine:c.passage.startLine,endLine:c.passage.endLine,source:c.passage.source,excerpt:c.passage.text.slice(0,3000),excerptTruncated:c.passage.text.length>3000}});
 return{...analysis,findings:analysis.findings.map(f=>({...f,before:brief(f.before),after:brief(f.after)})),agreements:analysis.agreements.map(a=>({label:a.label,before:brief(a.before),after:brief(a.after)}))};
}
