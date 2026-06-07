export type PublicationStatus = 'accepted' | 'arxiv';
export type PublicationType = 'conference' | 'journal' | 'workshop' | 'preprint';
export type PublicationVenueMetricLabel = 'Impact Factor' | 'Ranking';

export interface PublicationLink {
  label: string;
  url: string;
}

export interface PublicationVenueMetric {
  label: PublicationVenueMetricLabel;
  value: string;
}

export interface Publication {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  status: PublicationStatus;
  type: PublicationType;
  tags: string[];
  venueMetric?: PublicationVenueMetric;
  links?: PublicationLink[];
  sourceNote?: string;
}

const kokSengVariants = [
  'Kok-Seng Wong',
  'Kok Seng Wong',
  'KS Wong',
  'K. S. Wong',
  'K.-S. Wong',
  'Wong, K. S.',
  'Wong, Kok-Seng',
  'Wong Kok-Seng',
];

export const includesKokSengWong = (authors: string[]) =>
  authors.some((author) => kokSengVariants.some((variant) => author.toLowerCase() === variant.toLowerCase()));

const venueMetrics: Record<string, PublicationVenueMetric> = {
  'AAAI 2026': { label: 'Ranking', value: 'CORE A*' },
  'CVPR 2026': { label: 'Ranking', value: 'CORE A*' },
  'CVPR 2026 Findings': { label: 'Ranking', value: 'CORE A* venue' },
  'ICLR 2026 Workshop on Principled Design for Trustworthy AI': { label: 'Ranking', value: 'Workshop' },
  'IEEE Transactions on Neural Networks and Learning Systems': { label: 'Impact Factor', value: '8.9' },
  'IEEE Transactions on Mobile Computing': { label: 'Impact Factor', value: '9.2' },
  'ICLR 2025': { label: 'Ranking', value: 'CORE A*' },
  'FL-AsiaCCS 2025': { label: 'Ranking', value: 'Workshop' },
  'IEEE Access': { label: 'Impact Factor', value: '3.6' },
  'ECCV 2024': { label: 'Ranking', value: 'CORE A' },
  'CVPR 2024': { label: 'Ranking', value: 'CORE A*' },
  'Findings of ACL 2024': { label: 'Ranking', value: 'CORE A* venue' },
  'IEEE Transactions on Emerging Topics in Computing': { label: 'Impact Factor', value: '5.4' },
  'Engineering Applications of Artificial Intelligence': { label: 'Impact Factor', value: '8.0' },
  'The Web Conference 2024': { label: 'Ranking', value: 'CORE A*' },
  'ICLR 2024': { label: 'Ranking', value: 'CORE A*' },
  'WACV 2024 Workshop': { label: 'Ranking', value: 'Workshop' },
  'IJCNN 2023': { label: 'Ranking', value: 'CORE A' },
  'NeurIPS 2023': { label: 'Ranking', value: 'CORE A*' },
  'ACML 2023': { label: 'Ranking', value: 'CORE B' },
  'IEEE Transactions on Network and Service Management': { label: 'Impact Factor', value: '5.4' },
  'ATC 2022': { label: 'Ranking', value: 'CORE unlisted' },
  'ICOIN 2022': { label: 'Ranking', value: 'CORE B' },
};

export const publications: Publication[] = [
  {
    title: 'Clean-Label Physical Backdoor Attacks with Data Distillation',
    authors: ['Thinh Dao', 'Kok-Seng Wong', 'Khoa D. Doan'],
    venue: 'AAAI 2026',
    year: 2026,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Robustness', 'Backdoor attacks and defenses'],
    links: [
      { label: 'AAAI', url: 'https://ojs.aaai.org/index.php/AAAI/article/view/37349' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2407.19203' },
    ],
  },
  {
    title: 'HFedATM: Hierarchical Federated Domain Generalization via Optimal Transport and Regularized Mean Aggregation',
    authors: ['Thinh Nguyen', 'Trung Phan', 'Binh T. Nguyen', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'CVPR 2026',
    year: 2026,
    status: 'accepted',
    type: 'conference',
    tags: ['Distributed Learning', 'Federated learning', 'Domain generalization', 'Efficient ML'],
    links: [
      { label: 'CVF', url: 'https://openaccess.thecvf.com/content/CVPR2026/papers/Nguyen_HFedATM_Hierarchical_Federated_Domain_Generalization_via_Optimal_Transport_and_Regularized_CVPR_2026_paper.pdf' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2508.05135' },
    ],
  },
  {
    title: 'Onboarding Without Forgetting: Hypernetwork Personalization with Data-Free Replay for Personalized Federated Learning',
    authors: ['Thinh Nguyen', 'Le Huy Khiem', 'Van-Tuan Tran', 'Khoa D. Doan', 'Nitesh V. Chawla', 'Kok-Seng Wong'],
    venue: 'CVPR 2026 Findings',
    year: 2026,
    status: 'accepted',
    type: 'conference',
    tags: ['Distributed Learning', 'Personalized federated learning', 'Continual learning'],
    links: [
      { label: 'CVF', url: 'https://openaccess.thecvf.com/content/CVPR2026F/papers/Nguyen_Onboarding_Without_Forgetting_Hypernetwork_Personalization_with_Data-Free_Replay_for_Personalized_CVPRF_2026_paper.pdf' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2508.05157' },
    ],
    sourceNote: 'Previously listed as pFedDSH arXiv preprint; moved to accepted after CVPR 2026 Findings acceptance.',
  },
  {
    title: 'Memory-efficient Continual Learning with Prototypical Exemplar Condensation',
    authors: ['M.-Duong Nguyen', 'Thien-Thanh Dao', 'Le-Tuan Nguyen', 'Dung D. Le', 'Kok-Seng Wong'],
    venue: 'CVPR 2026 Findings',
    year: 2026,
    status: 'accepted',
    type: 'conference',
    tags: ['Efficient ML', 'Continual learning', 'Memory efficiency'],
    links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2603.13804' }],
  },
  {
    title: 'BackFed: A Standardized and Efficient Benchmark Framework for Evaluating Backdoor Attacks in Federated Learning',
    authors: ['Thinh Dao', 'Dung Thuy Nguyen', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'ICLR 2026 Workshop on Principled Design for Trustworthy AI',
    year: 2026,
    status: 'accepted',
    type: 'workshop',
    tags: ['Trustworthy AI', 'Federated learning', 'Benchmarking'],
    links: [{ label: 'OpenReview', url: 'https://openreview.net/forum?id=0hHnZeXr9k' }],
  },
  {
    title: 'An Empirical Study of Federated Learning on IoT-Edge Devices: Resource Allocation and Heterogeneity',
    authors: ['Kok-Seng Wong', 'Manh Nguyen-Duc', 'Khiem Le-Huy', 'Long Ho-Tuan', 'Cuong Do-Danh', 'Danh Le-Phuoc'],
    venue: 'IEEE Transactions on Neural Networks and Learning Systems',
    year: 2025,
    status: 'accepted',
    type: 'journal',
    tags: ['Distributed Learning', 'Edge AI', 'Resource allocation'],
    links: [
      { label: 'DOI', url: 'https://doi.org/10.1109/TNNLS.2025.3611415' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2305.19831' },
    ],
  },
  {
    title: 'SC-GIR: Goal-oriented Semantic Communication via Invariant Representation Learning for Image Transmission',
    authors: ['Senura Hansaja Wanasekara', 'Van-Dinh Nguyen', 'Kok-Seng Wong', 'M-Duong Nguyen', 'Symeon Chatzinotas', 'Octavia A. Dobre'],
    venue: 'IEEE Transactions on Mobile Computing',
    year: 2025,
    status: 'accepted',
    type: 'journal',
    tags: ['Efficient ML', 'Semantic communication'],
    links: [
      { label: 'DOI', url: 'https://doi.org/10.1109/TMC.2025.3600434' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2509.01119' },
    ],
  },
  {
    title: 'Wicked Oddities: Selectively Poisoning for Effective Clean-Label Backdoor Attacks',
    authors: ['Nguyen Hung-Quang', 'Ngoc-Hieu Nguyen', 'The-Anh Ta', 'Thanh Nguyen-Tang', 'Kok-Seng Wong', 'Hoang Thanh-Tung', 'Khoa D. Doan'],
    venue: 'ICLR 2025',
    year: 2025,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Robustness', 'Backdoor attacks and defenses'],
    links: [
      { label: 'OpenReview', url: 'https://openreview.net/forum?id=1Z3C49JQVf' },
      { label: 'ICLR', url: 'https://iclr.cc/virtual/2025/poster/28903' },
    ],
  },
  {
    title: 'FedDDF: Dynamic Dataset Filtering in Federated Large Language Model Training',
    authors: ['Nguyen Nguyen Linh Bao', 'Tran Thuan Quang', 'Kok-Seng Wong'],
    venue: 'FL-AsiaCCS 2025',
    year: 2025,
    status: 'accepted',
    type: 'workshop',
    tags: ['Distributed Learning', 'Federated learning', 'Large language models'],
    links: [{ label: 'DOI', url: 'https://doi.org/10.1145/3709023.3737689' }],
  },
  {
    title: 'FedKoE: Enhancing Federated Multimodal Learning through Knowledge of Experts',
    authors: ['Duy Khuong', 'An D. Nguyen', 'Duy Nguyen', 'Kok-Seng Wong'],
    venue: 'FL-AsiaCCS 2025',
    year: 2025,
    status: 'accepted',
    type: 'workshop',
    tags: ['Distributed Learning', 'Federated learning', 'Multimodal learning'],
    links: [{ label: 'DOI', url: 'https://doi.org/10.1145/3709023.3737690' }],
  },
  {
    title: 'Benchmarking Federated Few-Shot Learning for Video-Based Action Recognition',
    authors: ['Nguyen Anh Tu', 'Nartay Aikyn', 'Nursultan Makhanov', 'Assanali Abu', 'Kok-Seng Wong', 'Min-Ho Lee'],
    venue: 'IEEE Access',
    year: 2024,
    status: 'accepted',
    type: 'journal',
    tags: ['Distributed Learning', 'Few-shot learning', 'Video understanding'],
    links: [{ label: 'DOI', url: 'https://doi.org/10.1109/ACCESS.2024.3519254' }],
  },
  {
    title: 'HPE-Li: WiFi-enabled Lightweight Dual Selective Kernel Convolution for Human Pose Estimation',
    authors: ['Gian Toan D.', 'Tien Dac Lai', 'Thien Van Luong', 'Kok-Seng Wong', 'Van-Dinh Nguyen'],
    venue: 'ECCV 2024',
    year: 2024,
    status: 'accepted',
    type: 'conference',
    tags: ['Efficient ML', 'Computer vision', 'Lightweight architectures'],
    links: [{ label: 'Paper', url: 'https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/8676_ECCV_2024_paper.php' }],
  },
  {
    title: 'Efficiently Assemble Normalization Layers and Regularization for Federated Domain Generalization',
    authors: ['Le Huy Khiem', 'Long Tuan Ho', 'Cuong Do', 'Danh Le-Phuoc', 'Kok-Seng Wong'],
    venue: 'CVPR 2024',
    year: 2024,
    status: 'accepted',
    type: 'conference',
    tags: ['Distributed Learning', 'Federated learning', 'Domain generalization'],
    links: [
      { label: 'CVF', url: 'https://openaccess.thecvf.com/content/CVPR2024/html/Le_Efficiently_Assemble_Normalization_Layers_and_Regularization_for_Federated_Domain_Generalization_CVPR_2024_paper.html' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2402.18092' },
    ],
  },
  {
    title: 'Fooling the Textual Fooler via Randomizing Latent Representations',
    authors: ['Duy C. Hoang', 'Quang H. Nguyen', 'Saurav Manchanda', 'MinLong Peng', 'Kok-Seng Wong', 'Khoa D. Doan'],
    venue: 'Findings of ACL 2024',
    year: 2024,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'NLP robustness'],
    links: [
      { label: 'ACL Anthology', url: 'https://aclanthology.org/2024.findings-acl.856/' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2404.12713' },
    ],
  },
  {
    title: 'Personalized Privacy-Preserving Framework for Cross-Silo Federated Learning',
    authors: ['Van-Tuan Tran', 'Huy-Hieu Pham', 'Kok-Seng Wong'],
    venue: 'IEEE Transactions on Emerging Topics in Computing',
    year: 2024,
    status: 'accepted',
    type: 'journal',
    tags: ['Distributed Learning', 'Privacy', 'Cross-silo learning'],
    links: [{ label: 'Paper', url: 'https://ieeexplore.ieee.org/document/10425423' }],
  },
  {
    title: 'Backdoor Attacks and Defenses in Federated Learning: Survey, Challenges and Future Research Directions',
    authors: ['Thuy Dung Nguyen', 'Tuan Nguyen', 'Phi Le Nguyen', 'Hieu H. Pham', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'Engineering Applications of Artificial Intelligence',
    year: 2024,
    status: 'accepted',
    type: 'journal',
    tags: ['Trustworthy AI', 'Federated learning', 'Survey'],
    links: [{ label: 'DOI', url: 'https://doi.org/10.1016/j.engappai.2023.107166' }],
  },
  {
    title: 'Towards Efficient Communication Federated Recommendation System via Low-rank Training',
    authors: ['Ngoc-Hieu Nguyen', 'Tuan-Anh Nguyen', 'Tuan Nguyen', 'Vu Tien Hoang', 'Dung D. Le', 'Kok-Seng Wong'],
    venue: 'The Web Conference 2024',
    year: 2024,
    status: 'accepted',
    type: 'conference',
    tags: ['Distributed Learning', 'Communication efficiency', 'Recommendation systems'],
    links: [
      { label: 'DOI', url: 'https://doi.org/10.1145/3589334.3645702' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2402.07095' },
    ],
  },
  {
    title: 'Understanding the Robustness of Randomized Feature Defense Against Query-Based Adversarial Attacks',
    authors: ['Quang H. Nguyen', 'Yingjie Lao', 'Tung Pham', 'Kok-Seng Wong', 'Khoa D. Doan'],
    venue: 'ICLR 2024',
    year: 2024,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Robustness', 'Adversarial machine learning'],
    links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2306.02140' }],
  },
  {
    title: 'FedFSLAR: A Federated Learning Framework for Few-shot Action Recognition',
    authors: ['Nguyen Anh Tu', 'Assanali Abu', 'Nartay Aikyn', 'Nursultan Makhanov', 'Min-Ho Lee', 'Khiem Le-Huy', 'Kok-Seng Wong'],
    venue: 'WACV 2024 Workshop',
    year: 2024,
    status: 'accepted',
    type: 'workshop',
    tags: ['Distributed Learning', 'Few-shot learning', 'Video understanding'],
    links: [{ label: 'Paper', url: 'https://openaccess.thecvf.com/content/WACV2024W/RWS/html/Tu_FedFSLAR_A_Federated_Learning_Framework_for_Few-Shot_Action_Recognition_WACVW_2024_paper.html' }],
  },
  {
    title: 'FedGrad: Mitigating Backdoor Attacks in Federated Learning Through Local Ultimate Gradients Inspection',
    authors: ['Thuy Dung Nguyen', 'Anh Duy Nguyen', 'Kok-Seng Wong', 'Huy Hieu Pham', 'Thanh Hung Nguyen', 'Phi Le Nguyen', 'Truong Thao Nguyen'],
    venue: 'IJCNN 2023',
    year: 2023,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Federated learning', 'Backdoor defenses'],
    links: [
      { label: 'DOI', url: 'https://doi.org/10.1109/IJCNN54540.2023.10191655' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2305.00328' },
    ],
  },
  {
    title: 'IBA: Towards Irreversible Backdoor Attacks in Federated Learning',
    authors: ['Dung Thuy Nguyen', 'Tuan Minh Nguyen', 'Anh Tuan Tran', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'NeurIPS 2023',
    year: 2023,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Federated learning', 'Backdoor attacks and defenses'],
    links: [{ label: 'Paper', url: 'https://proceedings.neurips.cc/paper_files/paper/2023/hash/5b3d5551ed69878d8bb1507d99f93f54-Abstract-Conference.html' }],
  },
  {
    title: 'An Empirical Study of Federated Unlearning: Efficiency and Effectiveness',
    authors: ['Thai-Hung Nguyen', 'Hong-Phuc Vu', 'Dung Thuy Nguyen', 'Tuan Minh Nguyen', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'ACML 2023',
    year: 2023,
    status: 'accepted',
    type: 'conference',
    tags: ['Distributed Learning', 'Federated unlearning', 'Privacy'],
    links: [{ label: 'Paper', url: 'https://proceedings.mlr.press/v222/nguyen24b.html' }],
  },
  {
    title: 'FedDCT: Federated Learning of Large Convolutional Neural Networks on Resource Constrained Devices using Divide and Co-Training',
    authors: ['Quan Nguyen', 'Hieu H. Pham', 'Kok-Seng Wong', 'Phi Le Nguyen', 'Truong Thao Nguyen', 'Minh N. Do'],
    venue: 'IEEE Transactions on Network and Service Management',
    year: 2023,
    status: 'accepted',
    type: 'journal',
    tags: ['Distributed Learning', 'Resource-constrained learning', 'Edge AI'],
    links: [
      { label: 'DOI', url: 'https://doi.org/10.1109/TNSM.2023.3314066' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2211.10948' },
    ],
  },
  {
    title: 'Toward Efficient Hierarchical Federated Learning Design Over Multi-Hop Wireless Communications Networks',
    authors: ['Tu Viet Nguyen', 'Nhan Duc Ho', 'Hieu Thien Hoang', 'Cuong Danh Do', 'Kok-Seng Wong'],
    venue: 'IEEE Access',
    year: 2022,
    status: 'accepted',
    type: 'journal',
    tags: ['Distributed Learning', 'Wireless systems', 'Communication efficiency'],
    links: [{ label: 'Paper', url: 'https://ieeexplore.ieee.org/document/9754556' }],
  },
  {
    title: 'On the Trade-off Between Privacy Protection and Data Utility for Chest X-ray Images',
    authors: ['Truong Giang Vu', 'Nursultan Makhanov', 'Nguyen Anh Tu', 'Kok-Seng Wong'],
    venue: 'ATC 2022',
    year: 2022,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Privacy', 'Healthcare AI'],
    links: [{ label: 'Paper', url: 'https://ieeexplore.ieee.org/document/9942963' }],
  },
  {
    title: 'Emerging Privacy and Trust Issues for Autonomous Vehicle Systems',
    authors: ['Thai-Hung Nguyen', 'Truong Giang Vu', 'Huong-Lan Tran', 'Kok-Seng Wong'],
    venue: 'ICOIN 2022',
    year: 2022,
    status: 'accepted',
    type: 'conference',
    tags: ['Trustworthy AI', 'Privacy', 'Autonomous systems'],
    links: [{ label: 'Paper', url: 'https://ieeexplore.ieee.org/document/9687247' }],
  },
  {
    title: 'Efficient two-party integer comparison with block vectorization mechanism',
    authors: ['Thai-Hung Nguyen', 'Kok-Seng Wong', 'Thomas Oikonomou'],
    venue: 'IEEE Access',
    year: 2021,
    status: 'accepted',
    type: 'journal',
    tags: ['Trustworthy AI', 'Privacy', 'Secure computation'],
    links: [{ label: 'Paper', url: 'https://ieeexplore.ieee.org/document/9514309' }],
  },
  {
    title: 'FLAT: Latent-Driven Arbitrary-Target Backdoor Attacks in Federated Learning',
    authors: ['Tuan Nguyen', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'arXiv preprint',
    year: 2025,
    status: 'arxiv',
    type: 'preprint',
    tags: ['Trustworthy AI', 'Federated learning', 'Backdoor attacks and defenses'],
    links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2508.04064' }],
  },
  {
    title: 'Non-Cooperative Backdoor Attacks in Federated Learning: A New Threat Landscape',
    authors: ['Tuan Nguyen', 'Dung Thuy Nguyen', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'arXiv preprint',
    year: 2024,
    status: 'arxiv',
    type: 'preprint',
    tags: ['Trustworthy AI', 'Federated learning', 'Backdoor attacks and defenses'],
    links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2407.07917' }],
  },
  {
    title: 'Venomancer: Towards Imperceptible and Target-on-Demand Backdoor Attacks in Federated Learning',
    authors: ['Son Nguyen', 'Thinh Nguyen', 'Khoa D. Doan', 'Kok-Seng Wong'],
    venue: 'arXiv preprint',
    year: 2024,
    status: 'arxiv',
    type: 'preprint',
    tags: ['Trustworthy AI', 'Federated learning', 'Backdoor attacks and defenses'],
    links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2407.03144' }],
  },
]
  .filter((publication) => includesKokSengWong(publication.authors))
  .map((publication) => ({
    ...publication,
    venueMetric: publication.venueMetric ?? venueMetrics[publication.venue],
  }));

const statusRank: Record<PublicationType, number> = {
  journal: 0,
  conference: 1,
  workshop: 2,
  preprint: 3,
};

export const sortPublications = (items: Publication[]) =>
  [...items].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (statusRank[a.type] !== statusRank[b.type]) return statusRank[a.type] - statusRank[b.type];
    return a.title.localeCompare(b.title);
  });

export const acceptedPublications = sortPublications(publications.filter((publication) => publication.status === 'accepted'));
export const arxivPublications = sortPublications(publications.filter((publication) => publication.status === 'arxiv'));
