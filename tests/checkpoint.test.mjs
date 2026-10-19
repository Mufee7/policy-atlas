import {test} from 'node:test';
import assert from 'node:assert/strict';
import {strToU8,zipSync,unzipSync} from 'fflate';
import {allowedCheckpointPath,requiredCheckpointFiles,prepareCheckpoint,verifyCheckpoint} from '../scripts/checkpoint-utils.mjs';

test('working-folder checkpoint excludes non-source roots, secrets, generated data and path escapes',()=>{
 for(const path of ['.aws/credentials','.agents/state.json','.codex/settings.json','.openai/token.json','private.txt','SOURCE-SNAPSHOT.json','next-env.d.ts','app/.env.local','docs/key.pem','app/node_modules/x.js','build/generated.js','outputs/video.webm','.tools/node.exe','app/../secret.txt','/app/page.tsx','C:/app/page.tsx','app/.private/file.txt'])assert.equal(allowedCheckpointPath(path),false,path);
});
test('working-folder checkpoint includes new migrations, tests, preferences and licensed assets',()=>{
 for(const path of [...requiredCheckpointFiles,'drizzle/0003_easy_bruce_banner.sql','examples/d1/db/schema.ts','tests/browser/usability.spec.ts','public/models/minilm/onnx/model_quantized.onnx','vendor/shadcn-tailwind-4.13.0.LICENSE.md','build/sites-vite-plugin.LICENSE'])assert.equal(allowedCheckpointPath(path),true,path);
});
function fixture(){return Object.fromEntries(requiredCheckpointFiles.map(path=>[path,strToU8(path==='.openai/hosting.json'?JSON.stringify({project_id:'private-id',d1:'DB',r2:'BUCKET'}):'synthetic source '+path)]));}
test('checkpoint round trip verifies payloads and clearly distinguishes upstream provenance from a commit',()=>{
 const source=fixture();
 const {files,manifest}=prepareCheckpoint(source,{commit:'upstream-commit'},'2026-10-19T00:00:00.000Z');
 assert.equal(manifest.commit,null);assert.equal(manifest.upstreamCommit,'upstream-commit');
 const verified=verifyCheckpoint(unzipSync(zipSync(files)));
 assert.equal(verified.contentSha256,manifest.contentSha256);
 assert.equal('project_id' in JSON.parse(new TextDecoder().decode(files['policy-atlas/.openai/hosting.json'])),false);
 assert.equal(JSON.parse(new TextDecoder().decode(source['.openai/hosting.json'])).project_id,'private-id');
 assert.equal(prepareCheckpoint({...source},{},'different date').manifest.contentSha256,manifest.contentSha256);
});
test('checkpoint verification rejects changed, missing or extra payloads',()=>{
 const {files}=prepareCheckpoint(fixture());
 assert.throws(()=>verifyCheckpoint({...files,'policy-atlas/app/page.tsx':strToU8('tampered')}),/hash mismatch/);
 const missing={...files};delete missing['policy-atlas/package.json'];
 assert.throws(()=>verifyCheckpoint(missing),/count mismatch/);
 assert.throws(()=>verifyCheckpoint({...files,'policy-atlas/private.txt':strToU8('unexpected')}),/count mismatch/);
});
