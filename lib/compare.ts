import {sourceLabel,type Policy,type SourceLocation} from './core.js';
export type EvidenceLine={text:string;lineNumber:number;source?:SourceLocation};
export type DiffOp={kind:'equal'|'remove'|'add';before?:EvidenceLine;after?:EvidenceLine};
export type DiffGroup={kind:'unchanged'|'edited'|'removed'|'added';before:EvidenceLine[];after:EvidenceLine[]};
export function evidenceLines(policy:Policy):EvidenceLine[]{
 if(policy.extraction){return policy.extraction.units.flatMap(unit=>unit.text.replace(/\r\n?/g,'\n').split('\n').map((text,i)=>({text,lineNumber:i+1,source:{kind:policy.extraction!.format,number:unit.number,start:i+1,end:i+1}})));}
 const lines=policy.content.replace(/\r\n?/g,'\n').split('\n');if(lines.at(-1)==='')lines.pop();return lines.map((text,i)=>({text,lineNumber:i+1}));
}
export function lineReference(line:EvidenceLine){return sourceLabel(line.source,line.lineNumber,line.lineNumber);}
// Exact-line LCS after common-prefix/suffix trimming. Large ambiguous spans
// deliberately use a bounded coarse fallback rather than freeze the browser.
export function diffLines(a:EvidenceLine[],b:EvidenceLine[],maxCells=1000000):{operations:DiffOp[];coarse:boolean}{
 let prefix=0;while(prefix<a.length&&prefix<b.length&&a[prefix].text===b[prefix].text)prefix++;
 let suffix=0;while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix].text===b[b.length-1-suffix].text)suffix++;
 const operations:DiffOp[]=Array.from({length:prefix},(_,i)=>({kind:'equal',before:a[i],after:b[i]}));
 const left=a.slice(prefix,a.length-suffix),right=b.slice(prefix,b.length-suffix);const n=left.length,m=right.length;const coarse=n>0&&m>0&&(n+1)*(m+1)>maxCells;
 if(coarse){for(const before of left)operations.push({kind:'remove',before});for(const after of right)operations.push({kind:'add',after});}
 else if(!n){for(const after of right)operations.push({kind:'add',after});}
 else if(!m){for(const before of left)operations.push({kind:'remove',before});}
 else{
  const width=m+1;const table=new Uint32Array((n+1)*width);
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)table[i*width+j]=left[i].text===right[j].text?1+table[(i+1)*width+j+1]:Math.max(table[(i+1)*width+j],table[i*width+j+1]);
  let i=0,j=0;while(i<n||j<m){if(i<n&&j<m&&left[i].text===right[j].text){operations.push({kind:'equal',before:left[i++],after:right[j++]});}else if(i<n&&(j===m||table[(i+1)*width+j]>=table[i*width+j+1])){operations.push({kind:'remove',before:left[i++]});}else{operations.push({kind:'add',after:right[j++]});}}
 }
 for(let i=suffix;i>0;i--)operations.push({kind:'equal',before:a[a.length-i],after:b[b.length-i]});
 return{operations,coarse};
}
export function groupChanges(operations:DiffOp[]):DiffGroup[]{
 const groups:DiffGroup[]=[];for(const op of operations){const unchanged=op.kind==='equal';let group=groups.at(-1);if(!group||(group.kind==='unchanged')!==unchanged){group={kind:unchanged?'unchanged':op.kind==='add'?'added':'removed',before:[],after:[]};groups.push(group);}if(op.before)group.before.push(op.before);if(op.after)group.after.push(op.after);if(!unchanged)group.kind=group.before.length&&group.after.length?'edited':group.before.length?'removed':'added';}return groups;
}
export function compareVersions(before:Policy,after:Policy){
 if(before.documentId!==after.documentId)throw new Error('Choose two versions of the same document ID.');
 if(before.id===after.id)throw new Error('Choose two different document versions.');
 const left=evidenceLines(before),right=evidenceLines(after);const {operations,coarse}=diffLines(left,right);const groups=groupChanges(operations);const changed=groups.filter(g=>g.kind!=='unchanged');
 return{groups,coarse,stats:{addedLines:operations.filter(o=>o.kind==='add').length,removedLines:operations.filter(o=>o.kind==='remove').length,unchangedLines:operations.filter(o=>o.kind==='equal').length,editedBlocks:changed.filter(g=>g.kind==='edited').length,addedBlocks:changed.filter(g=>g.kind==='added').length,removedBlocks:changed.filter(g=>g.kind==='removed').length},identical:changed.length===0};
}
