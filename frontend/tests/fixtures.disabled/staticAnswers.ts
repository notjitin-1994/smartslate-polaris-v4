/**
 * Static Answer Test Fixtures (V2.0 Format)
 * 3-section format as per current production implementation
 */

export const validStaticAnswersV20 = {
  section_1_role_experience: {
    current_role: 'Learning & Development Manager',
    years_in_role: 5,
    previous_roles: 'Training Coordinator, Instructional Designer',
    industry_experience: ['Technology', 'Healthcare', 'Finance'],
    team_size: '6-10',
    technical_skills: [
      'LMS Management',
      'Content Development',
      'Data Analytics',
      'Project Management',
    ],
  },
  section_2_organization: {
    organization_name: 'TechCorp Solutions Inc.',
    industry_sector: 'Technology',
    organization_size: '201-1000',
    geographic_regions: ['North America', 'Europe', 'Asia Pacific'],
    compliance_requirements: ['GDPR', 'SOC 2', 'ISO 27001'],
    data_sharing_policies: 'Internal Only',
    security_clearance: 'None',
    legal_restrictions: 'None',
  },
  section_3_learning_gap: {
    learning_gap_description:
      'Our sales team needs to develop advanced consultative selling skills to handle complex enterprise deals. Currently, they struggle with needs analysis, solution mapping, and value articulation for technical products.',
    total_learners_range: '51-100',
    current_knowledge_level: 3,
    desired_knowledge_level: 8,
    motivation_factors: ['Career advancement', 'Skill development', 'Performance incentives'],
    learning_location: ['Office', 'Remote', 'Hybrid'],
    devices_used: ['Desktop', 'Laptop', 'Mobile'],
    hours_per_week: '3-5 hours',
    learning_deadline: '2025-06-30',
    budget_available: {
      amount: 75000,
      currency: 'USD',
    },
  },
};

export const minimalStaticAnswersV20 = {
  section_1_role_experience: {
    current_role: 'Manager',
    years_in_role: 1,
    industry_experience: ['General'],
    team_size: '1-5',
    technical_skills: ['Basic'],
  },
  section_2_organization: {
    organization_name: 'Small Company',
    industry_sector: 'Other',
    organization_size: '1-50',
    geographic_regions: ['North America'],
    compliance_requirements: [],
    data_sharing_policies: 'Not specified',
  },
  section_3_learning_gap: {
    learning_gap_description: 'Need basic training',
    total_learners_range: '1-10',
    current_knowledge_level: 1,
    hours_per_week: '1-2 hours',
  },
};

export const edgeCaseStaticAnswersV20 = {
  section_1_role_experience: {
    custom_role: 'Chief Learning Evangelist & Innovation Catalyst', // Using custom_role instead of current_role
    years_in_role: 25,
    previous_roles:
      'Started as intern, worked my way up through every role imaginable including janitor, receptionist, trainer, designer, manager, director, VP, and now this unique position',
    industry_experience: [
      'Technology',
      'Healthcare',
      'Finance',
      'Retail',
      'Manufacturing',
      'Education',
      'Government',
      'Non-profit',
      'Entertainment',
      'Agriculture',
    ], // Maximum industry experience
    team_size: '51+',
    technical_skills: [
      'LMS Management',
      'Content Development',
      'Data Analytics',
      'Project Management',
      'Machine Learning',
      'Virtual Reality',
      'Blockchain',
      'Quantum Computing',
      'Neuroscience',
      'Behavioral Psychology',
      'Game Design',
      'Film Production',
    ], // Extensive skill list
  },
  section_2_organization: {
    organization_name: 'Global MegaCorp Conglomerate International Unlimited & Associates',
    industry_sector: 'Conglomerate',
    organization_size: '10000+',
    geographic_regions: [
      'North America',
      'South America',
      'Europe',
      'Asia Pacific',
      'Middle East',
      'Africa',
      'Antarctica',
      'International Space Station',
    ],
    compliance_requirements: [
      'GDPR',
      'CCPA',
      'HIPAA',
      'SOX',
      'PCI DSS',
      'ISO 27001',
      'ISO 9001',
      'SOC 2',
      'FERPA',
      'COPPA',
      'PIPEDA',
      'LGPD',
    ],
    data_sharing_policies: 'Highly Restricted - Top Secret Classification',
    security_clearance: 'Top Secret',
    legal_restrictions:
      'Multiple NDAs, export controls, and classified information handling requirements',
  },
  section_3_learning_gap: {
    learning_gap_description: `This is an extremely complex, multi-faceted learning challenge that spans across our entire global organization. We need to simultaneously:
    
    1) Upskill 10,000+ employees on quantum computing fundamentals while they're also learning traditional IT skills
    2) Implement a complete cultural transformation from hierarchical to flat organization while maintaining regulatory compliance
    3) Develop advanced AI/ML capabilities in non-technical departments like HR and Finance
    4) Create multilingual, multicultural training that works across 150+ countries with vastly different educational backgrounds
    5) Address significant performance gaps in sales, customer service, technical support, R&D, and manufacturing
    6) Prepare for future technologies that don't exist yet but we know are coming
    7) Handle massive generational differences from Gen Z to traditionalists
    8) Integrate learning with work in a 24/7 global operation where downtime equals millions in losses
    
    The challenge is further complicated by union requirements, government regulations, competitor espionage concerns, and the fact that half our workforce is remote while the other half requires hands-on training with expensive equipment.`,
    total_learners_range: '10000+',
    current_knowledge_level: 1, // Starting from very low
    desired_knowledge_level: 10, // Aiming for the highest
    motivation_factors: [
      'Career advancement',
      'Skill development',
      'Performance incentives',
      'Job security',
      'Personal interest',
      'Regulatory compliance',
      'Peer pressure',
      'Management directive',
      'Future-proofing',
    ],
    learning_location: ['Office', 'Remote', 'Hybrid', 'Field', 'Customer Sites', 'International'],
    devices_used: [
      'Desktop',
      'Laptop',
      'Mobile',
      'Tablet',
      'VR Headset',
      'AR Glasses',
      'Holographic Displays',
    ],
    hours_per_week: '10+ hours',
    learning_deadline: '2025-12-31',
    budget_available: {
      amount: 50000000, // $50 million budget
      currency: 'USD',
    },
  },
};

export const internationalStaticAnswersV20 = {
  section_1_role_experience: {
    current_role: 'Gerente de Formación y Desarrollo', // Spanish role title
    years_in_role: 7,
    previous_roles: 'Coordinador de Capacitación, Diseñador Instruccional',
    industry_experience: ['Tecnología', 'Manufactura', 'Servicios Financieros'],
    team_size: '11-20',
    technical_skills: [
      'Gestión de LMS',
      'Desarrollo de Contenido',
      'Análisis de Datos',
      'Six Sigma',
    ],
  },
  section_2_organization: {
    organization_name: 'Société Internationale de Formation', // French company name
    industry_sector: 'Education',
    organization_size: '1001-5000',
    geographic_regions: ['Europe', 'South America', 'Asia Pacific'],
    compliance_requirements: ['GDPR', 'ISO 9001', 'Local Labor Laws'],
    data_sharing_policies: 'Restricted by Region',
    security_clearance: 'None',
    legal_restrictions: 'EU data residency requirements',
  },
  section_3_learning_gap: {
    learning_gap_description:
      '我们需要提高员工的跨文化沟通能力和全球化思维。Our employees need better cross-cultural communication skills and global mindset to work effectively across our international offices.',
    total_learners_range: '501-1000',
    current_knowledge_level: 4,
    desired_knowledge_level: 8,
    motivation_factors: [
      'International assignments',
      'Global career opportunities',
      'Cultural enrichment',
    ],
    learning_location: ['Office', 'Remote', 'Regional Training Centers'],
    devices_used: ['Desktop', 'Laptop', 'Mobile'],
    hours_per_week: '5-10 hours',
    learning_deadline: '2025-09-30',
    budget_available: {
      amount: 250000,
      currency: 'EUR',
    },
  },
};

// Test case with missing required fields
export const incompleteStaticAnswersV20 = {
  section_1_role_experience: {
    // Missing current_role and custom_role
    years_in_role: 3,
    industry_experience: ['Technology'],
    // Missing team_size and technical_skills
  },
  section_2_organization: {
    // Missing organization_name
    industry_sector: 'Technology',
    organization_size: '51-200',
    // Missing other required fields
  },
  section_3_learning_gap: {
    // Missing learning_gap_description
    total_learners_range: '11-50',
    // Missing other fields
  },
};

// Legacy V2 format (8 sections) for backward compatibility testing
export const legacyStaticAnswersV2 = {
  role: 'Training Manager',
  organization: {
    name: 'OldCorp Industries',
    industry: 'Manufacturing',
  },
  learningGap: {
    description: 'Need safety training for factory workers',
  },
  resources: 'Limited budget and time',
  constraints: ['Union requirements', 'Shift work'],
  targetAudience: 'Factory floor workers',
  learningObjectives: ['Improve safety compliance', 'Reduce accidents'],
  assessmentType: 'Practical demonstrations',
  duration: '2 weeks',
};

// Export all fixtures as a collection
export const staticAnswerFixtures = {
  valid: validStaticAnswersV20,
  minimal: minimalStaticAnswersV20,
  edgeCase: edgeCaseStaticAnswersV20,
  international: internationalStaticAnswersV20,
  incomplete: incompleteStaticAnswersV20,
  legacy: legacyStaticAnswersV2,
};
