import type { Policy } from './core.js';
const base={synthetic:true,sample:true,status:'approved' as const,effectiveUntil:null};
export const samples:Policy[]=[
{...base,id:'sample-remote-1',documentId:'POL-001',version:'1.0',title:'Remote Work Policy',department:'People',effectiveFrom:'2026-01-01',effectiveUntil:'2026-07-01',filename:'remote-work-v1.txt',content:`1. Eligibility
This policy applies to permanent full-time employees. Interns and contractors are not covered.

2. Remote Work Allowance
Eligible employees may work remotely up to two days per week.
Manager approval is required before working remotely.

3. Security Requirements
Employees must use a company-approved device and VPN
when accessing company systems remotely.

4. Exceptions
This document does not define an exception approval process.`},
{...base,id:'sample-remote-2',documentId:'POL-001',version:'2.0',title:'Remote Work Policy',department:'People',effectiveFrom:'2026-07-01',filename:'remote-work-v2.txt',content:`1. Eligibility
This policy applies to permanent full-time employees. Interns and contractors are not covered.

2. Remote Work Allowance
Eligible employees may work remotely up to three days per week.
Written manager approval is required before working remotely.

3. Security Requirements
Employees must use a company-approved device and VPN
when accessing company systems remotely. Public computers are prohibited.

4. Exceptions
Requests exceeding three remote days require written approval from both the department head and People Operations.`},
{...base,id:'sample-security-1',documentId:'POL-002',version:'1.0',title:'Information Security Policy',department:'Security',effectiveFrom:'2026-01-01',filename:'information-security-v1.txt',content:`1. Account Protection
Multi-factor authentication is required for email, source control and company cloud accounts.
Passwords must not be shared with coworkers.

2. Incident Reporting
Report suspected security incidents to the security team within one hour of discovery.
Preserve relevant evidence and do not investigate independently.

3. Data Handling
Customer records must be stored only in approved company systems.
Do not copy customer data to personal cloud storage.`},
{...base,id:'sample-travel-1',documentId:'POL-003',version:'1.0',title:'Travel & Expense Policy',department:'Finance',effectiveFrom:'2026-03-01',filename:'travel-expense-v1.txt',content:`1. Travel Approval
Business travel requires manager approval before booking. International travel also requires Finance approval.

2. Per Diem
The domestic meal allowance is LKR 3,000 per travel day.
Receipts are required for reimbursement. Alcohol is not reimbursable.

3. Expense Submission
Submit travel expense claims within fourteen calendar days after returning.
Attach receipts and the original travel approval.`},
{...base,id:'sample-leave-1',documentId:'POL-004',version:'1.0',title:'Leave Request Procedure',department:'People',effectiveFrom:'2026-01-01',filename:'leave-procedure-v1.txt',content:`1. Planned Leave
Submit planned annual leave requests at least seven calendar days in advance through the HR portal.
Your manager must approve the request before leave begins.

2. Sick Leave Notification
Notify your manager before the start of your shift when illness prevents you from working.
People Operations may request supporting documentation under the applicable leave policy.`},
{...base,id:'sample-security-draft',documentId:'POL-002',version:'2.0-draft',title:'Information Security Policy',department:'Security',status:'draft',effectiveFrom:'2026-01-01',filename:'information-security-v2-draft.txt',content:`1. Account Protection
Draft proposal: hardware security keys will be required for privileged administrator accounts.
This document is not approved and must not be treated as company policy.

2. Incident Reporting
Draft proposal: report suspected security incidents within thirty minutes of discovery.
This proposed deadline has not been approved.`}];
export const evaluation=[
{query:'remote days manager approval',date:'2026-05-01',expected:['sample-remote-1:4']},
{query:'remote days manager approval',date:'2026-10-18',expected:['sample-remote-2:4']},
{query:'VPN device',date:'2026-10-18',expected:['sample-remote-2:8']},
{query:'multi-factor authentication',date:'2026-10-18',expected:['sample-security-1:1']},
{query:'incident reporting discovery',date:'2026-10-18',expected:['sample-security-1:5']},
{query:'personal cloud customer',date:'2026-10-18',expected:['sample-security-1:9']},
{query:'per diem',date:'2026-10-18',expected:['sample-travel-1:4']},
{query:'expense claims receipts',date:'2026-10-18',expected:['sample-travel-1:8']},
{query:'international travel approval',date:'2026-10-18',expected:['sample-travel-1:1']},
{query:'planned annual leave',date:'2026-10-18',expected:['sample-leave-1:1']},
{query:'sick leave illness',date:'2026-10-18',expected:['sample-leave-1:5']},
{query:'exceptions department head',date:'2026-10-18',expected:['sample-remote-2:12']}];
