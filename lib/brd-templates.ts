export interface BRDTemplate {
  id: string
  name: string
  description: string
  icon: string
  structure: string[]
}

export const BRD_TEMPLATES: BRDTemplate[] = [
  {
    id: 'convergenc3',
    name: 'Convergenc3 Enterprise',
    description: 'Full enterprise-grade BRD with governance, RACI, and detailed user stories',
    icon: '🏢',
    structure: [
      'Executive Summary',
      'Governance: Stakeholder List',
      'Revision History',
      'Supporting Documents',
      'Glossary',
      'Business Problem/Opportunity',
      'Objectives & Success Criteria',
      'Scope',
      'Assumptions & Constraints',
      'Stakeholders & Roles (RACI Matrix)',
      'Current State/As-Is',
      'Future State/To-Be',
      'High Level Requirements',
      'Detailed Business Requirements',
      'Appendices'
    ]
  },
  {
    id: 'agile',
    name: 'Agile Product',
    description: 'Lightweight BRD focused on user stories, epics, and sprint planning',
    icon: '🚀',
    structure: [
      'Product Vision',
      'Target Users & Personas',
      'Problem Statement',
      'Product Goals',
      'Epics & User Stories',
      'Acceptance Criteria',
      'Sprint Planning',
      'Success Metrics'
    ]
  },
  {
    id: 'it-technical',
    name: 'IT/Technical',
    description: 'Technical BRD with architecture, integration, and system requirements',
    icon: '⚙️',
    structure: [
      'Executive Summary',
      'System Overview',
      'Technical Architecture',
      'Functional Requirements',
      'Non-Functional Requirements',
      'Integration Requirements',
      'Security & Compliance',
      'Performance Requirements',
      'Technical Constraints'
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate Standard',
    description: 'Traditional corporate BRD with formal structure and sign-offs',
    icon: '📋',
    structure: [
      'Executive Summary',
      'Business Background',
      'Problem Statement',
      'Business Objectives',
      'Scope & Boundaries',
      'Stakeholder Analysis',
      'Requirements Specification',
      'Risk Assessment',
      'Timeline & Milestones',
      'Approval & Sign-off'
    ]
  }
]
