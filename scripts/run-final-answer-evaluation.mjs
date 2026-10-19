// One-shot final inference. Re-score saved outputs with Python; never rerun inference after feedback.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {predict} from './predict-answers.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const reservation=JSON.parse(readFileSync('evaluation/answering/reservation.json'));
const freeze=JSON.parse(readFileSync('evaluation/answering/implementation-freeze.json'));
if(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==freeze.commit)throw Error('HEAD differs from implementation freeze');
for(const [path,expected]of Object.entries({...freeze.files,...reservation.files}))if(hash(readFileSync(path))!==expected)throw Error('Frozen file changed: '+path);
if(hash(readFileSync('docs/ANSWERING_PROTOCOL.md'))!==reservation.protocolSha256)throw Error('Protocol changed after reservation');
const folder='evaluation/answering/final';mkdirSync(folder,{recursive:true});
const marker='work/answering-reserved/attempt.json';
const attempt={startedAt:new Date().toISOString(),implementationCommit:freeze.commit,status:'started'};
writeFileSync(marker,JSON.stringify(attempt,null,2)+'\n',{flag:'wx'});
try{
 const inputs=JSON.parse(readFileSync('work/answering-reserved/final.inputs.json'));
 if(inputs.cases.length!==40)throw Error('Reserved input count changed');
 const predictions=predict(inputs);
 writeFileSync(folder+'/predictions.json',JSON.stringify(predictions,null,2)+'\n',{flag:'wx'});
 copyFileSync('work/answering-reserved/final.inputs.json',folder+'/inputs.json');
 copyFileSync('work/answering-reserved/final.labels.json',folder+'/labels.json');
 const python=process.argv[2]||resolve('.tools/python-3.13.13/python.exe');
 const result=spawnSync(python,['scripts/evaluate_answers.py','--inputs',folder+'/inputs.json','--labels',folder+'/labels.json','--predictions',folder+'/predictions.json','--output',folder+'/report.json'],{stdio:'inherit'});
 if(result.error)throw result.error;if(result.status!==0)throw Error('Scoring failed after inference; preserve attempt and predictions, audit without rerunning inference');
 const report=JSON.parse(readFileSync(folder+'/report.json'));
 if(report.answerable!==20||report.insufficient!==20)throw Error('Reserved label balance differs from protocol');
 attempt.status='consumed';attempt.finishedAt=new Date().toISOString();attempt.resultSha256=hash(readFileSync(folder+'/report.json'));
 writeFileSync(marker,JSON.stringify(attempt,null,2)+'\n');
 writeFileSync(folder+'/attempt.json',JSON.stringify(attempt,null,2)+'\n',{flag:'wx'});
 console.log('Final set consumed. Preserve results and failures; no tuning or second inference run.');
}catch(error){attempt.status='failed-after-attempt';attempt.error=String(error);writeFileSync(marker,JSON.stringify(attempt,null,2)+'\n');throw error;}
