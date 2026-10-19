import {candidates,embeddingChunks,semanticRanking,fuse,type SearchOptions} from './retrieval';
import {search,tokenize,type Policy,type Hit} from './core';
let worker:Worker|null=null;let sequence=0;
export function stopSemantic(){worker?.terminate();worker=null;}
export async function localSearch(policies:Policy[],query:string,options:SearchOptions,mode:'semantic'|'hybrid',onProgress:(s:string)=>void,signal?:AbortSignal):Promise<Hit[]>{
 if(signal?.aborted)throw new DOMException('Search cancelled','AbortError');if(!query.trim()||!tokenize(query).length)return[];const corpus=candidates(policies,options);if(!corpus.length)return[];const chunks=embeddingChunks(corpus);if(!worker)worker=new Worker('/semantic/worker.mjs',{type:'module'});const current=worker;const id=++sequence;
 const scores=await new Promise<{parent:string;score:number}[]>((resolve,reject)=>{
 const cleanup=()=>{clearTimeout(timeout);current.removeEventListener('message',message);current.removeEventListener('error',failure);signal?.removeEventListener('abort',aborted);};
 const message=(e:MessageEvent)=>{if(e.data.id!==id)return;if(e.data.progress){onProgress(e.data.progress);return;}cleanup();if(e.data.error)reject(new Error('The local model could not load or run. Use keyword search or retry meaning-based search.'));else resolve(e.data.scores);};
 const failure=()=>{cleanup();stopSemantic();reject(new Error('Local model could not run in this browser. Try keyword search.'));};
 const aborted=()=>{cleanup();stopSemantic();reject(new DOMException('Search cancelled','AbortError'));};
 const timeout=setTimeout(()=>{cleanup();stopSemantic();reject(new Error('Local semantic search timed out. Try keyword search or a smaller library.'));},180000);
 signal?.addEventListener('abort',aborted,{once:true});current.addEventListener('message',message);current.addEventListener('error',failure);current.postMessage({id,chunks,query});
 });
 const semantic=semanticRanking(corpus,scores);return mode==='hybrid'?fuse(search(policies,query,options),semantic):semantic;
}
