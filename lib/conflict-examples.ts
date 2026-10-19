import type {Policy} from './core.js';import {samples} from './samples.js';
const base={sample:true,synthetic:true,status:'approved' as const,effectiveFrom:'2026-01-01',effectiveUntil:null,department:'People',format:'txt' as const,version:'1.0'};
export const conflictExamples:Policy[]=[
 {...base,id:'conflict-demo-remote',documentId:'DEMO-REMOTE',title:'Fictional Remote Work Policy',filename:'fictional-remote.txt',content:'1. Scope\nThis policy applies only to permanent full-time employees. Interns and contractors are not covered.\n\n2. Weekly Remote Work\nPermanent employees may work remotely up to three days per week. Manager approval is required.'},
 {...base,id:'conflict-demo-sop',documentId:'DEMO-SOP',title:'Fictional Remote Work SOP',filename:'fictional-sop.txt',content:'1. Scope\nThis policy applies only to permanent full-time employees. Interns and contractors are not covered.\n\n2. Weekly Remote Work\nPermanent employees may work remotely up to two days per week. Manager approval is required.'},
 {...base,id:'conflict-demo-interns',documentId:'DEMO-INTERN',title:'Fictional Intern Remote Work Rules',filename:'fictional-interns.txt',content:'1. Scope\nThis policy applies only to interns. Permanent employees are excluded.\n\n2. Weekly Remote Work\nInterns may work remotely up to one day per week with manager approval.'},
 {...base,id:'conflict-demo-exception',documentId:'DEMO-EXCEPTION',title:'Fictional Remote Work Exception',filename:'fictional-exception.txt',content:'1. Scope\nThis policy applies only to permanent full-time employees.\n\n2. Exception\nAs an exception with special approval, eligible staff may work remotely up to five days per week.'},
 {...base,id:'conflict-demo-hour',documentId:'DEMO-SECURITY',department:'Security',title:'Fictional Incident Reporting Policy',filename:'fictional-incident-hour.txt',content:'1. Incident Reporting\nReport suspected incidents within one hour of discovery.'},
 {...base,id:'conflict-demo-minutes',documentId:'DEMO-SEC-SOP',department:'Security',title:'Fictional Incident Reporting SOP',filename:'fictional-incident-minutes.txt',content:'1. Incident Reporting\nReport suspected incidents within sixty minutes of discovery.'},
];
export const conflictScenarios=[
 {id:'overlap',label:'Overlapping approved rules · possible disagreement',left:'conflict-demo-remote',right:'conflict-demo-sop',date:'2026-10-18'},
 {id:'historical',label:'Historical version change · no shared effective period',left:samples[0].id,right:samples[1].id,date:'2026-10-18'},
 {id:'scope',label:'Different scope · interns vs permanent employees',left:'conflict-demo-remote',right:'conflict-demo-interns',date:'2026-10-18'},
 {id:'draft',label:'Draft proposal · not competing approved policy',left:samples[2].id,right:samples[5].id,date:'2026-10-18'},
 {id:'consistent',label:'Equivalent deadlines · one hour vs sixty minutes',left:'conflict-demo-hour',right:'conflict-demo-minutes',date:'2026-10-18'},
 {id:'exception',label:'Exception language · further context required',left:'conflict-demo-remote',right:'conflict-demo-exception',date:'2026-10-18'},
];
