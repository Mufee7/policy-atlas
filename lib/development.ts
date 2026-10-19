import {evaluation} from './samples.js';
export type EvalQuery={id:string;query:string;date:string;expected:string[];category:string};
export const development:EvalQuery[]=[
 ...evaluation.map((q,i)=>({...q,id:`literal-${i+1}`,category:'literal'})),
 {id:'para-1',query:'Can I do my job from home?',date:'2026-10-18',expected:['sample-remote-2:4'],category:'paraphrase'},
 {id:'para-2',query:'Who signs off on working away from the office?',date:'2026-10-18',expected:['sample-remote-2:4'],category:'paraphrase'},
 {id:'para-3',query:'Are interns included in home working?',date:'2026-10-18',expected:['sample-remote-2:1'],category:'scope'},
 {id:'para-4',query:'What equipment and connection do I need when offsite?',date:'2026-10-18',expected:['sample-remote-2:8'],category:'paraphrase'},
 {id:'para-5',query:'Who can authorize more than three home-working days?',date:'2026-10-18',expected:['sample-remote-2:12'],category:'exception'},
 {id:'para-6',query:'Who do I tell if I spot a cyberattack?',date:'2026-10-18',expected:['sample-security-1:5'],category:'paraphrase'},
 {id:'para-7',query:'How quickly must a suspected breach be escalated?',date:'2026-10-18',expected:['sample-security-1:5'],category:'paraphrase'},
 {id:'para-8',query:'Is putting client details in my own Dropbox allowed?',date:'2026-10-18',expected:['sample-security-1:9'],category:'paraphrase'},
 {id:'para-9',query:'Can I give a colleague my login secret?',date:'2026-10-18',expected:['sample-security-1:1'],category:'paraphrase'},
 {id:'para-10',query:'Does signing into email require a second verification step?',date:'2026-10-18',expected:['sample-security-1:1'],category:'paraphrase'},
 {id:'para-11',query:'How much may I spend on meals while on a domestic business trip?',date:'2026-10-18',expected:['sample-travel-1:4'],category:'paraphrase'},
 {id:'para-12',query:'Can I get money back for beer during a work trip?',date:'2026-10-18',expected:['sample-travel-1:4'],category:'paraphrase'},
 {id:'para-13',query:'When is the deadline to claim trip costs?',date:'2026-10-18',expected:['sample-travel-1:8'],category:'paraphrase'},
 {id:'para-14',query:'Who must approve a journey abroad?',date:'2026-10-18',expected:['sample-travel-1:1'],category:'paraphrase'},
 {id:'para-15',query:'How far ahead should I book time off?',date:'2026-10-18',expected:['sample-leave-1:1'],category:'paraphrase'},
 {id:'para-16',query:"What should I do if I'm too ill to start my shift?",date:'2026-10-18',expected:['sample-leave-1:5'],category:'paraphrase'},
 {id:'para-17',query:'How many days can I work from home?',date:'2026-05-01',expected:['sample-remote-1:4'],category:'historical'},
 {id:'para-18',query:'Which staff categories are excluded from remote work?',date:'2026-10-18',expected:['sample-remote-2:1'],category:'scope'},
];
export const unsupported:EvalQuery[]=[
 {id:'unsupported-1',query:'What is the dental insurance allowance?',date:'2026-10-18',expected:[],category:'unsupported'},
 {id:'unsupported-2',query:'How much does a senior engineer earn?',date:'2026-10-18',expected:[],category:'unsupported'},
 {id:'unsupported-3',query:'How much paid maternity leave do employees receive?',date:'2026-10-18',expected:[],category:'unsupported'},
 {id:'unsupported-4',query:'What is the pension contribution percentage?',date:'2026-10-18',expected:[],category:'unsupported'},
 {id:'unsupported-5',query:'Which hospital should I visit for dengue treatment?',date:'2026-10-18',expected:[],category:'unsupported'},
 {id:'unsupported-6',query:'What are the weekly cafeteria opening hours?',date:'2026-10-18',expected:[],category:'unsupported'},
];
export function metrics(rows:{ranks:number[]}[]){const recall=(k:number)=>rows.reduce((s,r)=>s+r.ranks.filter(x=>x>0&&x<=k).length/(r.ranks.length||1),0)/(rows.length||1);return{recall1:recall(1),recall3:recall(3),recall5:recall(5),mrr:rows.reduce((s,r)=>s+1/Math.min(...r.ranks.filter(x=>x>0),Infinity),0)/(rows.length||1)};}
