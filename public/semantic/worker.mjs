import {env,pipeline} from './vendor/transformers.min.js';
env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath='/models/';env.useBrowserCache=true;
env.backends.onnx.wasm.wasmPaths='/semantic/vendor/';env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
let extractor=null;const cache=new Map();let queue=Promise.resolve();
async function vector(text){let v=cache.get(text);if(v)return v;const output=await extractor(text,{pooling:'mean',normalize:true});v=Array.from(output.data,Number);cache.set(text,v);if(cache.size>1000)cache.delete(cache.keys().next().value);return v;}
async function run({id,chunks,query}){const progress=message=>postMessage({id,progress:message});try{
 if(!extractor){progress('Loading local embedding model (first use downloads about 45 MB)…');extractor=await pipeline('feature-extraction','minilm',{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')progress(`Loading ${p.file||'model'}: ${Math.round(p.progress||0)}%`);}});}
 const q=await vector(query);const scores=[];for(let i=0;i<chunks.length;i++){if(i%5===0)progress(`Embedding evidence ${i+1} of ${chunks.length} on your device…`);const v=await vector(chunks[i].text);let score=0;for(let j=0;j<q.length;j++)score+=q[j]*v[j];scores.push({parent:chunks[i].parent,score});}
 postMessage({id,scores});
 }catch(e){postMessage({id,error:e instanceof Error?e.message:'Local semantic search failed.'});}}
self.onmessage=event=>{queue=queue.then(()=>run(event.data));};
