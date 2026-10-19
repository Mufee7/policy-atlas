import {test} from 'node:test';
import assert from 'node:assert/strict';
import {strToU8,zipSync,unzipSync} from 'fflate';
import {allowedCheckpointPath,requiredCheckpointFiles,prepareCheckpoint,verifyCheckpoint,sha256} from '../scripts/checkpoint-utils.mjs';

test('working-folder checkpoint excludes non-source roots, secrets, generated data and path escapes',()=>{
 for(const path of ['.aws/credentials','.agents/state.json','.codex/settings.json','.openai/token.json','.openai/hosting.json','private.txt','SOURCE-SNAPSHOT.json','next-env.d.ts','app/.env.local','docs/key.pem','app/node_modules/x.js','build/generated.js','outputs/video.webm','.tools/node.exe','app/../secret.txt','/app/page.tsx','C:/app/page.tsx','app/.private/file.txt','scripts/__pycache__/evaluate_answers.pyc','evaluation/private/labels.json','public/uploads/private.pdf'])assert.equal(allowedCheckpointPath(path),false,path);
});
test('working-folder checkpoint includes new migrations, tests, preferences and licensed assets',()=>{
 for(const path of [...requiredCheckpointFiles,'PROJECT_STATUS.md','ROADMAP.md','evaluation/answering/final/report.json','evaluation/answering/final/labels.json','drizzle/0003_easy_bruce_banner.sql','examples/d1/db/schema.ts','tests/browser/usability.spec.ts','public/models/minilm/onnx/model_quantized.onnx','vendor/shadcn-tailwind-4.13.0.LICENSE.md','build/sites-vite-plugin.LICENSE'])assert.equal(allowedCheckpointPath(path),true,path);
});
function fixture(){return Object.fromEntries(requiredCheckpointFiles.map(path=>[path,strToU8(path==='local-bindings.json'?JSON.stringify({project_id:'private-id',d1:'DB',r2:'BUCKET'}):'synthetic source '+path)]));}
test('checkpoint round trip verifies payloads and clearly distinguishes upstream provenance from a commit',()=>{
 const source=fixture();
 const {files,manifest}=prepareCheckpoint(source,{commit:'upstream-commit'},'2026-10-19T00:00:00.000Z');
 assert.equal(manifest.commit,null);assert.equal(manifest.upstreamCommit,'upstream-commit');
 const verified=verifyCheckpoint(unzipSync(zipSync(files)));
 assert.equal(verified.contentSha256,manifest.contentSha256);
 assert.equal('project_id' in JSON.parse(new TextDecoder().decode(files['policy-atlas/local-bindings.json'])),false);
 assert.equal(JSON.parse(new TextDecoder().decode(source['local-bindings.json'])).project_id,'private-id');
 assert.equal(prepareCheckpoint({...source},{},'different date').manifest.contentSha256,manifest.contentSha256);
});
test('checkpoint verification rejects changed, missing or extra payloads',()=>{
 const {files}=prepareCheckpoint(fixture());
 assert.throws(()=>verifyCheckpoint({...files,'policy-atlas/app/page.tsx':strToU8('tampered')}),/hash mismatch/);
 const missing={...files};delete missing['policy-atlas/package.json'];
 assert.throws(()=>verifyCheckpoint(missing),/count mismatch/);
 assert.throws(()=>verifyCheckpoint({...files,'policy-atlas/private.txt':strToU8('unexpected')}),/count mismatch/);
});

test('historical checkpoints verify without reintroducing legacy files into new exports',()=>{
 const {files,manifest}=prepareCheckpoint(fixture());
 const legacy='.openai/hosting.json';
 files['policy-atlas/'+legacy]=files['policy-atlas/local-bindings.json'];
 delete files['policy-atlas/local-bindings.json'];
 manifest.fileManifest.find(f=>f.path==='local-bindings.json').path=legacy;
 manifest.fileManifest.sort((a,b)=>a.path.localeCompare(b.path));
 manifest.contentSha256=sha256(JSON.stringify(manifest.fileManifest));
 files['policy-atlas/SOURCE-SNAPSHOT.json']=strToU8(JSON.stringify(manifest));
 assert.equal(verifyCheckpoint(files).contentSha256,manifest.contentSha256);
 assert.equal(allowedCheckpointPath(legacy),false);
 const missing=fixture();delete missing['local-bindings.json'];
 assert.throws(()=>prepareCheckpoint({...missing,[legacy]:strToU8('{}')}),/Required source missing: local-bindings/);
});
