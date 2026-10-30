export const designFamilies = [
  { id: 'clarity', option: 1, name: 'Clarity Workspace', description: 'A clear, focused research workspace.', overview: '/training/overview/option-1/' },
  { id: 'atlas', option: 2, name: 'Research Atlas', description: 'An editorial approach to learning and discovery.', overview: '/training/overview/option-2/' },
] as const;

export const designScreens = [
  { id: 'login', number: '01', title: 'Invite & Login', heading: 'Your research journey starts here.', description: 'Sign in with the email address on your invitation.', role: 'Student', group: 'Getting started', nav: 'Overview' },
  { id: 'enrollment', number: '02', title: 'Enrollment', heading: 'Make room for your next chapter.', description: 'A focused six-week path from foundations to your first research project.', role: 'Student', group: 'Getting started', nav: 'Overview' },
  { id: 'module', number: '03', title: 'Module Detail', heading: 'Trustworthy AI', description: 'Understand robustness, privacy, and the assumptions behind reliable AI.', role: 'Student', group: 'Learning & assessment', nav: 'My modules' },
  { id: 'lesson', number: '04', title: 'Lesson & Materials', heading: 'Backdoor attacks & defenses', description: 'Learn to read the threat model before you read the results.', role: 'Student', group: 'Learning & assessment', nav: 'My modules' },
  { id: 'assignment', number: '05', title: 'Assignment & Submission', heading: 'A controlled robustness experiment', description: 'Turn a research question into a small, reproducible experiment.', role: 'Student', group: 'Learning & assessment', nav: 'Submissions' },
  { id: 'feedback', number: '06', title: 'Submission & Feedback', heading: 'A little more clarity. A stronger result.', description: 'Review your feedback and prepare the next version of your work.', role: 'Student', group: 'Learning & assessment', nav: 'Submissions' },
  { id: 'project', number: '07', title: 'Final Mini-project', heading: 'Put your research foundations to work.', description: 'One focused question. A careful experiment. A clear explanation.', role: 'Student', group: 'Completion & recognition', nav: 'Mini-project' },
  { id: 'result', number: '08', title: 'Program Result & Certificate', heading: 'Ready for your next research chapter.', description: 'You have completed the SAIL Undergraduate Research Training Program.', role: 'Student', group: 'Completion & recognition', nav: 'Certificate' },
  { id: 'verify', number: '09', title: 'Certificate Verification', heading: 'A record of research readiness.', description: 'Verify a certificate issued by the Security and Artificial Intelligence Lab.', role: 'Public', group: 'Completion & recognition', nav: 'Certificate' },
  { id: 'operations', number: '10', title: 'Training Operations', heading: 'A clear view of every research journey.', description: 'Support students, review their work, and keep the program moving.', role: 'Admin', group: 'Admin & reviewer', nav: 'Overview' },
  { id: 'student', number: '11', title: 'Student Detail', heading: 'Linh Nguyen', description: 'Undergraduate · VinUniversity · Enrolled October 8, 2026', role: 'Admin', group: 'Admin & reviewer', nav: 'Students' },
  { id: 'curriculum', number: '12', title: 'Curriculum Management', heading: 'Build a thoughtful learning path.', description: 'Organize the foundations, lessons, and assignments behind the program.', role: 'Admin', group: 'Admin & reviewer', nav: 'Curriculum' },
  { id: 'projects', number: '13', title: 'Mini-project Management', heading: 'Small projects. Real research habits.', description: 'Create focused briefs and assign the right challenge to each student.', role: 'Admin', group: 'Admin & reviewer', nav: 'Projects' },
  { id: 'review', number: '14', title: 'Submission Review', heading: 'Give feedback that moves research forward.', description: 'Review the evidence, explain the next step, and record a clear outcome.', role: 'Reviewer', group: 'Admin & reviewer', nav: 'Reviews' },
] as const;

export const designStates = [
  { id: 'check-email', screen: 'login', label: 'Check your email', note: 'Email sign-in confirmation' },
  { id: 'submitted', screen: 'assignment', label: 'Waiting for review', note: 'Submission received, awaiting reviewer' },
  { id: 'overdue', screen: 'assignment', label: 'Deadline passed', note: 'Hard deadline reached; submission closed' },
  { id: 'excellent', screen: 'feedback', label: 'Excellent', note: 'Outstanding submission feedback' },
  { id: 'pass', screen: 'feedback', label: 'Pass', note: 'Submission accepted' },
  { id: 'fail', screen: 'feedback', label: 'Fail', note: 'Submission does not meet requirements' },
  { id: 'excellent', screen: 'result', label: 'Excellent completion', note: 'Certificate with an Excellent result' },
  { id: 'fail', screen: 'result', label: 'Further preparation needed', note: 'Program not completed; no certificate' },
] as const;

export const students = [
  { name: 'Linh Nguyen', initials: 'LN', pillar: 'Trustworthy AI', progress: '2 / 6', result: 'Revision', submitted: 'Oct 19', deadline: 'Nov 19' },
  { name: 'Minh Tran', initials: 'MT', pillar: 'Federated Learning', progress: '4 / 6', result: 'Submitted', submitted: 'Oct 20', deadline: 'Nov 12' },
  { name: 'Anh Le', initials: 'AL', pillar: 'Efficient ML', progress: '3 / 6', result: 'In progress', submitted: 'Oct 17', deadline: 'Nov 16' },
  { name: 'Nam Pham', initials: 'NP', pillar: 'Deep Learning', progress: '1 / 6', result: 'Submitted', submitted: 'Oct 20', deadline: 'Nov 26' },
];

export const routeFor = (family: string, screen: string, state?: string) => `/training/designs/${family}/${screen}/${state ? `${state}/` : ''}`;
export const designAsset = (name: string) => `/training-overview/assets/${name}.png`;
export type DesignScreen = typeof designScreens[number];
