export interface NewsItem {
  date: string;
  label: string;
  title: string;
  summary: string;
  link?: string;
}

export const newsItems: NewsItem[] = [
  {
    date: 'June 2026',
    label: 'Paper accepted',
    title: 'WiFi-Mamba accepted to ICML 2026',
    summary:
      'Interleaved Selective State Space Models for Efficient WiFi-Based 3D Multi-Person Pose Estimation has been accepted to ICML 2026. Congratulations to Quang-Anh N. D. and Prof. Kok-Seng Wong.',
    link: 'https://icml.cc/virtual/2026/poster/64025',
  },
  {
    date: 'June 22, 2026',
    label: 'arXiv preprint',
    title: 'Rethinking Molecular Graph Backdoors released on arXiv',
    summary:
      'Rethinking Molecular Graph Backdoors under Chemistry-aware Admission is now available on arXiv. The work studies chemistry-aware admission checks and admission-aware molecular graph backdoor attacks.',
    link: 'https://arxiv.org/abs/2606.23361',
  },
  {
    date: 'June 2026',
    label: 'Paper accepted',
    title: 'H-SFP provisionally accepted to ECCV 2026',
    summary:
      'H-SFP: Hierarchical Federated Learning with Decoupled Split-Model Prototyping has been provisionally accepted to ECCV 2026. Congratulations to Dung Tran, Nguyen Binh Ha, Duong Nguyen, Dinh Nguyen, and Prof. Kok-Seng Wong.',
  },
  {
    date: 'June 14, 2026',
    label: 'arXiv preprint',
    title: 'Projected Rehearsal Orchestration released on arXiv',
    summary:
      'When Generator Replay Degrades: Projected Rehearsal Orchestration for Heterogeneous Federated Class-Incremental Learning is now available on arXiv.',
    link: 'https://arxiv.org/abs/2606.15695',
  },
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
