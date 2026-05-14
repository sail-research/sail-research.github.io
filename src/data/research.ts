export interface ResearchPillar {
  title: string;
  slug: string;
  description: string;
  themes: string[];
  questions: string[];
  projectSlugs: string[];
  publicationKeywords: string[];
}

export const researchPillars: ResearchPillar[] = [
  {
    title: 'Trustworthy AI',
    slug: 'trustworthy-ai',
    description:
      'We study how machine learning systems behave under uncertainty, distribution shifts, adversarial conditions, and privacy constraints. Our work focuses on robustness, privacy protection, backdoor attacks and defenses, trustworthy evaluation, and safer deployment.',
    themes: [
      'Robustness',
      'Privacy',
      'Backdoor attacks and defenses',
      'Model reliability',
      'Explainability',
      'Federated security',
      'Trustworthy evaluation',
    ],
    questions: [
      'How can AI systems remain reliable under data shifts and adversarial conditions?',
      'How should privacy and utility be balanced in sensitive ML applications?',
      'How can backdoor risks be measured and mitigated in distributed settings?',
    ],
    projectSlugs: [
      'trustfed-trustworthy-federated-large-language-models',
      'privacy-preserving-robust-and-explainable-federated-learning-for-healthcare',
      'privacy-preserving-data-publishing-for-autonomous-vehicles',
      'robust-federated-learning-under-backdoor-threats',
    ],
    publicationKeywords: ['Trustworthy AI', 'Privacy', 'Robustness', 'Backdoor attacks and defenses'],
  },
  {
    title: 'Distributed Learning',
    slug: 'distributed-learning',
    description:
      'We design learning systems that work across distributed clients, data silos, institutions, and edge devices without centralizing private data. Our work includes federated learning, personalized learning, federated unlearning, fairness, communication efficiency, and cross-silo collaboration.',
    themes: [
      'Federated learning',
      'Cross-silo learning',
      'Personalized federated learning',
      'Federated unlearning',
      'Client heterogeneity',
      'Fairness',
      'Privacy-preserving collaboration',
    ],
    questions: [
      'How can multiple institutions learn together without centralizing private data?',
      'How can federated systems adapt to heterogeneous devices, clients, and data distributions?',
      'How can distributed systems onboard new clients while retaining previous knowledge?',
    ],
    projectSlugs: [
      'trustfed-trustworthy-federated-large-language-models',
      'privacy-preserving-robust-and-explainable-federated-learning-for-healthcare',
      'robust-federated-learning-under-backdoor-threats',
      'efficient-federated-learning-on-edge-devices',
    ],
    publicationKeywords: ['Distributed Learning', 'Federated learning', 'Cross-silo learning', 'Federated unlearning'],
  },
  {
    title: 'Efficient Machine Learning',
    slug: 'efficient-machine-learning',
    description:
      'We build efficient AI systems that reduce computation, communication, memory, and deployment cost. Our work studies resource-constrained learning, edge AI, efficient training, lightweight architectures, low-rank methods, and green AI infrastructure.',
    themes: [
      'Communication efficiency',
      'Edge AI',
      'Resource-constrained learning',
      'Low-rank training',
      'Efficient inference',
      'Green AI',
      'Lightweight architectures',
    ],
    questions: [
      'How can learning systems reduce communication and computation while remaining accurate?',
      'How should AI models be adapted for edge devices and constrained environments?',
      'How can training infrastructure become more scalable and resource-efficient?',
    ],
    projectSlugs: [
      'green-serverless-computing-for-resource-efficient-ai-training',
      'efficient-federated-learning-on-edge-devices',
      'trustfed-trustworthy-federated-large-language-models',
    ],
    publicationKeywords: ['Efficient ML', 'Communication efficiency', 'Edge AI', 'Resource-constrained learning'],
  },
];
