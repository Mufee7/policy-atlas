import {resolve} from 'node:path';

export function generatedWatchIgnore(root=process.cwd()){
 const normalize=value=>{
  const path=resolve(value).replaceAll('\\','/');
  return process.platform==='win32'?path.toLowerCase():path;
 };
 const generated=['.tools','work','exports','outputs','.wrangler','.sites-runtime','.test-build','dist'].map(name=>normalize(resolve(root,name)));
 return file=>{
  const path=normalize(file);
  return generated.some(dir=>path===dir||path.startsWith(dir+'/'));
 };
}
