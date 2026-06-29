export type TeamGroup =
  | 'professors'
  | 'phd'
  | 'master'
  | 'research-assistants'
  | 'undergraduate-ra'
  | 'undergraduate-interns'
  | 'alumni'
  | 'collaborators';

export interface PersonLink {
  label: string;
  url: string;
}

export interface Person {
  name: string;
  role: string;
  group: TeamGroup;
  affiliation?: string;
  image?: string;
  researchInterests?: string[];
  shortBio?: string;
  links?: PersonLink[];
}

export const team: Person[] = [
  {
    name: 'Kok-Seng Wong',
    role: 'Associate Professor, Computer Science program',
    group: 'professors',
    affiliation: 'College of Engineering and Computer Science, VinUniversity',
    image: '/team/wong.ks.jpg',
    researchInterests: [
      'Information Security',
      'Data Privacy Protection',
      'Trustworthy AI',
      'Backdoor Attacks and Defenses',
      'Federated Learning',
    ],
    shortBio:
      'Prof. Kok-Seng Wong works on information security, data privacy, trustworthy AI, and federated learning, with a focus on privacy protection, robustness, backdoor attacks and defenses, and communication efficiency.',
    links: [
      { label: 'Homepage', url: 'https://sites.google.com/view/kswong' },
      { label: 'Scholar', url: 'https://scholar.google.com/citations?user=WQyULhIAAAAJ&hl=en' },
      { label: 'Email', url: 'mailto:wong.ks@vinuni.edu.vn' },
    ],
  },
  {
    name: 'Tuan Nguyen',
    role: 'PhD Student, started January 2023',
    group: 'phd',
    affiliation: 'VinUniversity',
    image: '/team/tuan.nm.jpeg',
    researchInterests: ['Federated Learning', 'Backdoor Learning', 'Trustworthy Machine Learning', 'Adversarial Machine Learning'],
    links: [{ label: 'Homepage', url: 'https://mtuann.github.io' }],
  },
  {
    name: 'Nguyen Tran Huu Thinh',
    role: 'PhD Student, started September 2024',
    group: 'phd',
    affiliation: 'VinUniversity',
    image: '/team/thinh.nth.jpg',
    researchInterests: ['Federated Learning', 'Continual Learning', 'Domain Generalization'],
  },
  {
    name: 'La Duc Chinh',
    role: 'Research Assistant',
    group: 'research-assistants',
    affiliation: 'SAIL, VinUniversity',
    image: '/team/chinh.ld.jpg',
    researchInterests: ['Machine Learning', 'Computer Vision'],
  },
  {
    name: 'Hoang Cao Duy',
    role: 'Research Assistant',
    group: 'research-assistants',
    affiliation: 'SAIL, VinUniversity',
    image: '/team/duy.hc.jpeg',
    researchInterests: ['Computer Science'],
  },
  {
    name: 'Nguyen Hung Quang',
    role: 'Research Assistant',
    group: 'research-assistants',
    affiliation: 'SAIL, VinUniversity',
    image: '/team/quang.nh.jpg',
    researchInterests: ['Trustworthy AI', 'Backdoor Learning'],
  },
  {
    name: 'Nguyen Ngoc Hieu',
    role: 'Research Assistant',
    group: 'research-assistants',
    affiliation: 'SAIL, VinUniversity',
    image: '/team/hieu.nn.jpeg',
    researchInterests: ['Federated Learning', 'Efficient Learning'],
  },
  {
    name: 'Nguyen Minh Phuc',
    role: 'Research Assistant',
    group: 'research-assistants',
    affiliation: 'SAIL, VinUniversity',
    image: '/team/phuc.nm.jpg',
    researchInterests: ['Data Science', 'Machine Learning'],
  },
  {
    name: 'Tran Quang Thuan',
    role: 'Research Assistant Intern',
    group: 'research-assistants',
    affiliation: 'VNU-HCM University of Science / SAIL, VinUniversity',
    image: '/team/anno.jpg',
    researchInterests: ['Data Science', 'Federated Learning'],
  },
  {
    name: 'Dao Duc Thinh',
    role: 'Undergraduate Research Assistant',
    group: 'undergraduate-ra',
    affiliation: 'College of Engineering and Computer Science, VinUniversity',
    image: '/team/21thinh.dd.jpg',
    researchInterests: ['Federated Learning', 'Backdoor Learning'],
  },
  {
    name: 'Khuong Duy',
    role: 'UROP Student',
    group: 'undergraduate-ra',
    affiliation: 'College of Engineering and Computer Science, VinUniversity',
    image: '/team/22duy.k.jpg',
    researchInterests: ['Federated Learning', 'Multimodal Learning'],
  },
  {
    name: 'Ho Duc Nhan',
    role: 'Research Assistant, now Eureka Robotics',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/nhan.hd.jpeg',
  },
  {
    name: 'Nguyen Minh Quan',
    role: 'Research Assistant, now M.Sc. Biomedical Computing at TU Munich',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/quan.nm.jpeg',
    links: [{ label: 'Homepage', url: 'https://givralnguyen.github.io' }],
  },
  {
    name: 'Tran Van Tuan',
    role: 'Research Assistant, now PhD Computer Science at Trinity College Dublin',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/tuan.tv.jpeg',
  },
  {
    name: 'Nguyen Thuy Dung',
    role: 'Research Assistant, now PhD Computer Science at Vanderbilt University',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/dung.nt2.jpg',
    links: [{ label: 'Homepage', url: 'https://judydnguyen.github.io' }],
  },
  {
    name: 'Le Huy Khiem',
    role: 'Research Assistant, now PhD Computer Science at University of Notre Dame',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/khiem.lh.jpg',
    links: [{ label: 'Homepage', url: 'https://lhkhiem28.github.io' }],
  },
  {
    name: 'Vu Hong Phuc',
    role: 'Research Assistant',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/20phuc.vh.jpeg',
  },
  {
    name: 'Luong Ha Tri Nhan',
    role: 'Research Assistant, now PhD Computer Science at University of Toronto',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/nhan.lht.jpeg',
    researchInterests: ['AstroML', 'AI4Science', 'Computational Imaging'],
    links: [{ label: 'Homepage', url: 'https://lennemo09.github.io' }],
  },
  {
    name: 'Ho Tuan Long',
    role: 'Research Assistant, now Research Engineer at FPT Software AI Center',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/long.ht.jpeg',
  },
  {
    name: 'Hong-Son Nguyen',
    role: 'Research Assistant',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/son.nh.jpg',
    links: [{ label: 'Homepage', url: 'https://nguyenhongson1902.github.io' }],
  },
  {
    name: 'Jason Yang Sze Jue',
    role: 'Research Assistant',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/jason.y.jpeg',
    links: [{ label: 'Homepage', url: 'https://jasonyang429.github.io' }],
  },
  {
    name: 'Nguyen Thai Hung',
    role: 'Research Assistant, now M.Sc. Computer Science at University of Illinois Urbana-Champaign',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/hung.nt.jpg',
  },
  {
    name: 'Pham Phuoc Minh Quang',
    role: 'Research Assistant, now M.Sc. Robotics at MBZUAI',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/20quang.ppm.jpg',
  },
  {
    name: 'Le Chi Cuong',
    role: 'Research Assistant, now Resident at FPT Software AI Residency',
    group: 'alumni',
    affiliation: 'SAIL Alumni',
    image: '/team/21cuong.lc.jpeg',
  },
  {
    name: 'Khoa D. Doan',
    role: 'Collaborator',
    group: 'collaborators',
    affiliation: 'VinUniversity',
    image: '/team/khoa.dd.jpeg',
    researchInterests: ['Trustworthy AI', 'Federated Learning', 'Robust Machine Learning'],
    links: [{ label: 'Homepage', url: 'https://khoadoan.me' }],
  },
];

export const getPeopleByGroup = (group: TeamGroup) => team.filter((person) => person.group === group);
