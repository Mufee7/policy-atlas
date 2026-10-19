import {copyFileSync,mkdirSync,existsSync} from 'node:fs';
const dest='public/semantic/vendor';mkdirSync(dest,{recursive:true});
for(const file of ['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])copyFileSync('node_modules/@huggingface/transformers/dist/'+file,dest+'/'+file);
copyFileSync('node_modules/@huggingface/transformers/LICENSE',dest+'/TRANSFORMERS-LICENSE');
if(!existsSync('public/models/minilm/onnx/model_quantized.onnx'))throw new Error('Pinned local MiniLM model is missing; restore the versioned model assets before building.');

mkdirSync('public/evaluation',{recursive:true});copyFileSync('lib/retrieval-report.json','public/evaluation/retrieval-comparison.json');
