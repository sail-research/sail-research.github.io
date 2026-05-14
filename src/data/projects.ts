export type ProjectStatus = 'active' | 'completed' | 'exploratory';

export interface Project {
  title: string;
  slug: string;
  shortDescription: string;
  pillar: string;
  status: ProjectStatus;
  themes: string[];
  relatedPapers: string[];
  year?: string;
  note?: string;
  links?: { label: string; url: string }[];
}

export const projects: Project[] = [
  {
    title: 'TrustFed: Trustworthy Federated Large Language Models',
    slug: 'trustfed-trustworthy-federated-large-language-models',
    pillar: 'Distributed Learning / Trustworthy AI',
    status: 'active',
    year: '2026–2028',
    shortDescription:
      'A research project on trustworthy federated learning for large language models, focusing on robustness, privacy, evaluation, and scalable collaboration.',
    themes: ['Federated learning', 'Large language models', 'Trustworthy AI', 'Privacy', 'Robustness'],
    relatedPapers: ['FedDDF: Dynamic Dataset Filtering in Federated Large Language Model Training'],
    note: 'Funded by the Accelerating Research Excellence Program, VinUniversity. Principal Investigator: Prof. Kok-Seng Wong.',
  },
  {
    title: 'Privacy-Preserving, Robust, and Explainable Federated Learning for Healthcare',
    slug: 'privacy-preserving-robust-and-explainable-federated-learning-for-healthcare',
    pillar: 'Trustworthy AI / Distributed Learning',
    status: 'active',
    shortDescription:
      'Federated learning methods for healthcare systems where privacy, robustness, and interpretability are central requirements.',
    themes: ['Healthcare AI', 'Privacy', 'Robustness', 'Explainability', 'Cross-silo learning'],
    relatedPapers: [
      'Personalized Privacy-Preserving Framework for Cross-Silo Federated Learning',
      'On the Trade-off Between Privacy Protection and Data Utility for Chest X-ray Images',
    ],
  },
  {
    title: 'Privacy-Preserving Data Publishing for Autonomous Vehicles',
    slug: 'privacy-preserving-data-publishing-for-autonomous-vehicles',
    pillar: 'Trustworthy AI',
    status: 'completed',
    year: '2021–2023',
    shortDescription: 'Privacy-preserving data publishing methods for autonomous vehicle systems and mobility data.',
    themes: ['Privacy', 'Autonomous systems', 'Data publishing', 'Trust'],
    relatedPapers: ['Emerging Privacy and Trust Issues for Autonomous Vehicle Systems'],
  },
  {
    title: 'Green Serverless Computing for Resource-Efficient AI Training',
    slug: 'green-serverless-computing-for-resource-efficient-ai-training',
    pillar: 'Efficient Machine Learning',
    status: 'active',
    shortDescription:
      'Resource-efficient AI training infrastructure with an emphasis on greener, scalable serverless computing.',
    themes: ['Green AI', 'Resource efficiency', 'Serverless computing', 'Efficient training'],
    relatedPapers: ['Memory-efficient Continual Learning with Prototypical Exemplar Condensation'],
  },
  {
    title: 'Robust Federated Learning under Backdoor Threats',
    slug: 'robust-federated-learning-under-backdoor-threats',
    pillar: 'Trustworthy AI / Distributed Learning',
    status: 'active',
    shortDescription:
      'Benchmarking, understanding, and improving the robustness of federated learning systems under adversarial conditions.',
    themes: ['Federated learning', 'Robustness', 'Backdoor attacks and defenses', 'Benchmarking'],
    relatedPapers: [
      'BackFed: A Standardized and Efficient Benchmark Framework for Evaluating Backdoor Attacks in Federated Learning',
      'Backdoor Attacks and Defenses in Federated Learning: Survey, Challenges and Future Research Directions',
      'FedGrad: Mitigating Backdoor Attacks in Federated Learning Through Local Ultimate Gradients Inspection',
    ],
  },
  {
    title: 'Efficient Federated Learning on Edge Devices',
    slug: 'efficient-federated-learning-on-edge-devices',
    pillar: 'Efficient Machine Learning / Distributed Learning',
    status: 'active',
    shortDescription:
      'Federated learning methods for edge and IoT environments where memory, communication, and compute are constrained.',
    themes: ['Edge AI', 'Communication efficiency', 'Resource-constrained learning', 'Client heterogeneity'],
    relatedPapers: [
      'An Empirical Study of Federated Learning on IoT-Edge Devices: Resource Allocation and Heterogeneity',
      'FedDCT: Federated Learning of Large Convolutional Neural Networks on Resource Constrained Devices using Divide and Co-Training',
    ],
  },
];

export const getProjectBySlug = (slug: string) => projects.find((project) => project.slug === slug);
