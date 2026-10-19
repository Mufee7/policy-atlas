import {createHash} from 'node:crypto';
import {allowedSourcePath,standaloneManifest} from './source-export-utils.mjs';

export const checkpointRoots=['app','components','db','docs','drizzle','hooks','lib','public','scripts','tests','vendor','build','examples','evaluation'];
export const checkpointRootFiles=['PROJECT_STATUS.md','ROADMAP.md','Policy-Atlas.cmd','AGENTS.md','README.md','.gitignore','.npmrc','.env.example','cloudflare-env.d.ts','components.json','drizzle.config.ts','eslint.config.mjs','next.config.ts','package.json','playwright.config.ts','pnpm-lock.yaml','pnpm-workspace.yaml','postcss.config.mjs','tsconfig.json','vite.config.ts'];
const buildFiles=['connector-preview-plugin.mjs','connector-preview-worker.mjs','sites-vite-plugin.LICENSE','sites-vite-plugin.ts','sites-worker.ts'];
export const requiredCheckpointFiles=['AGENTS.md','app/page.tsx','package.json','pnpm-lock.yaml','playwright.config.ts','docs/LOCAL_SETUP.md','docs/RELEASE_CHECKPOINT.md','scripts/local-db.mjs','.openai/hosting.json'];
export function allowedCheckpointPath(name){
 const normalized=name.replaceAll('\\','/'),parts=normalized.split('/');
 if(parts.some(p=>!p||p==='.'||p==='..')||normalized.includes(':')||!allowedSourcePath(normalized))return false;
 if(checkpointRootFiles.includes(normalized)||normalized==='.openai/hosting.json')return true;
 if(parts.some(p=>p.startsWith('.')))return false;
 if(parts[0]==='build')return parts.length===2&&buildFiles.includes(parts[1]);
 return parts.length>1&&checkpointRoots.includes(parts[0]);
}
export const sha256=data=>createHash('sha256').update(data).digest('hex');
export function prepareCheckpoint(input,previous={},exportedAt=new Date().toISOString()){
 const files={},fileManifest=[];
 for(const name of Object.keys(input).sort()){
  if(!allowedCheckpointPath(name))continue;
  let data=new Uint8Array(input[name]);
  if(name==='.openai/hosting.json')data=new TextEncoder().encode(JSON.stringify(standaloneManifest(JSON.parse(new TextDecoder().decode(data))),null,2)+'\n');
  files['policy-atlas/'+name]=data;
  fileManifest.push({path:name,bytes:data.length,sha256:sha256(data)});
 }
 for(const name of requiredCheckpointFiles)if(!files['policy-atlas/'+name])throw new Error('Required source missing: '+name);
 const manifest={snapshotKind:'working-folder-checkpoint',commit:null,upstreamCommit:previous.commit||previous.upstreamCommit||null,exportedAt,files:fileManifest.length,uncompressedBytes:fileManifest.reduce((n,f)=>n+f.bytes,0),contentSha256:sha256(JSON.stringify(fileManifest)),hostingIdentityRemoved:true,runtimeDataIncluded:false,fileManifest,note:'Uncommitted working-folder source checkpoint, not a Git commit or user-data backup. File hashes cover source payloads, excluding this self-describing manifest. Read docs/LOCAL_SETUP.md and docs/RELEASE_CHECKPOINT.md for verification limits.'};
 files['policy-atlas/SOURCE-SNAPSHOT.json']=new TextEncoder().encode(JSON.stringify(manifest,null,2)+'\n');
 return{files,manifest};
}
export function verifyCheckpoint(files){
 const manifest=JSON.parse(new TextDecoder().decode(files['policy-atlas/SOURCE-SNAPSHOT.json']));
 if(manifest.snapshotKind!=='working-folder-checkpoint'||manifest.commit!==null||!Array.isArray(manifest.fileManifest))throw new Error('Not a working-folder checkpoint');
 if(manifest.files!==manifest.fileManifest.length||Object.keys(files).length!==manifest.files+1)throw new Error('Checkpoint file count mismatch');
 const paths=new Set();
 for(const entry of manifest.fileManifest){
  if(paths.has(entry.path)||!allowedCheckpointPath(entry.path))throw new Error('Unexpected or duplicate source path: '+entry.path);
  paths.add(entry.path);
  const bytes=files['policy-atlas/'+entry.path];
  if(!bytes||bytes.length!==entry.bytes||sha256(bytes)!==entry.sha256)throw new Error('Checkpoint hash mismatch: '+entry.path);
 }
 for(const name of requiredCheckpointFiles)if(!paths.has(name))throw new Error('Required source missing: '+name);
 if(sha256(JSON.stringify(manifest.fileManifest))!==manifest.contentSha256)throw new Error('Manifest content hash mismatch');
 if('project_id' in JSON.parse(new TextDecoder().decode(files['policy-atlas/.openai/hosting.json'])))throw new Error('Hosted project identity was retained');
 return manifest;
}
