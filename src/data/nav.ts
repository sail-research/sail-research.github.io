export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'People', href: '/team/' },
  { label: 'Teaching', href: '/teaching/' },
  { label: 'Publications', href: '/publications/' },
  { label: 'Research', href: '/research/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Gallery', href: '/gallery/' },
];
