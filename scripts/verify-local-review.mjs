// Integration smoke check against pnpm dev, never a hosted deployment.
// Deliberately leaves one clearly labelled synthetic review in local D1.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {inspectConflictPair}=require('../.test-build/lib/conflicts.js');
const base=new URL(process.argv[2]||'http://localhost:5173');
assert(['localhost','127.0.0.1','[::1]'].includes(base.hostname)&&base.protocol==='http:', 'Local HTTP server required');
const pair={left:'sample-remote-1',right:'sample-remote-2',date:'2026-10-19'};
const note='Synthetic Windows integration check: inspected Remote Work v1.0 and v2.0 evidence; historical change from two to three remote days. No authority decision.';
const endpoint='/api/conflict-reviews';
const query=new URLSearchParams(pair);
const unsigned=await fetch(new URL(endpoint+'?'+query,base));
assert.equal(unsigned.status,401,'Unsigned reviews must be private');
const login=await fetch(new URL('/signin-with-chatgpt?return_to=/',base),{redirect:'manual'});
assert.equal(login.status,302,'Development sign-in redirect');
const cookie=login.headers.get('set-cookie')?.split(';')[0];
assert(cookie,'Development sign-in cookie required');
async function request(path,init={}){
 const response=await fetch(new URL(path,base),{...init,headers:{Cookie:cookie,...init.headers}});
 const body=await response.json();
 assert(response.ok,JSON.stringify({status:response.status,body}));return body;
}
const {documents}=await request('/api/documents');
const left=documents.find(p=>p.id===pair.left),right=documents.find(p=>p.id===pair.right);
assert(left&&right,'Both selected versions must be accessible');
const analysis=inspectConflictPair(left,right,pair.date);
assert(analysis.findings.some(f=>f.kind==='historical-change'),'Expected historical-change evidence');
for(const f of analysis.findings){
 for(const constraint of [f.before,f.after]){
  assert(constraint.passage.text&&constraint.passage.startLine>0,'Evidence retains original line references');
 }
}
const previous=await request(endpoint+'?'+query);
assert(!previous.review||previous.review.notes===note,'Existing human note found; refusing to overwrite');
const readOnly=process.argv.includes('--read-only');
if(readOnly)assert(previous.review,'A previously saved review is required');
const saved=readOnly?previous.review:await request(endpoint,{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:JSON.stringify({...pair,status:'historical-change',notes:note,baseRevision:previous.review?.revision??null})});
assert(saved.updatedAt,'Save timestamp required');
// New HTTP reads, including reversed selection, must return the stored record.
for(const selected of [pair,{...pair,left:pair.right,right:pair.left}]){
 const result=await request(endpoint+'?'+new URLSearchParams(selected));
 assert.equal(result.review.notes,note);assert.equal(result.review.status,'historical-change');
 assert.equal(result.review.updatedAt,saved.updatedAt);assert.equal(result.review.stale,false);
}
console.log(JSON.stringify({verified:'HTTP integration only; browser interactions untested',pair,evidence:analysis.findings.map(f=>({kind:f.kind,before:f.before.passage.text,after:f.after.passage.text})),savedAt:saved.updatedAt,persistence:'Fresh GET and reversed pair returned the saved note',retainedSyntheticNote:note},null,2));
