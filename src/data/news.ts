export interface NewsItem {
  date: string;
  sortDate: string;
  label: string;
  title: string;
  summary: string;
  link?: string;
}

const rawNewsItems: NewsItem[] = [
  {
    date: 'August 2026',
    sortDate: '2026-08-14',
    label: 'Paper accepted',
    title: 'GARFIELD accepted at BMVC 2026',
    summary:
      'GARFIELD: Graph-Adaptive SSM for Explainable 3D Multi-Person WiFi Pose Estimation has been accepted at BMVC 2026, with an acceptance rate of 27.9%. Congratulations to Quang-Anh N. D., Pham Minh Duc, and Prof. Kok-Seng Wong.',
  },
  {
    date: 'July 2026',
    sortDate: '2026-07-14',
    label: 'arXiv preprint',
    title: 'HERO benchmark library released on arXiv',
    summary:
      'HERO: A Heterogeneity-Aware Benchmark Library for Federated Continual Learning is now available on arXiv. The work introduces a heterogeneity-aware benchmark library with controlled task splits, client data splits, and task-order mismatch for reproducible federated continual learning evaluation.',
    link: 'https://arxiv.org/abs/2607.08784',
  },
  {
    date: 'July 2026',
    sortDate: '2026-07-08',
    label: 'Paper accepted',
    title: 'H-SFP provisionally accepted to ECCV 2026',
    summary:
      'H-SFP: Hierarchical Federated Learning with Decoupled Split-Model Prototyping has been provisionally accepted to ECCV 2026. Congratulations to Dung Tran, Nguyen Binh Ha, Duong Nguyen, Dinh Nguyen, and Prof. Kok-Seng Wong.',
  },
  {
    date: 'June 2026',
    sortDate: '2026-06-01',
    label: 'Paper accepted',
    title: 'WiFi-Mamba accepted to ICML 2026',
    summary:
      'Interleaved Selective State Space Models for Efficient WiFi-Based 3D Multi-Person Pose Estimation has been accepted to ICML 2026. Congratulations to Quang-Anh N. D. and Prof. Kok-Seng Wong.',
    link: 'https://icml.cc/virtual/2026/poster/64025',
  },
  {
    date: 'June 22, 2026',
    sortDate: '2026-06-22',
    label: 'arXiv preprint',
    title: 'Rethinking Molecular Graph Backdoors released on arXiv',
    summary:
      'Rethinking Molecular Graph Backdoors under Chemistry-aware Admission is now available on arXiv. The work studies chemistry-aware admission checks and admission-aware molecular graph backdoor attacks.',
    link: 'https://arxiv.org/abs/2606.23361',
  },
  {
    date: 'June 14, 2026',
    sortDate: '2026-06-14',
    label: 'arXiv preprint',
    title: 'Projected Rehearsal Orchestration released on arXiv',
    summary:
      'When Generator Replay Degrades: Projected Rehearsal Orchestration for Heterogeneous Federated Class-Incremental Learning is now available on arXiv.',
    link: 'https://arxiv.org/abs/2606.15695',
  },
  {
    date: 'May 2026',
    sortDate: '2026-05-01',
    label: 'Professional service',
    title: 'ICML 2026 reviewing recognition',
    summary:
      'Prof. Kok-Seng Wong has been recognized as an ICML 2026 Gold Reviewer, and Thinh Nguyen has been recognized as an ICML 2026 Silver Reviewer.',
  },
  {
    date: 'April 2026',
    sortDate: '2026-04-15',
    label: 'Professional service',
    title: 'NeurIPS 2026 Area Chair service',
    summary: 'Prof. Kok-Seng Wong will serve as an Area Chair for NeurIPS 2026.',
  },
  {
    date: 'April 2026',
    sortDate: '2026-04-01',
    label: 'Project launch',
    title: 'TrustFed: Trustworthy Federated Large Language Models',
    summary:
      'TrustFed is funded by the Accelerating Research Excellence Program, VinUniversity, from April 2026 to April 2028. Principal Investigator: Prof. Kok-Seng Wong.',
    link: '/projects/#trustfed-trustworthy-federated-large-language-models',
  },
  {
    date: 'March 2026',
    sortDate: '2026-03-01',
    label: 'Paper accepted',
    title: 'BackFed accepted at the ICLR 2026 Trustworthy AI Workshop',
    summary:
      'BackFed has been accepted at the ICLR 2026 Workshop on Principled Design for Trustworthy AI.',
  },
  {
    date: 'February 2026',
    sortDate: '2026-02-15',
    label: 'Paper accepted',
    title: 'HFedATM accepted at CVPR 2026',
    summary:
      'HFedATM has been accepted at the main technical track of CVPR 2026.',
  },
  {
    date: 'February 2026',
    sortDate: '2026-02-10',
    label: 'Paper accepted',
    title: 'Two papers accepted to CVPR 2026 Findings',
    summary:
      'Onboarding Without Forgetting and Memory-efficient Continual Learning with Prototypical Exemplar Condensation have been accepted at CVPR 2026 Findings.',
  },
  {
    date: 'November 2025',
    sortDate: '2025-11-01',
    label: 'Paper accepted',
    title: 'Clean-Label Physical Backdoor Attacks accepted at AAAI 2026',
    summary:
      'Clean-Label Physical Backdoor Attacks with Data Distillation has been accepted at the main technical track of AAAI 2026.',
  },
  {
    date: 'August 2025',
    sortDate: '2025-08-01',
    label: 'Paper accepted',
    title: 'SC-GIR accepted at IEEE Transactions on Mobile Computing',
    summary:
      'SC-GIR: Goal-oriented Semantic Communication via Invariant Representation Learning for Image Transmission has been accepted at IEEE TMC.',
  },
];

export const newsItems: NewsItem[] = [...rawNewsItems].sort(
  (a, b) => Date.parse(b.sortDate) - Date.parse(a.sortDate),
);
