import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {extractiveAnswer}=require('../.test-build/lib/answering.js');
export function predict(inputs){
 if(inputs.schemaVersion!==1||!Array.isArray(inputs.cases)||new Set(inputs.cases.map(c=>c.id)).size!==inputs.cases.length)throw Error('Invalid/duplicate prediction inputs');
 return{schemaVersion:1,method:'bounded-extractive-v1',retrieval:'keyword',cases:inputs.cases.map(c=>({id:c.id,...extractiveAnswer(c.policies,c.question,c.options)}))};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/predict-answers.mjs')){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node scripts/predict-answers.mjs INPUTS.json PREDICTIONS.json (run pnpm test first)');
 writeFileSync(output,JSON.stringify(predict(JSON.parse(readFileSync(input))),null,2)+'\n',{flag:'wx'});
}
