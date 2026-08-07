export interface TaughtCourse {
  no: number;
  semester: string;
  courseCode: string;
  credits: number;
  groupEnd?: boolean;
}

export interface CourseDescription {
  code: string;
  title: string;
}

export interface CapstoneProject {
  year: number;
  title: string;
  students: string[];
}

export const taughtCourses: TaughtCourse[] = [
  { no: 1, semester: "Fall'20", courseCode: 'COMP1010', credits: 4, groupEnd: true },
  { no: 2, semester: "Fall'20", courseCode: 'CECS1010', credits: 4 },
  { no: 3, semester: "Spring'21", courseCode: 'COMP1020', credits: 4, groupEnd: true },
  { no: 4, semester: "Spring'21", courseCode: 'COMP1030', credits: 3 },
  { no: 5, semester: "Fall'21", courseCode: 'COMP1010', credits: 4, groupEnd: true },
  { no: 6, semester: "Fall'21", courseCode: 'CECS1010', credits: 4 },
  { no: 7, semester: "Spring'22", courseCode: 'COMP1020', credits: 4, groupEnd: true },
  { no: 8, semester: "Spring'22", courseCode: 'COMP1030', credits: 3 },
  { no: 9, semester: "Fall'22", courseCode: 'COMP1010', credits: 4, groupEnd: true },
  { no: 10, semester: "Fall'22", courseCode: 'CECS1010', credits: 4 },
  { no: 11, semester: "Spring'23", courseCode: 'COMP1020', credits: 4, groupEnd: true },
  { no: 12, semester: "Spring'23", courseCode: 'COMP3010', credits: 4 },
  { no: 13, semester: "Fall'23", courseCode: 'COMP1010', credits: 4, groupEnd: true },
  { no: 14, semester: "Fall'23", courseCode: 'CECS1010', credits: 4 },
  { no: 15, semester: "Spring'24", courseCode: 'COMP4030', credits: 4 },
  { no: 16, semester: "Fall'24", courseCode: 'COMP1010', credits: 4, groupEnd: true },
  { no: 17, semester: "Fall'24", courseCode: 'CECS1010', credits: 4 },
  { no: 18, semester: "Spring'25", courseCode: 'COMP3010', credits: 4, groupEnd: true },
  { no: 19, semester: "Spring'25", courseCode: 'CECS1030', credits: 3 },
  { no: 20, semester: "Fall'25", courseCode: 'COMP1010', credits: 4 },
  { no: 21, semester: "Spring'26", courseCode: 'COMP1020', credits: 4, groupEnd: true },
  { no: 22, semester: "Spring'26", courseCode: 'COMP3010', credits: 4 },
];

export const currentSemester = {
  label: 'Spring 2026',
  courseCodes: ['COMP1020', 'COMP3010'],
};

export const teachingAssistants: string[] = [];

export const courseDescriptions: CourseDescription[] = [
  { code: 'COMP1010', title: 'Introduction to Programming' },
  { code: 'CECS1010', title: 'Introduction to Engineering and Computer Science' },
  { code: 'COMP1020', title: 'Object-oriented Programming and Data Structures' },
  { code: 'COMP1030', title: 'Computational Thinking (for CBM students)' },
  { code: 'COMP3010', title: 'Algorithms Design' },
  { code: 'COMP4030', title: 'Cybersecurity' },
];

export const capstoneProjects: CapstoneProject[] = [
  {
    year: 2023,
    title: 'Secure and Practical Federated Learning System',
    students: ['Le Nu Nguyen Phuong', 'Vu Truong Giang', 'Pham Duc Hiep'],
  },
  {
    year: 2025,
    title: 'Practical Deployment of Encrypted Database',
    students: ['Nguyen Tuan Anh', 'Dinh Van Thanh', 'Do Huu Dat', 'Nguyen Du Loi'],
  },
  {
    year: 2026,
    title: 'Privacy-preserving AI Veterinary Chatbot Platform',
    students: ['Ha Minh Dung', 'Thai Ba Hung', 'Nguyen Hoang Hieu'],
  },
];
