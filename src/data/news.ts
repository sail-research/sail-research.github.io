export interface NewsItem {
  date: string;
  label: string;
  title: string;
  summary: string;
  link?: string;
}

export const newsItems: NewsItem[] = [
  {
    date: 'May 2026',
    label: 'Professional service',
    title: 'ICML 2026 reviewing recognition',
    summary:
      'Prof. Kok-Seng Wong has been recognized as an ICML 2026 Gold Reviewer, and Thinh Nguyen has been recognized as an ICML 2026 Silver Reviewer.',
  },
  {
    date: 'April 2026',
    label: 'Professional service',
    title: 'NeurIPS 2026 Area Chair service',
    summary: 'Prof. Kok-Seng Wong will serve as an Area Chair for NeurIPS 2026.',
  },
  {
    date: 'April 2026',
    label: 'Project launch',
    title: 'TrustFed: Trustworthy Federated Large Language Models',
    summary:
      'TrustFed is funded by the Accelerating Research Excellence Program, VinUniversity, from April 2026 to April 2028. Principal Investigator: Prof. Kok-Seng Wong.',
    link: '/projects/#trustfed-trustworthy-federated-large-language-models',
  },
  {
    date: 'March 2026',
    label: 'Paper accepted',
    title: 'BackFed accepted at the ICLR 2026 Trustworthy AI Workshop',
    summary:
      'BackFed has been accepted at the ICLR 2026 Workshop on Principled Design for Trustworthy AI.',
  },
  {
    date: 'February 2026',
    label: 'Paper accepted',
    title: 'HFedATM accepted at CVPR 2026',
    summary:
      'HFedATM has been accepted at the main technical track of CVPR 2026.',
  },
  {
    date: 'February 2026',
    label: 'Paper accepted',
    title: 'Two papers accepted to CVPR 2026 Findings',
    summary:
      'Onboarding Without Forgetting and Memory-efficient Continual Learning with Prototypical Exemplar Condensation have been accepted at CVPR 2026 Findings.',
  },
  {
    date: 'November 2025',
    label: 'Paper accepted',
    title: 'Clean-Label Physical Backdoor Attacks accepted at AAAI 2026',
    summary:
      'Clean-Label Physical Backdoor Attacks with Data Distillation has been accepted at the main technical track of AAAI 2026.',
  },
  {
    date: 'August 2025',
    label: 'Paper accepted',
    title: 'SC-GIR accepted at IEEE Transactions on Mobile Computing',
    summary:
      'SC-GIR: Goal-oriented Semantic Communication via Invariant Representation Learning for Image Transmission has been accepted at IEEE TMC.',
  },
];
