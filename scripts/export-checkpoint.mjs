// Explicit source allowlist for exported folders without Git metadata.
import {readdirSync,readFileSync,lstatSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {zipSync,unzipSync} from 'fflate';
import {checkpointRoots,checkpointRootFiles,allowedCheckpointPath,prepareCheckpoint,verifyCheckpoint,sha256} from './checkpoint-utils.mjs';

const args=process.argv.slice(2);
if(args.length&&!(args.length===2&&args[0]==='--output'))throw new Error('Usage: node scripts/export-checkpoint.mjs [--output path.zip]');
const source={};
function add(name){
 if(!allowedCheckpointPath(name))return;
 const stat=lstatSync(name);
 if(stat.isSymbolicLink())throw new Error('Checkpoint refuses symbolic links: '+name);
 if(stat.isFile())source[name]=new Uint8Array(readFileSync(name));
 else if(stat.isDirectory())walk(name);
}
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true}))add(dir+'/'+entry.name);}
for(const dir of checkpointRoots)if(existsSync(dir)){
 if(lstatSync(dir).isSymbolicLink())throw new Error('Checkpoint refuses symbolic links: '+dir);
 walk(dir);
}
if(existsSync('.openai')&&lstatSync('.openai').isSymbolicLink())throw new Error('Checkpoint refuses symbolic links: .openai');
for(const name of [...checkpointRootFiles,'.openai/hosting.json'])if(existsSync(name))add(name);
const previous=existsSync('SOURCE-SNAPSHOT.json')?JSON.parse(readFileSync('SOURCE-SNAPSHOT.json','utf8')):{};
const {files}=prepareCheckpoint(source,previous);
const archive=zipSync(files,{level:6});
const manifest=verifyCheckpoint(unzipSync(archive));
const target=resolve(args[1]||'exports/policy-atlas-checkpoint-'+new Date().toISOString().replaceAll(':','-').replaceAll('.','-')+'.zip');
mkdirSync(dirname(target),{recursive:true});writeFileSync(target,archive);
console.log(JSON.stringify({archive:target,snapshotKind:manifest.snapshotKind,sourceFiles:manifest.files,archiveBytes:archive.length,archiveSha256:sha256(archive),contentSha256:manifest.contentSha256,upstreamCommit:manifest.upstreamCommit,verifiedAllPayloadHashes:true},null,2));
