import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {generatedWatchIgnore} from '../scripts/watch-paths.mjs';

test('dev watcher ignores generated directory roots and descendants',()=>{
 const ignored=generatedWatchIgnore();
 for(const dir of ['.tools','work','exports','outputs','.wrangler','.sites-runtime','.test-build','dist']){
  assert.equal(ignored(resolve(dir)),true,dir);
  assert.equal(ignored(resolve(dir,'nested','.gitignore')),true,dir);
 }
 if(process.platform==='win32')assert.equal(ignored(resolve('.tools','verify').toUpperCase()),true);
});
test('dev watcher continues to watch source paths and similarly named directories',()=>{
 const ignored=generatedWatchIgnore();
 for(const path of ['app/page.tsx','app/work/page.tsx','app/exports/page.tsx','scripts/watch-paths.mjs','build/sites-vite-plugin.ts','vite.config.ts','.tools-extra/file.ts','outputs-source/file.ts'])assert.equal(ignored(resolve(path)),false,path);
});
