export interface SocialLink {
  label: string;
  url?: string;
}

export const site = {
  name: 'Security and Artificial Intelligence Lab',
  shortName: 'SAIL',
  affiliation: 'College of Engineering and Computer Science, VinUniversity',
  url: 'https://sailresearch.github.io',
  description:
    'Security and Artificial Intelligence Lab at VinUniversity: trustworthy, distributed, and efficient AI research.',
  email: 'contact@sail-research.com',
  address: ['G3 Building, VinUniversity', 'Vinhomes Ocean Park, Gia Lam District', 'Hanoi, Vietnam'],
  socialLinks: [
    { label: 'GitHub' },
    { label: 'LinkedIn' },
    { label: 'X' },
    { label: 'Facebook' },
  ] satisfies SocialLink[],
} as const;
