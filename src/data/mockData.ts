import { Project, Contractor, AlertNotification, AuditLog } from '../types';
import { calculateAIPrediction, calculateHealthScore } from '../services/aiEngine';

export const MOCK_CONTRACTORS: Contractor[] = [
  {
    id: 'CON-001',
    name: 'ABC Infrastructure Ltd',
    code: 'ABC-INFRA-HYD',
    contactPerson: 'K. Rajeshwar Rao',
    email: 'contact@abcinfra.co.in',
    phone: '+91 98490 12345',
    rating: 72,
    totalProjectsAssigned: 8,
    completedProjects: 4,
    delayedProjectsCount: 3,
    scheduleScore: 61,
    qualityScore: 84,
    budgetScore: 76,
    reliabilityScore: 67,
    overallScore: 72,
  },
  {
    id: 'CON-002',
    name: 'Telangana Heavy Civil Infra Pvt Ltd',
    code: 'THCI-GOV-09',
    contactPerson: 'S. Venkat Ramana',
    email: 'projects@thcinfra.in',
    phone: '+91 98480 87654',
    rating: 91,
    totalProjectsAssigned: 12,
    completedProjects: 10,
    delayedProjectsCount: 1,
    scheduleScore: 92,
    qualityScore: 94,
    budgetScore: 89,
    reliabilityScore: 93,
    overallScore: 91,
  },
  {
    id: 'CON-003',
    name: 'Deccan Engineering Construction Corp',
    code: 'DECC-HYD-77',
    contactPerson: 'M. Anand Kumar',
    email: 'admin@deccaneng.com',
    phone: '+91 99591 22334',
    rating: 58,
    totalProjectsAssigned: 6,
    completedProjects: 2,
    delayedProjectsCount: 3,
    scheduleScore: 48,
    qualityScore: 71,
    budgetScore: 55,
    reliabilityScore: 56,
    overallScore: 58,
  },
  {
    id: 'CON-004',
    name: 'Hyderabad Smart Utilities Ltd',
    code: 'HSUL-UTIL-02',
    contactPerson: 'P. Srinivas Reddy',
    email: 'info@hsul.org.in',
    phone: '+91 94400 99887',
    rating: 86,
    totalProjectsAssigned: 9,
    completedProjects: 7,
    delayedProjectsCount: 1,
    scheduleScore: 88,
    qualityScore: 85,
    budgetScore: 84,
    reliabilityScore: 87,
    overallScore: 86,
  },
  {
    id: 'CON-005',
    name: 'Apex Public Works Infrastructure',
    code: 'APEX-PWI-45',
    contactPerson: 'Dr. V. Chandrashekar',
    email: 'bids@apexinfra.com',
    phone: '+91 98850 55443',
    rating: 83,
    totalProjectsAssigned: 7,
    completedProjects: 5,
    delayedProjectsCount: 1,
    scheduleScore: 81,
    qualityScore: 88,
    budgetScore: 80,
    reliabilityScore: 84,
    overallScore: 83,
  }
];

// Base raw projects array
const RAW_PROJECTS: Omit<Project, 'aiPrediction' | 'healthScore'>[] = [
  // 1. Mandatory Demo Project
  {
    id: 'PRJ-GHMC-2026-001',
    name: 'Urban Road Improvement Project',
    department: 'Municipal Administration (GHMC)',
    projectType: 'Roads',
    description: 'Widening, asphalt resurfacing, storm drain integration, and smart utility ducting along the 14km Serilingampally to Kondapur arterial corridor.',
    location: 'Kondapur - Gachibowli Corridor, Zone 3',
    district: 'Hyderabad',
    latitude: 17.4600,
    longitude: 78.3689,
    managerName: 'Er. K. Suresh Kumar (Executive Engineer)',
    projectManagerId: 'pm-suresh-001',
    contractorName: 'ABC Infrastructure Ltd',
    contractorId: 'CON-001',
    startDate: '2026-01-10',
    expectedCompletionDate: '2026-11-15',
    totalBudgetCr: 18.0,
    allocatedBudgetCr: 18.0,
    spentBudgetCr: 14.04, // 78% utilized
    expectedProgressPercentage: 72,
    actualProgressPercentage: 54, // 18% variance
    status: 'At Risk',
    riskLevel: 'High',
    priority: 'Urgent',
    objectives: [
      'Reduce traffic bottleneck peak delay by 45 minutes.',
      'Construct 14km covered storm water side drains.',
      'Lay underground fiber optic utility ducts to prevent future road cutting.'
    ],
    milestones: [
      { id: 'M-101', name: 'Land Acquisition & Clearance', category: 'Planning', targetDate: '2026-02-15', actualDate: '2026-02-20', status: 'Completed', weightPercentage: 15 },
      { id: 'M-102', name: 'Utility Shifting Clearance', category: 'Approval', targetDate: '2026-03-30', actualDate: '2026-04-10', status: 'Completed', weightPercentage: 15 },
      { id: 'M-103', name: 'Asphalt & Bitumen Procurement', category: 'Procurement', targetDate: '2026-05-15', status: 'Overdue', weightPercentage: 20 },
      { id: 'M-104', name: 'Sub-grade Foundation Layer', category: 'Construction', targetDate: '2026-07-01', status: 'Overdue', weightPercentage: 25 },
      { id: 'M-105', name: 'Dense Bituminous Macadam Surface', category: 'Construction', targetDate: '2026-09-30', status: 'In Progress', weightPercentage: 15 },
      { id: 'M-106', name: 'Final Inspection & Line Marking', category: 'Inspection', targetDate: '2026-11-10', status: 'Pending', weightPercentage: 10 },
    ],
    photographs: [
      {
        id: 'IMG-101',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Baseline road excavation & utility channel layout',
        uploadedBy: 'Officer V. Ramesh (Field Inspection Officer)',
        uploadedAt: '2026-02-18 10:30 AM',
        latitude: 17.4600,
        longitude: 78.3689,
        phase: 'Before',
        stageTag: 'Excavation Phase'
      },
      {
        id: 'IMG-102',
        url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80',
        caption: 'Latest sub-base compaction near Kondapur junction',
        uploadedBy: 'Officer V. Ramesh (Field Inspection Officer)',
        uploadedAt: '2026-09-02 04:15 PM',
        latitude: 17.4602,
        longitude: 78.3695,
        phase: 'Latest',
        stageTag: 'Sub-base Compaction'
      }
    ],
    issues: [
      {
        id: 'ISS-101',
        projectId: 'PRJ-GHMC-2026-001',
        projectName: 'Urban Road Improvement Project',
        reportedBy: 'Field Officer V. Ramesh',
        reportedAt: '2026-08-25',
        type: 'Procurement delay',
        severity: 'High',
        status: 'Open',
        description: 'Bitumen supply delivery delayed by vendor for 14 calendar days due to refinery distribution clearance bottleneck.'
      },
      {
        id: 'ISS-102',
        projectId: 'PRJ-GHMC-2026-001',
        projectName: 'Urban Road Improvement Project',
        reportedBy: 'Contractor Rep K. Rajeshwar',
        reportedAt: '2026-09-01',
        type: 'Material shortage',
        severity: 'Medium',
        status: 'In Progress',
        description: 'Crushed stone aggregate supply short by 450 metric tons due to local quarry permit delay.'
      },
      {
        id: 'ISS-103',
        projectId: 'PRJ-GHMC-2026-001',
        projectName: 'Urban Road Improvement Project',
        reportedBy: 'EE K. Suresh Kumar',
        reportedAt: '2026-09-04',
        type: 'Approval delay',
        severity: 'High',
        status: 'Escalated',
        description: 'Traffic Police NOC pending for night-time asphalt laying between 11 PM and 5 AM.'
      }
    ],
    fieldUpdates: [
      {
        id: 'FLD-101',
        projectId: 'PRJ-GHMC-2026-001',
        projectName: 'Urban Road Improvement Project',
        officerName: 'Officer V. Ramesh',
        timestamp: '2026-09-08 11:20 AM',
        latitude: 17.4600,
        longitude: 78.3689,
        reportedProgressPercentage: 54,
        photoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80',
        remarks: 'Sub-base compaction ongoing. Traffic diversion in place. Aggregate shortage reported on stretch 2.',
        issueReported: true,
        issueSeverity: 'High'
      }
    ],
    documents: [
      { id: 'DOC-101', projectId: 'PRJ-GHMC-2026-001', title: 'Administrative Sanction Order (GHMC/2026/891)', category: 'Government Approval', fileType: 'PDF', fileSize: '2.4 MB', uploadedBy: 'Admin Secretary', uploadedAt: '2026-01-05', version: 'v1.0', fileUrl: '#' },
      { id: 'DOC-102', projectId: 'PRJ-GHMC-2026-001', title: 'Detailed Project Report (DPR - Road Expansion)', category: 'Project Proposal', fileType: 'PDF', fileSize: '14.8 MB', uploadedBy: 'Chief Engineer R&B', uploadedAt: '2026-01-08', version: 'v2.1', fileUrl: '#' },
      { id: 'DOC-103', projectId: 'PRJ-GHMC-2026-001', title: 'Contractor Agreement & Performance Guarantee', category: 'Contract', fileType: 'PDF', fileSize: '5.1 MB', uploadedBy: 'Legal Dept', uploadedAt: '2026-01-12', version: 'v1.0', fileUrl: '#' },
      { id: 'DOC-104', projectId: 'PRJ-GHMC-2026-001', title: 'Milestone Stage 3 Quality Inspection Certificate', category: 'Inspection Report', fileType: 'PDF', fileSize: '1.9 MB', uploadedBy: 'Field Officer V. Ramesh', uploadedAt: '2026-08-15', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-08 11:20 AM'
  },

  // 2. Government Hospital Construction
  {
    id: 'PRJ-HEALTH-2026-002',
    name: 'Gachibowli Government Super Specialty Hospital Block',
    department: 'Medical & Health',
    projectType: 'Hospitals',
    description: 'Construction of a 500-bed greenfield super specialty hospital block with modular ICUs, advanced radiology diagnostics, and solar-powered emergency energy grid.',
    location: 'Financial District, Gachibowli',
    district: 'Hyderabad',
    latitude: 17.4401,
    longitude: 78.3489,
    managerName: 'Dr. P. Radhakrishna (Project Director)',
    projectManagerId: 'pm-radhakrishna-002',
    contractorName: 'Telangana Heavy Civil Infra Pvt Ltd',
    contractorId: 'CON-002',
    startDate: '2025-08-01',
    expectedCompletionDate: '2026-12-20',
    totalBudgetCr: 145.0,
    allocatedBudgetCr: 145.0,
    spentBudgetCr: 104.4,
    expectedProgressPercentage: 78,
    actualProgressPercentage: 81,
    status: 'On Track',
    riskLevel: 'Low',
    priority: 'High',
    objectives: [
      'Deliver 500 bed capacity for western IT corridor population.',
      'Install 12 modular operation theaters with HEPA laminar airflow.',
      'Achieve GRIHA 4-Star green hospital certification.'
    ],
    milestones: [
      { id: 'M-201', name: 'Foundation Piling & Basement Concrete', category: 'Construction', targetDate: '2025-11-30', actualDate: '2025-11-25', status: 'Completed', weightPercentage: 20 },
      { id: 'M-202', name: 'Structural Superstructure (7 Floors)', category: 'Construction', targetDate: '2026-04-30', actualDate: '2026-04-22', status: 'Completed', weightPercentage: 30 },
      { id: 'M-203', name: 'Medical Gas Pipeline & MEP Ducting', category: 'Construction', targetDate: '2026-08-30', actualDate: '2026-08-28', status: 'Completed', weightPercentage: 25 },
      { id: 'M-204', name: 'Interior Modular ICU Fitouts', category: 'Construction', targetDate: '2026-10-31', status: 'In Progress', weightPercentage: 15 },
      { id: 'M-205', name: 'Final NABH Medical Equipment Accreditation', category: 'Inspection', targetDate: '2026-12-15', status: 'Pending', weightPercentage: 10 },
    ],
    photographs: [
      { id: 'IMG-201', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80', caption: '7-Storey structural frame completed', uploadedBy: 'Site Engineer M. Mohan', uploadedAt: '2026-08-28', latitude: 17.4401, longitude: 78.3489, phase: 'Latest', stageTag: 'MEP Phase' }
    ],
    issues: [],
    fieldUpdates: [
      { id: 'FLD-201', projectId: 'PRJ-HEALTH-2026-002', projectName: 'Gachibowli Hospital Block', officerName: 'Site Engineer M. Mohan', timestamp: '2026-09-07 03:30 PM', latitude: 17.4401, longitude: 78.3489, reportedProgressPercentage: 81, remarks: 'ICU interior paneling 60% complete. Oxygen manifold testing passed.' }
    ],
    documents: [
      { id: 'DOC-201', projectId: 'PRJ-HEALTH-2026-002', title: 'NABH Pre-accreditation Compliance Blueprint', category: 'Government Approval', fileType: 'PDF', fileSize: '8.2 MB', uploadedBy: 'Health Ministry', uploadedAt: '2025-08-10', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-07 03:30 PM'
  },

  // 3. Smart Drainage System
  {
    id: 'PRJ-HMWSSB-2026-003',
    name: 'Smart Underground Stormwater Drainage Phase 3',
    department: 'Water Supply & Sewerage (HMWSSB)',
    projectType: 'Drainage',
    description: 'Automated 18km high-capacity subterranean stormwater trunk pipeline with ultrasonic level sensors and flood prevention pumping stations across LB Nagar district.',
    location: 'LB Nagar - Nagole Drainage Basin',
    district: 'Hyderabad',
    latitude: 17.3500,
    longitude: 78.5500,
    managerName: 'Er. B. Venkatesham (Superintending Engineer)',
    contractorName: 'Deccan Engineering Construction Corp',
    contractorId: 'CON-003',
    startDate: '2025-10-01',
    expectedCompletionDate: '2026-09-30',
    totalBudgetCr: 42.5,
    allocatedBudgetCr: 42.5,
    spentBudgetCr: 36.125, // 85% spent
    expectedProgressPercentage: 90,
    actualProgressPercentage: 62, // 28% behind!
    status: 'Critical',
    riskLevel: 'Critical',
    priority: 'Urgent',
    objectives: [
      'Eliminate inundation in 14 low-lying residential colonies.',
      'Install 45 ultrasonic IoT flood monitoring nodes.',
      'Construct 3 automated 150 cusec storm water pumping stations.'
    ],
    milestones: [
      { id: 'M-301', name: 'Micro-Tunneling Boring Machine Setup', category: 'Procurement', targetDate: '2025-12-15', actualDate: '2026-01-20', status: 'Completed', weightPercentage: 20 },
      { id: 'M-302', name: 'Trunk Pipeline Segment Laying (12km)', category: 'Construction', targetDate: '2026-04-30', status: 'Overdue', weightPercentage: 35 },
      { id: 'M-303', name: 'Pumping Station Civil Foundation', category: 'Construction', targetDate: '2026-06-30', status: 'Overdue', weightPercentage: 25 },
      { id: 'M-304', name: 'SCADA IoT Flood Sensor Grid Integration', category: 'Construction', targetDate: '2026-08-30', status: 'In Progress', weightPercentage: 20 }
    ],
    photographs: [
      { id: 'IMG-301', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80', caption: 'Trench excavation obstructed by underground telecom cables', uploadedBy: 'Officer T. Anjaneyulu', uploadedAt: '2026-09-03', latitude: 17.3500, longitude: 78.5500, phase: 'Latest', stageTag: 'Trenching' }
    ],
    issues: [
      { id: 'ISS-301', projectId: 'PRJ-HMWSSB-2026-003', projectName: 'Stormwater Drainage Phase 3', reportedBy: 'Field Officer T. Anjaneyulu', reportedAt: '2026-08-10', type: 'Approval delay', severity: 'Critical', status: 'Escalated', description: 'NHAI highway crossing permission pending for micro-tunneling under Vijayawada National Highway.' },
      { id: 'ISS-302', projectId: 'PRJ-HMWSSB-2026-003', projectName: 'Stormwater Drainage Phase 3', reportedBy: 'DECC Engineer', reportedAt: '2026-08-28', type: 'Construction delay', severity: 'High', status: 'Open', description: 'Hard rock stratum encountered requiring specialized hydraulic rock breakers.' }
    ],
    fieldUpdates: [
      { id: 'FLD-301', projectId: 'PRJ-HMWSSB-2026-003', projectName: 'Stormwater Drainage Phase 3', officerName: 'Officer T. Anjaneyulu', timestamp: '2026-09-06 02:15 PM', latitude: 17.3500, longitude: 78.5500, reportedProgressPercentage: 62, remarks: 'Tunneling halted at km 8 due to unmapped utility line. Awaiting municipal NOC.' }
    ],
    documents: [
      { id: 'DOC-301', projectId: 'PRJ-HMWSSB-2026-003', title: 'Hydrological Flood Impact Assessment', category: 'Project Proposal', fileType: 'PDF', fileSize: '11.2 MB', uploadedBy: 'HMWSSB Planning Cell', uploadedAt: '2025-09-15', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-06 02:15 PM'
  },

  // 4. Municipal School Modernization
  {
    id: 'PRJ-EDU-2026-004',
    name: 'Koti Model Public High School Modernization',
    department: 'School Education',
    projectType: 'Schools',
    description: 'Renovation of 120-year heritage school campus, building 24 digital STEM classrooms, high-speed fiber internet infrastructure, and solar rooftop power grid.',
    location: 'Koti Heritage Campus, Zone 1',
    district: 'Hyderabad',
    latitude: 17.3850,
    longitude: 78.4867,
    managerName: 'Smt. G. Lakshmi (District Educational Officer)',
    contractorName: 'Apex Public Works Infrastructure',
    contractorId: 'CON-005',
    startDate: '2026-02-01',
    expectedCompletionDate: '2026-10-30',
    totalBudgetCr: 8.5,
    allocatedBudgetCr: 8.5,
    spentBudgetCr: 5.95,
    expectedProgressPercentage: 70,
    actualProgressPercentage: 73,
    status: 'On Track',
    riskLevel: 'Low',
    priority: 'Medium',
    objectives: [
      'Establish 24 modern digital interactive smart classrooms.',
      'Restore heritage stone facade with archaeological approval.',
      'Provide 50kW captive rooftop solar generation.'
    ],
    milestones: [
      { id: 'M-401', name: 'Structural Strengthening & Heritage Roofing', category: 'Construction', targetDate: '2026-04-15', actualDate: '2026-04-10', status: 'Completed', weightPercentage: 30 },
      { id: 'M-402', name: 'Digital Smart Boards & Networking Installation', category: 'Procurement', targetDate: '2026-07-31', actualDate: '2026-07-25', status: 'Completed', weightPercentage: 40 },
      { id: 'M-403', name: 'Robotics & Science Lab Equipment Fitout', category: 'Construction', targetDate: '2026-09-30', status: 'In Progress', weightPercentage: 20 },
      { id: 'M-404', name: 'Safety Audit & Handover Certificate', category: 'Inspection', targetDate: '2026-10-25', status: 'Pending', weightPercentage: 10 }
    ],
    photographs: [
      { id: 'IMG-401', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80', caption: 'Smart interactive classroom installation completed', uploadedBy: 'DEO Representative S. Raju', uploadedAt: '2026-09-01', latitude: 17.3850, longitude: 78.4867, phase: 'Latest', stageTag: 'Lab Setup' }
    ],
    issues: [],
    fieldUpdates: [
      { id: 'FLD-401', projectId: 'PRJ-EDU-2026-004', projectName: 'Koti Model School', officerName: 'S. Raju', timestamp: '2026-09-05 10:00 AM', latitude: 17.3850, longitude: 78.4867, reportedProgressPercentage: 73, remarks: 'Classroom wiring and interactive panels fully operational.' }
    ],
    documents: [
      { id: 'DOC-401', projectId: 'PRJ-EDU-2026-004', title: 'Heritage Conservation NOC (Archeology Dept)', category: 'Government Approval', fileType: 'PDF', fileSize: '3.1 MB', uploadedBy: 'DEO Office', uploadedAt: '2026-01-20', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-05 10:00 AM'
  },

  // 5. Outer Ring Road Flyover
  {
    id: 'PRJ-RB-2026-005',
    name: 'Outer Ring Road Junction 12 Multi-Level Flyover',
    department: 'Roads & Buildings',
    projectType: 'Bridges & Flyovers',
    description: 'Construction of a 3.2km 4-lane elevated grade separator to relieve traffic congestion at Gachibowli ORR junction with steel composite girders.',
    location: 'Gachibowli ORR Junction 12',
    district: 'Hyderabad',
    latitude: 17.4435,
    longitude: 78.3772,
    managerName: 'Er. N. Prabhakar (Chief Engineer R&B)',
    contractorName: 'Telangana Heavy Civil Infra Pvt Ltd',
    contractorId: 'CON-002',
    startDate: '2025-05-01',
    expectedCompletionDate: '2026-11-30',
    totalBudgetCr: 185.0,
    allocatedBudgetCr: 185.0,
    spentBudgetCr: 129.5,
    expectedProgressPercentage: 82,
    actualProgressPercentage: 79,
    status: 'On Track',
    riskLevel: 'Medium',
    priority: 'Urgent',
    objectives: [
      'Seamless 80 km/h transit over ORR interchange.',
      'Reduce bottleneck waiting times from 25 min to 2 min.',
      'Integrate LED dynamic traffic guidance gantries.'
    ],
    milestones: [
      { id: 'M-501', name: 'Pier Caps & Heavy Substructure Concrete', category: 'Construction', targetDate: '2025-12-31', actualDate: '2026-01-15', status: 'Completed', weightPercentage: 35 },
      { id: 'M-502', name: 'Steel Composite Girders Erection', category: 'Construction', targetDate: '2026-05-31', actualDate: '2026-06-10', status: 'Completed', weightPercentage: 30 },
      { id: 'M-503', name: 'Deck Slab Casting & Expansion Joints', category: 'Construction', targetDate: '2026-09-15', status: 'In Progress', weightPercentage: 20 },
      { id: 'M-504', name: 'Crash Barrier & Friction Carpet Asphalt', category: 'Construction', targetDate: '2026-11-15', status: 'Pending', weightPercentage: 15 }
    ],
    photographs: [
      { id: 'IMG-501', url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1200&q=80', caption: 'Steel girder launching over main carriageway', uploadedBy: 'R&B Inspector K. Mohan', uploadedAt: '2026-06-10', latitude: 17.4435, longitude: 78.3772, phase: 'Latest', stageTag: 'Girder Launching' }
    ],
    issues: [
      { id: 'ISS-501', projectId: 'PRJ-RB-2026-005', projectName: 'ORR Flyover', reportedBy: 'R&B Inspector', reportedAt: '2026-08-30', type: 'Construction delay', severity: 'Medium', status: 'In Progress', description: 'Crane availability bottleneck during peak weekend night traffic block window.' }
    ],
    fieldUpdates: [
      { id: 'FLD-501', projectId: 'PRJ-RB-2026-005', projectName: 'ORR Flyover', officerName: 'K. Mohan', timestamp: '2026-09-08 09:30 AM', latitude: 17.4435, longitude: 78.3772, reportedProgressPercentage: 79, remarks: 'Deck slab segment 14 casting finished. Curing under progress.' }
    ],
    documents: [
      { id: 'DOC-501', projectId: 'PRJ-RB-2026-005', title: 'Structural Load Test & Safety Certificate', category: 'Inspection Report', fileType: 'PDF', fileSize: '6.7 MB', uploadedBy: 'IIT Hyderabad Auditor', uploadedAt: '2026-06-15', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-08 09:30 AM'
  },

  // 6. Smart Drinking Water Pipeline
  {
    id: 'PRJ-HMWSSB-2026-006',
    name: 'Kondapur & Madhapur Drinking Water Grid Expansion',
    department: 'Water Supply & Sewerage (HMWSSB)',
    projectType: 'Water Supply',
    description: 'Laying of 32km Ductile Iron water main pipelines connected to Singur reservoir grid with smart water meters and automated pressure balancing valves.',
    location: 'Kondapur - Madhapur Sector 4',
    district: 'Hyderabad',
    latitude: 17.4550,
    longitude: 78.3810,
    managerName: 'Er. C. Hanumanth Rao (GM Engineering HMWSSB)',
    contractorName: 'Hyderabad Smart Utilities Ltd',
    contractorId: 'CON-004',
    startDate: '2026-01-15',
    expectedCompletionDate: '2026-10-15',
    totalBudgetCr: 28.0,
    allocatedBudgetCr: 28.0,
    spentBudgetCr: 21.84,
    expectedProgressPercentage: 80,
    actualProgressPercentage: 84,
    status: 'On Track',
    riskLevel: 'Low',
    priority: 'Medium',
    objectives: [
      'Supply 24x7 pressurized drinking water to 45,000 households.',
      'Reduce Non-Revenue Water (NRW) leakage by 35%.',
      'Deploy 100% AMR smart consumer metering.'
    ],
    milestones: [
      { id: 'M-601', name: 'DI Pipe Delivery & Pressure Testing', category: 'Procurement', targetDate: '2026-03-15', actualDate: '2026-03-10', status: 'Completed', weightPercentage: 25 },
      { id: 'M-602', name: 'Main Pipeline Trenching & Laying (24km)', category: 'Construction', targetDate: '2026-06-30', actualDate: '2026-06-25', status: 'Completed', weightPercentage: 40 },
      { id: 'M-603', name: 'Overhead Reservoir 5ML Hydro-testing', category: 'Construction', targetDate: '2026-09-15', status: 'In Progress', weightPercentage: 25 },
      { id: 'M-604', name: 'AMR Smart Meter Integration', category: 'Completion', targetDate: '2026-10-10', status: 'Pending', weightPercentage: 10 }
    ],
    photographs: [
      { id: 'IMG-601', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80', caption: 'DI 600mm main pipe lowering near HITEC city station', uploadedBy: 'AE Water Grid S. Mahesh', uploadedAt: '2026-06-25', latitude: 17.4550, longitude: 78.3810, phase: 'Latest', stageTag: 'Pipe Laying' }
    ],
    issues: [],
    fieldUpdates: [
      { id: 'FLD-601', projectId: 'PRJ-HMWSSB-2026-006', projectName: 'Kondapur Water Grid', officerName: 'S. Mahesh', timestamp: '2026-09-07 04:00 PM', latitude: 17.4550, longitude: 78.3810, reportedProgressPercentage: 84, remarks: 'Reservoir hydro-testing passed 4 bar pressure benchmark.' }
    ],
    documents: [
      { id: 'DOC-601', projectId: 'PRJ-HMWSSB-2026-006', title: 'Water Quality Potability Certification Report', category: 'Inspection Report', fileType: 'PDF', fileSize: '2.8 MB', uploadedBy: 'Central Water Lab', uploadedAt: '2026-07-18', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-07 04:00 PM'
  },

  // 7. Metro Rail Extension
  {
    id: 'PRJ-HMR-2026-007',
    name: 'Hyderabad Metro Phase 2 Airport Express Corridor',
    department: 'Urban Transport (HMR)',
    projectType: 'Bridges & Flyovers',
    description: '31km rapid transit elevated and underground corridor connecting Mindspace Junction to Rajiv Gandhi International Airport Shamshabad.',
    location: 'Mindspace Junction - Airport Corridor',
    district: 'Hyderabad',
    latitude: 17.3900,
    longitude: 78.4300,
    managerName: 'Er. N.V.S. Reddy (Managing Director HMR)',
    contractorName: 'Telangana Heavy Civil Infra Pvt Ltd',
    contractorId: 'CON-002',
    startDate: '2025-01-10',
    expectedCompletionDate: '2027-06-30',
    totalBudgetCr: 6250.0,
    allocatedBudgetCr: 6250.0,
    spentBudgetCr: 2812.5,
    expectedProgressPercentage: 48,
    actualProgressPercentage: 45,
    status: 'On Track',
    riskLevel: 'Medium',
    priority: 'Urgent',
    objectives: [
      'Connect city center to International Airport in 26 minutes.',
      'Deploy driverless Communications-Based Train Control (CBTC) signal system.',
      'Construct 9 ultra-modern elevated stations with solar roofs.'
    ],
    milestones: [
      { id: 'M-701', name: 'Detailed Geo-Technical Drilling Survey', category: 'Planning', targetDate: '2025-04-30', actualDate: '2025-04-20', status: 'Completed', weightPercentage: 10 },
      { id: 'M-702', name: 'Land Acquisition & Defense Land Clearance', category: 'Approval', targetDate: '2025-10-31', actualDate: '2025-11-15', status: 'Completed', weightPercentage: 15 },
      { id: 'M-703', name: 'Viaduct Pier Foundation (650 Piers)', category: 'Construction', targetDate: '2026-08-31', status: 'In Progress', weightPercentage: 35 },
      { id: 'M-704', name: 'Underground Tunnel Boring Machine Launch', category: 'Construction', targetDate: '2026-12-31', status: 'Pending', weightPercentage: 25 }
    ],
    photographs: [
      { id: 'IMG-701', url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1200&q=80', caption: 'Viaduct pier casting along Airport Expressway', uploadedBy: 'HMR Site Engg T. Srinivas', uploadedAt: '2026-08-15', latitude: 17.3900, longitude: 78.4300, phase: 'Latest', stageTag: 'Pier Construction' }
    ],
    issues: [],
    fieldUpdates: [
      { id: 'FLD-701', projectId: 'PRJ-HMR-2026-007', projectName: 'Airport Metro Corridor', officerName: 'T. Srinivas', timestamp: '2026-09-04 11:30 AM', latitude: 17.3900, longitude: 78.4300, reportedProgressPercentage: 45, remarks: 'Pier 280 casting completed. Utility diversion underway.' }
    ],
    documents: [
      { id: 'DOC-701', projectId: 'PRJ-HMR-2026-007', title: 'Union Ministry of Finance Investment Clearance', category: 'Government Approval', fileType: 'PDF', fileSize: '18.4 MB', uploadedBy: 'HMR Secretariat', uploadedAt: '2025-01-05', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-04 11:30 AM'
  },

  // 8. Smart Streetlight IoT Grid
  {
    id: 'PRJ-ELEC-2026-008',
    name: 'Cyberabad Smart LED & IoT Streetlight Control Grid',
    department: 'Electrical & Smart Infrastructure',
    projectType: 'Smart Lighting',
    description: 'Replacement of 45,000 conventional sodium lamps with auto-dimming smart LED fixtures equipped with central remote management software (CCMS).',
    location: 'Cyberabad IT Zone (Madapur - Hitec City)',
    district: 'Hyderabad',
    latitude: 17.4475,
    longitude: 78.3760,
    managerName: 'Er. A. Koteswara Rao (Superintending Engineer Elec)',
    contractorName: 'Hyderabad Smart Utilities Ltd',
    contractorId: 'CON-004',
    startDate: '2026-03-01',
    expectedCompletionDate: '2026-09-15',
    totalBudgetCr: 12.0,
    allocatedBudgetCr: 12.0,
    spentBudgetCr: 11.4, // 95% spent
    expectedProgressPercentage: 95,
    actualProgressPercentage: 98,
    status: 'Completed',
    riskLevel: 'Low',
    priority: 'Low',
    objectives: [
      'Reduce municipal electricity consumption by 52%.',
      'Deploy real-time fault detection alerts within 5 minutes.',
      'Integrate environmental AQI air quality monitoring sensors.'
    ],
    milestones: [
      { id: 'M-801', name: 'Smart LED Fixtures & Gateway Import', category: 'Procurement', targetDate: '2026-04-15', actualDate: '2026-04-10', status: 'Completed', weightPercentage: 30 },
      { id: 'M-802', name: 'Pole Installation & CCMS Gateway Setup', category: 'Construction', targetDate: '2026-07-15', actualDate: '2026-07-12', status: 'Completed', weightPercentage: 50 },
      { id: 'M-803', name: 'Central Command Center Integration & Testing', category: 'Completion', targetDate: '2026-09-01', actualDate: '2026-08-30', status: 'Completed', weightPercentage: 20 }
    ],
    photographs: [
      { id: 'IMG-801', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80', caption: 'Illuminated smart LED corridor with auto-dimming', uploadedBy: 'Elec Inspector V. Shiva', uploadedAt: '2026-08-30', latitude: 17.4475, longitude: 78.3760, phase: 'Latest', stageTag: 'Operational' }
    ],
    issues: [],
    fieldUpdates: [
      { id: 'FLD-801', projectId: 'PRJ-ELEC-2026-008', projectName: 'Cyberabad Smart Streetlights', officerName: 'V. Shiva', timestamp: '2026-08-30 08:00 PM', latitude: 17.4475, longitude: 78.3760, reportedProgressPercentage: 98, remarks: '100% gateway online. Energy saving meter verified 54% reduction.' }
    ],
    documents: [
      { id: 'DOC-801', projectId: 'PRJ-ELEC-2026-008', title: 'Energy Savings Third-Party Audit Certificate', category: 'Completion Certificate', fileType: 'PDF', fileSize: '1.4 MB', uploadedBy: 'Bureau of Energy Efficiency', uploadedAt: '2026-09-02', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-08-30 08:00 PM'
  },

  // 9. Public Eco-Park Development
  {
    id: 'PRJ-GHMC-2026-009',
    name: 'Hitec City Biodiversity Eco-Park & Urban Lake Front',
    department: 'Municipal Administration (GHMC)',
    projectType: 'Public Buildings',
    description: 'Rejuvenation of Durgam Cheruvu lakefront with 35 acres of urban forest canopy, pedestrian walkways, amphitheater, and bio-remediation floating wetlands.',
    location: 'Durgam Cheruvu Lakefront, Hitec City',
    district: 'Hyderabad',
    latitude: 17.4360,
    longitude: 78.3880,
    managerName: 'Smt. M. Anuradha (Director Urban Forestry)',
    contractorName: 'Apex Public Works Infrastructure',
    contractorId: 'CON-005',
    startDate: '2025-11-01',
    expectedCompletionDate: '2026-12-15',
    totalBudgetCr: 16.5,
    allocatedBudgetCr: 16.5,
    spentBudgetCr: 11.22,
    expectedProgressPercentage: 75,
    actualProgressPercentage: 68,
    status: 'At Risk',
    riskLevel: 'Medium',
    priority: 'Medium',
    objectives: [
      'Restore lake water dissolved oxygen level above 6.0 mg/L.',
      'Plant 15,000 native Miyawaki trees.',
      'Construct 4.2km paved jogging track.'
    ],
    milestones: [
      { id: 'M-901', name: 'Bio-remediation Aerator Installation', category: 'Procurement', targetDate: '2026-02-15', actualDate: '2026-02-28', status: 'Completed', weightPercentage: 25 },
      { id: 'M-902', name: 'Lake Perimeter Retaining Wall', category: 'Construction', targetDate: '2026-06-15', actualDate: '2026-07-05', status: 'Completed', weightPercentage: 35 },
      { id: 'M-903', name: 'Walkway Paving & Amphitheater Civil Work', category: 'Construction', targetDate: '2026-09-30', status: 'Overdue', weightPercentage: 25 },
      { id: 'M-904', name: 'Landscaping & Native Species Plantation', category: 'Completion', targetDate: '2026-12-01', status: 'Pending', weightPercentage: 15 }
    ],
    photographs: [
      { id: 'IMG-901', url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80', caption: 'Lakefront walkway paving ongoing', uploadedBy: 'Forest Officer D. Prasad', uploadedAt: '2026-08-20', latitude: 17.4360, longitude: 78.3880, phase: 'Latest', stageTag: 'Walkway Construction' }
    ],
    issues: [
      { id: 'ISS-901', projectId: 'PRJ-GHMC-2026-009', projectName: 'Hitec Eco-Park', reportedBy: 'Forest Officer D. Prasad', reportedAt: '2026-08-18', type: 'Environmental issue', severity: 'Medium', status: 'Open', description: 'Heavy monsoon runoff caused minor soil erosion along western embankment.' }
    ],
    fieldUpdates: [
      { id: 'FLD-901', projectId: 'PRJ-GHMC-2026-009', projectName: 'Hitec Eco-Park', officerName: 'D. Prasad', timestamp: '2026-09-02 01:45 PM', latitude: 17.4360, longitude: 78.3880, reportedProgressPercentage: 68, remarks: 'Retaining wall reinforced. Miyawaki tree planting week 2 scheduled.' }
    ],
    documents: [
      { id: 'DOC-901', projectId: 'PRJ-GHMC-2026-009', title: 'Environmental Clearance & Pollution Board NOC', category: 'Government Approval', fileType: 'PDF', fileSize: '4.2 MB', uploadedBy: 'PCB Telangana', uploadedAt: '2025-10-25', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-02 01:45 PM'
  },

  // 10. Waste Management Infrastructure
  {
    id: 'PRJ-GHMC-2026-010',
    name: 'Jawaharnagar Waste-to-Energy Expansion Plant (15 MW)',
    department: 'Municipal Administration (GHMC)',
    projectType: 'Waste Management',
    description: 'Expansion of municipal solid waste incineration facility converting 1,200 metric tons/day of urban waste into clean electricity.',
    location: 'Jawaharnagar Waste Complex, Medchal',
    district: 'Hyderabad',
    latitude: 17.5200,
    longitude: 78.5800,
    managerName: 'Er. R. Murali Krishna (Chief Sanitation Engineer)',
    contractorName: 'ABC Infrastructure Ltd',
    contractorId: 'CON-001',
    startDate: '2025-06-01',
    expectedCompletionDate: '2026-11-30',
    totalBudgetCr: 120.0,
    allocatedBudgetCr: 120.0,
    spentBudgetCr: 96.0,
    expectedProgressPercentage: 85,
    actualProgressPercentage: 74,
    status: 'Delayed',
    riskLevel: 'High',
    priority: 'High',
    objectives: [
      'Process 1,200 TPD solid municipal waste.',
      'Generate 15MW base load power for grid synchronization.',
      'Reduce landfill footprint by 85%.'
    ],
    milestones: [
      { id: 'M-1001', name: 'Boiler & Turbine Import Clearance', category: 'Procurement', targetDate: '2025-12-31', actualDate: '2026-02-10', status: 'Completed', weightPercentage: 30 },
      { id: 'M-1002', name: 'Incinerator Building Civil Superstructure', category: 'Construction', targetDate: '2026-05-31', actualDate: '2026-06-20', status: 'Completed', weightPercentage: 35 },
      { id: 'M-1003', name: 'Flue Gas Cleaning System Fitout', category: 'Construction', targetDate: '2026-08-31', status: 'Overdue', weightPercentage: 20 },
      { id: 'M-1004', name: 'Grid Synchronization & Commercial Trial', category: 'Inspection', targetDate: '2026-11-15', status: 'Pending', weightPercentage: 15 }
    ],
    photographs: [
      { id: 'IMG-1001', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80', caption: 'Incinerator hall heavy turbine installation', uploadedBy: 'Engineer P. Satish', uploadedAt: '2026-06-20', latitude: 17.5200, longitude: 78.5800, phase: 'Latest', stageTag: 'Turbine Installation' }
    ],
    issues: [
      { id: 'ISS-1001', projectId: 'PRJ-GHMC-2026-010', projectName: 'Jawaharnagar Waste-to-Energy', reportedBy: 'Sanitation Dept', reportedAt: '2026-08-22', type: 'Contractor issue', severity: 'High', status: 'Open', description: 'Sub-contractor delay in delivering custom stainless steel flue stack ducting.' }
    ],
    fieldUpdates: [
      { id: 'FLD-1001', projectId: 'PRJ-GHMC-2026-010', projectName: 'Jawaharnagar Waste-to-Energy', officerName: 'P. Satish', timestamp: '2026-09-03 03:00 PM', latitude: 17.5200, longitude: 78.5800, reportedProgressPercentage: 74, remarks: 'Boiler hydraulic test successful. Ducting installation awaiting supplier.' }
    ],
    documents: [
      { id: 'DOC-1001', projectId: 'PRJ-GHMC-2026-010', title: 'Central Pollution Control Board Emission Permit', category: 'Government Approval', fileType: 'PDF', fileSize: '5.6 MB', uploadedBy: 'CPCB Telangana', uploadedAt: '2025-06-15', version: 'v1.0', fileUrl: '#' }
    ],
    lastUpdated: '2026-09-03 03:00 PM'
  }
];

// Dynamically attach computed AI predictions and Health Scores to all mock projects
export const MOCK_PROJECTS: Project[] = RAW_PROJECTS.map(proj => {
  const aiPrediction = calculateAIPrediction(proj);
  const healthScore = calculateHealthScore({ ...proj, aiPrediction });

  return {
    ...proj,
    aiPrediction,
    healthScore
  };
});

export const MOCK_ALERTS: AlertNotification[] = [
  // 1. ADMIN ALERTS (Organization-Wide Issues)
  {
    id: 'ALT-ADMIN-001',
    projectId: 'PRJ-HMWSSB-2026-003',
    projectName: 'Smart Underground Stormwater Drainage Phase 3',
    title: '🔴 CRITICAL PROJECT RISK — Multi-Project Alert',
    message: 'Stormwater Drainage Phase 3 is at CRITICAL risk with 91% delay probability (+27 Days). Major budget variance: 85% spent vs 62% physical progress.',
    reason: 'Severe milestone bottleneck & NHAI crossing clearance pending.',
    requiredAction: 'Administrator attention required for inter-departmental NOC clearance.',
    targetRole: 'Administrator',
    severity: 'Critical',
    alertSeverityLevel: 'CRITICAL',
    timestamp: '2026-09-08 11:30 AM',
    isRead: false,
    category: 'AI Delay'
  },
  {
    id: 'ALT-ADMIN-002',
    projectId: 'PRJ-GHMC-2026-010',
    projectName: 'Jawaharnagar Waste-to-Energy Plant',
    title: '🔴 CONTRACTOR PERFORMANCE ISSUE',
    message: 'ABC Infrastructure Ltd overall reliability score dropped below critical threshold (61/100). Flue gas stack procurement overdue by 20 days.',
    reason: 'Contractor supply chain default affecting high-value municipal asset delivery.',
    requiredAction: 'Admin executive review & contractor show-cause notice issuance.',
    targetRole: 'Administrator',
    severity: 'Critical',
    alertSeverityLevel: 'CRITICAL',
    timestamp: '2026-09-07 04:12 PM',
    isRead: false,
    category: 'Contractor Alert'
  },

  // 2. PROJECT MANAGER ALERTS (For Assigned PM pm-suresh-001)
  {
    id: 'ALT-PM-001',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    projectManagerId: 'pm-suresh-001',
    inspectionId: 'INSP-DEMO-001',
    title: '🔔 NEW FIELD INSPECTION SUBMITTED',
    message: 'Field Officer V. Ramesh submitted site photo inspection for Serilingampally-Kondapur corridor. Risk: HIGH | Delay Probability: 78%.',
    reason: 'Field Officer reported sub-grade aggregate shortage and traffic NOC clearance delay.',
    requiredAction: 'Review Inspection & issue contractor resource allocation order.',
    targetRole: 'Project Manager',
    severity: 'Warning',
    alertSeverityLevel: 'HIGH',
    timestamp: '2026-09-08 10:45 AM',
    isRead: false,
    category: 'AI Delay'
  },
  {
    id: 'ALT-PM-002',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    projectManagerId: 'pm-suresh-001',
    title: '🔴 HIGH PROJECT RISK & PROGRESS GAP',
    message: 'Expected Progress: 72% | Actual Progress: 54%. Delay Probability: 78% (Predicted Delay: 18 Days).',
    reason: 'Dense Bituminous Macadam layer & bitumen procurement overdue.',
    requiredAction: 'Project Manager attention required. Schedule site coordination meeting.',
    targetRole: 'Project Manager',
    severity: 'Warning',
    alertSeverityLevel: 'HIGH',
    timestamp: '2026-09-07 02:20 PM',
    isRead: false,
    category: 'AI Delay'
  },
  {
    id: 'ALT-PM-003',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    projectManagerId: 'pm-suresh-001',
    title: '🟠 SAFETY ISSUE REPORTED BY FIELD OFFICER',
    message: 'Inadequate perimeter hazard barricading observed near active public traffic lane on Stretch 2.',
    reason: 'Safety compliance risk identified during AI visual inspection analysis.',
    requiredAction: 'Issue immediate site safety compliance order to contractor.',
    targetRole: 'Project Manager',
    severity: 'Warning',
    alertSeverityLevel: 'HIGH',
    timestamp: '2026-09-06 09:15 AM',
    isRead: true,
    category: 'Issue Escalated'
  },

  // 3. FIELD OFFICER ALERTS
  {
    id: 'ALT-FO-001',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    title: '📋 INSPECTION TASK ASSIGNED',
    message: 'Project Manager Er. K. Suresh Kumar requested a follow-up site inspection for sub-base compaction layer.',
    reason: 'Verify stone aggregate compaction density & capture updated GPS photo evidence.',
    requiredAction: 'Complete site inspection & upload construction photo.',
    targetRole: 'Field Officer',
    severity: 'Info',
    alertSeverityLevel: 'MEDIUM',
    timestamp: '2026-09-08 08:30 AM',
    isRead: false,
    category: 'Field Update Overdue'
  },
  {
    id: 'ALT-FO-002',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    title: '📸 ADDITIONAL SITE EVIDENCE REQUIRED',
    message: 'Project Manager requested additional close-up photos of drainage channel culvert reinforcement.',
    reason: 'Verify rebar spacing prior to concrete pouring.',
    requiredAction: 'Visit site & upload detailed photo evidence.',
    targetRole: 'Field Officer',
    severity: 'Info',
    alertSeverityLevel: 'LOW',
    timestamp: '2026-09-07 11:00 AM',
    isRead: true,
    category: 'Field Update Overdue'
  },

  // 4. CONTRACTOR ALERTS
  {
    id: 'ALT-CON-001',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    title: '⚠️ ACTION REQUIRED — MILESTONE OVERDUE',
    message: 'Milestone: Asphalt & Bitumen Procurement is overdue by 14 calendar days.',
    reason: 'Material supply delay impacting overall project timeline.',
    requiredAction: 'Submit progress update & revised procurement plan.',
    targetRole: 'Contractor',
    severity: 'Warning',
    alertSeverityLevel: 'HIGH',
    timestamp: '2026-09-08 09:00 AM',
    isRead: false,
    category: 'Deadline Near'
  },
  {
    id: 'ALT-CON-002',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    title: '🚧 CORRECTIVE ACTION REQUESTED BY PM',
    message: 'Project Manager requested immediate installation of safety barricading along Kondapur junction.',
    reason: 'Field inspection identified public hazard near active excavation zone.',
    requiredAction: 'Deploy safety barriers & submit compliance photo update.',
    targetRole: 'Contractor',
    severity: 'Warning',
    alertSeverityLevel: 'HIGH',
    timestamp: '2026-09-06 04:30 PM',
    isRead: true,
    category: 'Contractor Alert'
  }
];


export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-501',
    user: 'Officer V. Ramesh',
    role: 'Field Officer',
    action: 'Uploaded Site Photograph & Recorded GPS Progress',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    timestamp: '2026-09-08 11:20 AM',
    ipAddress: '103.24.18.92 (Field Mobile Handset)',
    device: 'Android Mobile - CityTrack Field App v2.4',
    details: 'Recorded physical progress at 54%. Captured photo at lat 17.4600, lon 78.3689. Reported aggregate supply bottleneck.'
  },
  {
    id: 'LOG-502',
    user: 'Er. K. Suresh Kumar',
    role: 'Project Manager',
    action: 'Escalated Procurement Issue to Department Head',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    timestamp: '2026-09-08 10:30 AM',
    ipAddress: '14.139.69.2',
    device: 'Windows Desktop - Chrome 128',
    details: 'Changed status of Bitumen Supply Issue #ISS-101 to High Severity Escalated.'
  },
  {
    id: 'LOG-503',
    user: 'Administrator Admin Secretary',
    role: 'Administrator',
    action: 'Triggered AI Risk Re-evaluation',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    timestamp: '2026-09-08 09:15 AM',
    ipAddress: '10.0.4.15',
    device: 'macOS Monterey - Safari 17.4',
    details: 'Re-calculated delay prediction model. Generated Executive Action Plan.'
  },
  {
    id: 'LOG-504',
    user: 'K. Rajeshwar Rao',
    role: 'Contractor',
    action: 'Submitted Milestone Completion Request',
    projectId: 'PRJ-GHMC-2026-001',
    projectName: 'Urban Road Improvement Project',
    timestamp: '2026-09-07 05:40 PM',
    ipAddress: '183.82.10.44',
    device: 'Windows 11 - Edge 127',
    details: 'Submitted billing invoice #INV-4412 for Sub-grade Foundation stage clearance.'
  }
];
