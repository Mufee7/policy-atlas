export function allowedSourcePath(name){
 const parts=name.replaceAll('\\','/').split('/');
 if(parts.some(p=>['.git','node_modules','.tools','.sites-runtime','.wrangler','.test-build','.next','.vinext','dist','coverage','exports','uploads','outputs'].includes(p)))return false;
 const base=parts.at(-1)||'';
 if((base.startsWith('.env')&&base!=='.env.example')||base.startsWith('.dev.vars')||base.endsWith('.pem')||base.endsWith('.key')||base.endsWith('.tsbuildinfo'))return false;
 return !name.endsWith('/');
}
export function standaloneManifest(original){const result={...original};delete result.project_id;return result;}
