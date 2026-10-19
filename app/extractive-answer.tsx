import {extractiveAnswer,type Citation} from '@/lib/answering';
import {sourceLabel,type Policy,type Hit} from '@/lib/core';
import type {SearchOptions} from '@/lib/retrieval';

export default function ExtractiveAnswer({policies,question,options,hits,busy,error,retrieval,onSource}:{policies:Policy[];question:string;options:SearchOptions;hits:Hit[];busy:boolean;error:string;retrieval:'keyword'|'semantic';onSource:(c:Citation)=>void}){
 if(busy)return <section className="answer-panel" aria-label="Extractive answer"><h2>Checking evidence</h2><p>Waiting for retrieval. No answer has been selected.</p></section>;
 const result=extractiveAnswer(policies,question,options,{hits,retrieval,error});
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='policy-atlas-extractive-answer.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <section className="answer-panel" aria-label="Extractive answer"><h2>{result.decision==='answered'?'Extractive answer':result.decision==='unavailable'?'Answer unavailable':'Insufficient evidence to answer'}</h2><p role="status">{result.message}</p><details><summary>Supported question forms and limits</summary><p>Ask “What is the [topic] limit/allowance/deadline?”, “Who approves [topic]?”, “Who is eligible for [topic]?”, or “What are the [topic] requirements?”. Only approved evidence is used. No arithmetic, personalized permission, authority resolution or generated answers. This narrow lexical support check can still make mistakes; inspect the sources.</p></details>
 {result.citations.map(c=><div className="answer-quotation" key={c.passageId}><strong>{c.role==='support'?'Direct evidence':'Qualification / source context'}</strong><blockquote>{c.quote}</blockquote><button className="citation" onClick={()=>onSource(c)}>{c.documentId} / v{c.version} · {sourceLabel(c.source,c.startLine,c.endLine)}</button></div>)}
 <button className="text-button" onClick={download}>Export answer decision and citations</button></section>;
}
