export function allowedSourcePath(name){
 const normalized=name.replaceAll('\\','/'),parts=normalized.toLowerCase().split('/');
 if(parts.some(p=>['.git','node_modules','.tools','.sites-runtime','.wrangler','.test-build','.next','.vinext','.aws','.ssh','.agents','.codex','__pycache__','dist','coverage','exports','uploads','outputs','work','backups','private','playwright-report','test-results','htmlcov'].includes(p)))return false;
 if(parts.includes('.openai'))return false;
 const base=parts.at(-1)||'';
 if((base.startsWith('.env')&&base!=='.env.example')||base.startsWith('.dev.vars')||base==='.coverage'||/\.(pem|key|pfx|p12|pyc|tsbuildinfo|sqlite(?:-wal|-shm)?|db(?:-wal|-shm)?|zip|7z)$/.test(base))return false;
 return !name.endsWith('/');
}
export function standaloneManifest(original){const result={...original};delete result.project_id;return result;}
