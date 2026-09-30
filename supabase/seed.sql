-- ====================================================================
-- CityTrack AI — Supabase Database Seed Data
-- 25+ Realistic Infrastructure Projects across Hyderabad & Telangana
-- Includes the Primary Hackathon Demo Project: Urban Road Improvement Project
-- ====================================================================

-- SAFEGUARD: Ensure all expected columns exist on existing tables before seeding
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_budget NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS allocated_budget NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS spent_budget NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS allocated_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS spent_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS delay_probability NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS predicted_delay_days INTEGER DEFAULT 0;

ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS issue_reported BOOLEAN DEFAULT false;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS health_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS schedule_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS budget_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS contractor_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS procurement_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS quality_risk TEXT;

ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS alert_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'Payment';
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description TEXT;

-- 1. Insert Demo Contractors
INSERT INTO public.contractors (id, code, name, company_name, email, phone, address, performance_score, schedule_score, quality_score, budget_score, reliability_score)
VALUES 
    ('c0010000-0000-0000-0000-000000000001', 'CON-001', 'ABC Infrastructure Ltd', 'ABC Infra Projects India Ltd', 'contact@abcinfra.co.in', '+91 98490 12345', 'Road No. 36, Jubilee Hills, Hyderabad', 72.0, 61.0, 84.0, 76.0, 67.0),
    ('c0020000-0000-0000-0000-000000000002', 'CON-002', 'Telangana Heavy Civil Infra Pvt Ltd', 'THCI State Works Group', 'projects@thcinfra.in', '+91 98480 87654', 'HITEC City Phase 2, Hyderabad', 91.0, 92.0, 94.0, 89.0, 93.0),
    ('c0030000-0000-0000-0000-000000000003', 'CON-003', 'Deccan Engineering Construction Corp', 'Deccan Civil Works Consortium', 'admin@deccaneng.com', '+91 99591 22334', 'Basheerbagh, Hyderabad', 58.0, 48.0, 71.0, 55.0, 56.0),
    ('c0040000-0000-0000-0000-000000000004', 'CON-004', 'Hyderabad Smart Utilities Ltd', 'HSUL Infra Group', 'info@hsul.org.in', '+91 94400 99887', 'Begumpet Airport Road, Hyderabad', 86.0, 88.0, 85.0, 84.0, 87.0),
    ('c0050000-0000-0000-0000-000000000005', 'CON-005', 'Apex Public Works Infrastructure', 'Apex PWI Engineering', 'bids@apexinfra.com', '+91 98850 55443', 'Banjara Hills Road No. 12, Hyderabad', 83.0, 81.0, 88.0, 80.0, 84.0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    performance_score = EXCLUDED.performance_score;

-- 2. Insert Core Infrastructure Projects
INSERT INTO public.projects (
    id, project_id, name, description, project_type, department, location, district, 
    latitude, longitude, contractor_id, contractor_name, start_date, expected_completion_date, 
    total_budget, allocated_budget, spent_budget, progress, expected_progress, 
    priority, status, risk_level, health_score, delay_probability, predicted_delay_days
)
VALUES
    -- DEMO PROJECT 1 (PRIMARY HACKATHON DEMO SCENARIO)
    (
        'a0010000-0000-0000-0000-000000000001',
        'PRJ-GHMC-2026-001',
        'Urban Road Improvement Project',
        'Widening, asphalt resurfacing, storm drain integration, and smart utility ducting along the 14km Serilingampally to Kondapur arterial corridor.',
        'Roads',
        'Municipal Administration (GHMC)',
        'Kondapur - Gachibowli Corridor, Zone 3',
        'Hyderabad',
        17.4600,
        78.3689,
        'CON-001',
        'ABC Infrastructure Ltd',
        '2026-01-10',
        '2026-11-15',
        18.00,
        18.00,
        14.04,
        54.00,
        72.00,
        'Critical',
        'At Risk',
        'High',
        '64'::jsonb,
        78.00,
        18
    ),
    -- PROJECT 2: Super Specialty Hospital
    (
        'a0020000-0000-0000-0000-000000000002',
        'PRJ-HEALTH-2026-002',
        'Gachibowli Government Super Specialty Hospital Block',
        'Construction of a 500-bed greenfield super specialty hospital block with modular ICUs, advanced radiology diagnostics, and solar-powered emergency energy grid.',
        'Hospitals',
        'Medical & Health',
        'Financial District, Gachibowli',
        'Hyderabad',
        17.4401,
        78.3489,
        'CON-002',
        'Telangana Heavy Civil Infra Pvt Ltd',
        '2025-08-01',
        '2026-12-20',
        145.00,
        145.00,
        104.40,
        81.00,
        78.00,
        'High',
        'On Track',
        'Low',
        88.00,
        12.00,
        0
    ),
    -- PROJECT 3: Underground Stormwater Drainage
    (
        'a0030000-0000-0000-0000-000000000003',
        'PRJ-HMWSSB-2026-003',
        'Smart Underground Stormwater Drainage Phase 3',
        'Automated 18km high-capacity subterranean stormwater trunk pipeline with ultrasonic level sensors and flood prevention pumping stations across LB Nagar district.',
        'Drainage',
        'Water Supply & Sewerage (HMWSSB)',
        'LB Nagar - Nagole Drainage Basin',
        'Hyderabad',
        17.3500,
        78.5500,
        'CON-003',
        'Deccan Engineering Construction Corp',
        '2025-10-01',
        '2026-09-30',
        42.50,
        42.50,
        36.13,
        62.00,
        90.00,
        'Critical',
        'Critical',
        'Critical',
        42.00,
        92.00,
        45
    ),
    -- PROJECT 4: Public School Modernization
    (
        'a0040000-0000-0000-0000-000000000004',
        'PRJ-EDU-2026-004',
        'Koti Model Public High School Modernization',
        'Renovation of 120-year heritage school campus, building 24 digital STEM classrooms, high-speed fiber internet infrastructure, and solar rooftop power grid.',
        'Schools',
        'School Education',
        'Koti Heritage Campus, Zone 1',
        'Hyderabad',
        17.3850,
        78.4867,
        'CON-005',
        'Apex Public Works Infrastructure',
        '2026-02-01',
        '2026-10-30',
        8.50,
        8.50,
        5.95,
        73.00,
        70.00,
        'Medium',
        'On Track',
        'Low',
        86.00,
        15.00,
        0
    ),
    -- PROJECT 5: Drinking Water Supply Phase 4
    (
        'a0050000-0000-0000-0000-000000000005',
        'PRJ-WATER-2026-005',
        'Krishna Drinking Water Supply Phase 4',
        'Laying 32km 2200mm MS pipeline from Sahebnagar to Ring Main 2 with automated SCADA pressure regulation pumping stations.',
        'Water Supply',
        'Water Supply & Sewerage (HMWSSB)',
        'Sahebnagar - Hayathnagar Sector',
        'Hyderabad',
        17.3200,
        78.6000,
        'CON-002',
        'Telangana Heavy Civil Infra Pvt Ltd',
        '2025-06-15',
        '2026-11-30',
        82.00,
        82.00,
        61.50,
        68.00,
        75.00,
        'High',
        'Delayed',
        'Medium',
        71.00,
        48.00,
        14
    ),
    -- PROJECT 6: Durgam Cheruvu Eco-Park
    (
        'a0060000-0000-0000-0000-000000000006',
        'PRJ-PARK-2026-006',
        'Durgam Cheruvu Lakefront Eco-Park Development',
        'Construction of 3.8km elevated cycling track, wetland bio-remediation floating islands, and amphitheater public amenities.',
        'Public Buildings',
        'Municipal Administration (GHMC)',
        'Madhapur, Knowledge City',
        'Hyderabad',
        17.4350,
        78.3850,
        'CON-004',
        'Hyderabad Smart Utilities Ltd',
        '2026-01-05',
        '2026-08-31',
        14.20,
        14.20,
        13.50,
        96.00,
        98.00,
        'Low',
        'Completed',
        'Low',
        94.00,
        5.00,
        0
    ),
    -- PROJECT 7: Elevated Flyover Corridor
    (
        'a0070000-0000-0000-0000-000000000007',
        'PRJ-FLY-2026-007',
        'Cyber Towers - Kondapur Elevated Flyover Corridor',
        'Four-lane bidirectional 2.8km elevated flyover with steel composite girders spanning across congested junction points.',
        'Bridges & Flyovers',
        'Roads & Buildings',
        'Cyber Gateway Junction, Hitec City',
        'Hyderabad',
        17.4504,
        78.3808,
        'CON-001',
        'ABC Infrastructure Ltd',
        '2025-04-10',
        '2026-12-15',
        68.00,
        68.00,
        47.60,
        58.00,
        74.00,
        'High',
        'At Risk',
        'High',
        61.00,
        68.00,
        22
    ),
    -- PROJECT 8: Airport Express Metro Segment
    (
        'a0080000-0000-0000-0000-000000000008',
        'PRJ-METRO-2026-008',
        'Shamshabad Airport Express Metro Line Segment 1',
        'Construction of 11.2km viaduct piers and elevated track bed from Gachibowli Bio-Diversity Park to Outer Ring Road.',
        'Bridges & Flyovers',
        'Urban Transport (HMR)',
        'Bio-Diversity Junction to ORR Exit 18',
        'Hyderabad',
        17.4200,
        78.3750,
        'CON-002',
        'Telangana Heavy Civil Infra Pvt Ltd',
        '2025-03-01',
        '2027-03-31',
        240.00,
        240.00,
        120.00,
        49.00,
        48.00,
        'High',
        'On Track',
        'Low',
        87.00,
        18.00,
        0
    ),
    -- PROJECT 9: Heritage Pedestrianization
    (
        'a0090000-0000-0000-0000-000000000009',
        'PRJ-CHAR-2026-009',
        'Charminar Heritage Pedestrianization Phase 2',
        'Cobblestone streetscaping, electrical duct undergrounding, and heritage illumination across historical market streets.',
        'Roads',
        'Municipal Administration (GHMC)',
        'Old City Historic Precinct',
        'Hyderabad',
        17.3616,
        78.4747,
        'CON-005',
        'Apex Public Works Infrastructure',
        '2025-11-20',
        '2026-10-15',
        12.00,
        12.00,
        9.60,
        76.00,
        80.00,
        'Medium',
        'On Track',
        'Low',
        82.00,
        20.00,
        0
    ),
    -- PROJECT 10: Smart LED Lighting Grid
    (
        'a0100000-0000-0000-0000-000000000010',
        'PRJ-SMART-2026-010',
        'Hyderabad Smart LED Streetlighting Grid',
        'Deployment of 45,000 IoT-connected dimmable LED luminaires with centralized CCMS automated energy management.',
        'Smart Lighting',
        'Electrical & Smart Infrastructure',
        'Secunderabad - Begumpet Circle',
        'Hyderabad',
        17.4400,
        78.4900,
        'CON-004',
        'Hyderabad Smart Utilities Ltd',
        '2026-01-15',
        '2026-09-15',
        16.80,
        16.80,
        14.28,
        85.00,
        88.00,
        'Low',
        'On Track',
        'Low',
        90.00,
        10.00,
        0
    ),
    -- PROJECT 11: Railway Modernization Hub
    (
        'a0110000-0000-0000-0000-000000000011',
        'PRJ-RAIL-2026-011',
        'Secunderabad Multi-Modal Transit Hub Access Roads',
        'Widening station approach roads, elevated feeder ramps, and dedicated multi-level auto/taxi staging terminals.',
        'Roads',
        'Municipal Administration (GHMC)',
        'Secunderabad Railway Terminal Zone',
        'Hyderabad',
        17.4340,
        78.5010,
        'CON-003',
        'Deccan Engineering Construction Corp',
        '2025-09-01',
        '2026-10-31',
        22.50,
        22.50,
        19.12,
        64.00,
        85.00,
        'High',
        'Delayed',
        'High',
        59.00,
        72.00,
        30
    ),
    -- PROJECT 12: Uppal Skywalk Junction Decongestion
    (
        'a0120000-0000-0000-0000-000000000012',
        'PRJ-SKY-2026-012',
        'Uppal Skywalk Junction Decongestion & Drainage',
        'Underground box-drain diversion channel and pedestrian feeder escalators linking metro viaduct to regional bus stops.',
        'Drainage',
        'Water Supply & Sewerage (HMWSSB)',
        'Uppal Main Circle, Eastern Gateway',
        'Hyderabad',
        17.4020,
        78.5600,
        'CON-004',
        'Hyderabad Smart Utilities Ltd',
        '2026-02-10',
        '2026-11-20',
        19.40,
        19.40,
        11.64,
        60.00,
        62.00,
        'Medium',
        'On Track',
        'Low',
        81.00,
        22.00,
        0
    ),
    -- PROJECT 13: Begumpet Smart Water Treatment Plant
    (
        'a0130000-0000-0000-0000-000000000013',
        'PRJ-WTP-2026-013',
        'Begumpet Smart Water Treatment Plant Upgrade',
        'Modernization of 150 MLD clariflocculator units, ozonation systems, and real-time spectrophotometric water purity sensors.',
        'Water Supply',
        'Water Supply & Sewerage (HMWSSB)',
        'Begumpet Water Works Station',
        'Hyderabad',
        17.4500,
        78.4700,
        'CON-002',
        'Telangana Heavy Civil Infra Pvt Ltd',
        '2025-07-01',
        '2026-08-30',
        38.00,
        38.00,
        36.10,
        94.00,
        96.00,
        'Medium',
        'On Track',
        'Low',
        93.00,
        8.00,
        0
    ),
    -- PROJECT 14: Integrated Waste-to-Energy Plant
    (
        'a0140000-0000-0000-0000-000000000014',
        'PRJ-WASTE-2026-014',
        'Medchal Waste-to-Energy Processing Facility',
        'Construction of 20 MW RDF municipal solid waste incinerator with flue-gas desulfurization scrubbers and ash recovery plant.',
        'Waste Management',
        'Municipal Administration (GHMC)',
        'Medchal Industrial Cluster',
        'Hyderabad',
        17.6300,
        78.4800,
        'CON-001',
        'ABC Infrastructure Ltd',
        '2025-05-15',
        '2027-02-28',
        112.00,
        112.00,
        78.40,
        52.00,
        65.00,
        'High',
        'At Risk',
        'High',
        62.00,
        64.00,
        28
    ),
    -- PROJECT 15: Genome Valley R&D Innovation Hub
    (
        'a0150000-0000-0000-0000-000000000015',
        'PRJ-BIO-2026-015',
        'Bio-Pharma R&D Innovation Hub Genome Valley',
        'BSL-3 bio-containment laboratories, cold-chain logistics storage, and high-performance computational server infrastructure.',
        'Public Buildings',
        'Municipal Administration (GHMC)',
        'Genome Valley Cluster, Shameerpet',
        'Hyderabad',
        17.6500,
        78.6000,
        'CON-005',
        'Apex Public Works Infrastructure',
        '2025-10-10',
        '2026-12-31',
        86.00,
        86.00,
        60.20,
        70.00,
        72.00,
        'Medium',
        'On Track',
        'Low',
        85.00,
        16.00,
        0
    ),
    -- PROJECT 16: Multi-Modal Logistics Park
    (
        'a0160000-0000-0000-0000-000000000016',
        'PRJ-LOG-2026-016',
        'Outer Ring Road Multi-Modal Logistics Hub',
        'Paved heavy truck freight parking, automated customs clearance bays, and 450,000 sq ft temperature-controlled warehouses.',
        'Public Buildings',
        'Roads & Buildings',
        'ORR Pedda Amberpet Junction',
        'Hyderabad',
        17.3200,
        78.6800,
        'CON-002',
        'Telangana Heavy Civil Infra Pvt Ltd',
        '2025-08-20',
        '2026-11-15',
        54.00,
        54.00,
        43.20,
        77.00,
        80.00,
        'Medium',
        'On Track',
        'Low',
        84.00,
        14.00,
        0
    ),
    -- PROJECT 17: Moosi Riverfront Embankment
    (
        'a0170000-0000-0000-0000-000000000017',
        'PRJ-RIVER-2026-017',
        'Moosi River Rejuvenation & Retaining Wall Phase 1',
        'Reinforced concrete flood protection retaining walls along 6km river course with interceptor sewer pipelines.',
        'Drainage',
        'Water Supply & Sewerage (HMWSSB)',
        'Afzalgunj - Chaderghat Embankment',
        'Hyderabad',
        17.3750,
        78.4800,
        'CON-003',
        'Deccan Engineering Construction Corp',
        '2025-09-15',
        '2026-10-31',
        34.00,
        34.00,
        28.90,
        48.00,
        76.00,
        'Critical',
        'Critical',
        'Critical',
        46.00,
        88.00,
        38
    ),
    -- PROJECT 18: Underground Electrical Cabling
    (
        'a0180000-0000-0000-0000-000000000018',
        'PRJ-ELEC-2026-018',
        'Jubilee Hills Substation Underground Power Cabling',
        'Conversion of 33kV overhead high-tension lines into subterranean XLPE insulated ducts across prime avenues.',
        'Smart Lighting',
        'Electrical & Smart Infrastructure',
        'Jubilee Hills Checkpost - Road 45',
        'Hyderabad',
        17.4320,
        78.4070,
        'CON-004',
        'Hyderabad Smart Utilities Ltd',
        '2026-01-10',
        '2026-09-30',
        21.00,
        21.00,
        16.80,
        80.00,
        82.00,
        'Low',
        'On Track',
        'Low',
        89.00,
        12.00,
        0
    ),
    -- PROJECT 19: Transit Terminal Modernization
    (
        'a0190000-0000-0000-0000-000000000019',
        'PRJ-TERM-2026-019',
        'Mehdipatnam Skywalk & Bus Transit Terminal',
        'Integrated pedestrian concourse bridge over heavy arterial roadway connecting RTC military depot bus bays to skywalk.',
        'Bridges & Flyovers',
        'Urban Transport (HMR)',
        'Mehdipatnam Crossroads',
        'Hyderabad',
        17.3916,
        78.4410,
        'CON-001',
        'ABC Infrastructure Ltd',
        '2025-11-01',
        '2026-11-30',
        31.00,
        31.00,
        24.80,
        65.00,
        78.00,
        'High',
        'Delayed',
        'High',
        63.00,
        65.00,
        24
    ),
    -- PROJECT 20: Financial District Fire Station
    (
        'a0200000-0000-0000-0000-000000000020',
        'PRJ-FIRE-2026-020',
        'Nanakramguda Fire Station & High-Rise Rescue Command',
        'Specialized 6-bay emergency services station equipped with 90-meter hydraulic ladder equipment bays and training tower.',
        'Public Buildings',
        'Municipal Administration (GHMC)',
        'Nanakramguda Financial District',
        'Hyderabad',
        17.4180,
        78.3540,
        'CON-005',
        'Apex Public Works Infrastructure',
        '2026-02-15',
        '2026-10-31',
        15.50,
        15.50,
        9.30,
        62.00,
        64.00,
        'Low',
        'On Track',
        'Low',
        86.00,
        14.00,
        0
    ),
    -- PROJECT 21: Kukatpally Smart Grade Separator
    (
        'a0210000-0000-0000-0000-000000000021',
        'PRJ-GRADE-2026-021',
        'Kukatpally Smart Grade Separator & Underpass',
        'Bidirectional underpass with stormwater automated sump pumps resolving chronic traffic congestion on Mumbai highway.',
        'Roads',
        'Municipal Administration (GHMC)',
        'Kukatpally Y Junction',
        'Hyderabad',
        17.4947,
        78.3996,
        'CON-002',
        'Telangana Heavy Civil Infra Pvt Ltd',
        '2025-06-01',
        '2026-09-15',
        27.00,
        27.00,
        24.30,
        92.00,
        95.00,
        'Medium',
        'On Track',
        'Low',
        91.00,
        9.00,
        0
    ),
    -- PROJECT 22: Primary Health Center Upgrade
    (
        'a0220000-0000-0000-0000-000000000022',
        'PRJ-PHC-2026-022',
        'Chandrayangutta Public Health Center Upgrade',
        'Modern 60-bed maternal & child healthcare hospital with round-the-clock neonatal care center and diagnostic lab.',
        'Hospitals',
        'Medical & Health',
        'Chandrayangutta Main Road',
        'Hyderabad',
        17.3250,
        78.4750,
        'CON-005',
        'Apex Public Works Infrastructure',
        '2026-01-20',
        '2026-08-31',
        6.80,
        6.80,
        6.46,
        95.00,
        98.00,
        'Low',
        'Completed',
        'Low',
        96.00,
        4.00,
        0
    ),
    -- PROJECT 23: Multi-Level Automated Parking
    (
        'a0230000-0000-0000-0000-000000000023',
        'PRJ-PARK-2026-023',
        'Ameerpet Automated Multi-Level Car Parking Complex',
        'Rotary robotic car parking facility accommodating 350 vehicles with FASTag automatic license plate recognition.',
        'Public Buildings',
        'Municipal Administration (GHMC)',
        'Ameerpet Metro Station Junction',
        'Hyderabad',
        17.4375,
        78.4483,
        'CON-004',
        'Hyderabad Smart Utilities Ltd',
        '2025-10-01',
        '2026-11-30',
        17.80,
        17.80,
        13.35,
        74.00,
        78.00,
        'Medium',
        'On Track',
        'Low',
        83.00,
        19.00,
        0
    ),
    -- PROJECT 24: Intelligent Traffic Signal System
    (
        'a0240000-0000-0000-0000-000000000024',
        'PRJ-TRAF-2026-024',
        'HITEC City Intelligent Traffic Signal Synchronization System',
        'Computer vision camera traffic sensing across 42 junctions with dynamic green wave corridor timing optimization.',
        'Smart Lighting',
        'Electrical & Smart Infrastructure',
        'Madhapur - Kondapur - Gachibowli Triangle',
        'Hyderabad',
        17.4470,
        78.3760,
        'CON-004',
        'Hyderabad Smart Utilities Ltd',
        '2026-01-01',
        '2026-07-31',
        11.50,
        11.50,
        10.92,
        98.00,
        100.00,
        'Low',
        'Completed',
        'Low',
        98.00,
        2.00,
        0
    ),
    -- PROJECT 25: Solid Waste Transfer Station
    (
        'a0250000-0000-0000-0000-000000000025',
        'PRJ-COMP-2026-025',
        'Kompally Municipal Solid Waste Transfer Station',
        'Enclosed odor-controlled compactor transfer station handling 300 tons/day with leachate collection treatment ponds.',
        'Waste Management',
        'Municipal Administration (GHMC)',
        'Kompally Industrial Link Road',
        'Hyderabad',
        17.5400,
        78.4900,
        'CON-001',
        'ABC Infrastructure Ltd',
        '2026-02-01',
        '2026-12-15',
        9.20,
        9.20,
        4.60,
        48.00,
        60.00,
        'Medium',
        'At Risk',
        'Medium',
        70.00,
        42.00,
        15
    )
ON CONFLICT (id) DO UPDATE SET
    progress = EXCLUDED.progress,
    spent_budget = EXCLUDED.spent_budget,
    status = EXCLUDED.status,
    risk_level = EXCLUDED.risk_level,
    delay_probability = EXCLUDED.delay_probability,
    predicted_delay_days = EXCLUDED.predicted_delay_days;

-- 3. Insert Milestones for Demo Project (Urban Road Improvement Project)
INSERT INTO public.milestones (id, project_id, name, description, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status, progress, is_overdue)
VALUES
    ('m0010001-0000-0000-0000-000000000001', 'a0010000-0000-0000-0000-000000000001', 'Land Acquisition & Site Clearance', 'Right-of-way corridor acquisition and tree translocation', '2026-01-10', '2026-02-15', '2026-01-10', '2026-02-20', 'Completed', 100.0, false),
    ('m0010002-0000-0000-0000-000000000002', 'a0010000-0000-0000-0000-000000000001', 'Utility Shifting Clearance & NOCs', 'Underground electrical cable and water supply relocation', '2026-02-16', '2026-03-30', '2026-02-20', '2026-04-10', 'Completed', 100.0, false),
    ('m0010003-0000-0000-0000-000000000003', 'a0010000-0000-0000-0000-000000000001', 'Asphalt & Bitumen Procurement', 'Bulk delivery of VG-30 grade bitumen and aggregate from refinery', '2026-04-01', '2026-05-15', '2026-04-15', NULL, 'Overdue', 40.0, true),
    ('m0010004-0000-0000-0000-000000000004', 'a0010000-0000-0000-0000-000000000001', 'Sub-grade Foundation Layer Compaction', 'Laying compacted granular sub-base along 14km stretch', '2026-05-16', '2026-07-01', '2026-05-20', NULL, 'Overdue', 55.0, true),
    ('m0010005-0000-0000-0000-000000000005', 'a0010000-0000-0000-0000-000000000001', 'Dense Bituminous Macadam Surface', 'Application of binder course asphalt layering and storm drains', '2026-07-02', '2026-09-30', '2026-08-01', NULL, 'In Progress', 35.0, false),
    ('m0010006-0000-0000-0000-000000000006', 'a0010000-0000-0000-0000-000000000001', 'Final Inspection & Road Safety Markings', 'Thermoplastic road marking, signage, and commissioner inspection', '2026-10-01', '2026-11-10', NULL, NULL, 'Pending', 0.0, false)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    progress = EXCLUDED.progress,
    is_overdue = EXCLUDED.is_overdue;

-- 4. Insert Unresolved Issues for Demo Project (Urban Road Improvement Project)
INSERT INTO public.issues (id, project_id, issue_type, title, description, severity, status, created_at)
VALUES
    (
        'e0010001-0000-0000-0000-000000000001',
        'a0010000-0000-0000-0000-000000000001',
        'Procurement delay',
        'Bitumen Supply Delay from Refinery',
        'Bitumen supply delivery delayed by vendor for 14 calendar days due to refinery distribution clearance bottleneck.',
        'High',
        'Open',
        '2026-08-25 10:00:00+00'
    ),
    (
        'e0010002-0000-0000-0000-000000000002',
        'a0010000-0000-0000-0000-000000000001',
        'Material shortage',
        'Crushed Stone Aggregate Shortage',
        'Crushed stone aggregate supply short by 450 metric tons due to local quarry permit clearance delay.',
        'Medium',
        'In Progress',
        '2026-09-01 14:30:00+00'
    ),
    (
        'e0010003-0000-0000-0000-000000000003',
        'a0010000-0000-0000-0000-000000000001',
        'Approval delay',
        'Traffic Police Night Work NOC Pending',
        'Traffic Police NOC pending for night-time asphalt laying between 11 PM and 5 AM along the Gachibowli stretch.',
        'High',
        'Escalated',
        '2026-09-04 09:15:00+00'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    severity = EXCLUDED.severity;

-- 5. Insert Field Updates for Demo Project
INSERT INTO public.field_updates (id, project_id, progress, remarks, latitude, longitude, location, photo_url, issue_reported, created_at)
VALUES
    (
        'f0010001-0000-0000-0000-000000000001',
        'a0010000-0000-0000-0000-000000000001',
        54.0,
        'Sub-base compaction ongoing. Traffic diversion in place. Aggregate shortage reported on stretch 2.',
        17.4600,
        78.3689,
        'Kondapur - Gachibowli Corridor, Zone 3',
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80',
        true,
        '2026-09-08 11:20:00+00'
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Insert AI Prediction for Demo Project (Matches Section 48 Requirements Exactly)
INSERT INTO public.ai_predictions (
    id, project_id, delay_probability, predicted_delay_days, risk_level, health_score, 
    schedule_risk, budget_risk, contractor_risk, procurement_risk, quality_risk, 
    explanation, recommendations, created_at
)
VALUES
    (
        'd0010001-0000-0000-0000-000000000001',
        'a0010000-0000-0000-0000-000000000001',
        78.0,
        18,
        'High',
        64.0,
        'High schedule variance: actual progress 54% vs expected 72% (-18% variance).',
        'High budget pace: 78% of total budget spent against 54% physical completion.',
        'Contractor schedule score declined due to 2 overdue milestones and 3 open issues.',
        'Bitumen procurement vendor delay bottleneck.',
        'Sub-base compaction passed quality check.',
        'The project is currently 18% behind planned progress. Two milestones are overdue and budget utilization is increasing faster than physical completion.',
        '[
            "Conduct immediate site inspection",
            "Review contractor resource allocation",
            "Resolve procurement issue",
            "Escalate milestone delay",
            "Update completion forecast"
        ]'::jsonb,
        '2026-09-08 11:25:00+00'
    )
ON CONFLICT (id) DO UPDATE SET
    delay_probability = EXCLUDED.delay_probability,
    predicted_delay_days = EXCLUDED.predicted_delay_days,
    risk_level = EXCLUDED.risk_level;

-- 7. Insert Alerts
INSERT INTO public.alerts (id, project_id, title, message, severity, alert_type, is_read, created_at)
VALUES
    (
        'b0010001-0000-0000-0000-000000000001',
        'a0010000-0000-0000-0000-000000000001',
        'Critical Project Delay Detected',
        'AI engine detected 78% delay probability for Urban Road Improvement Project (18 days predicted delay).',
        'Critical',
        'AI Delay',
        false,
        '2026-09-08 11:30:00+00'
    ),
    (
        'b0010002-0000-0000-0000-000000000002',
        'a0010000-0000-0000-0000-000000000001',
        'Budget Utilization Exceeds Expected Level',
        'Urban Road Improvement Project capital expenditure has reached 78% while physical progress is 54%.',
        'Warning',
        'Budget Exceeded',
        false,
        '2026-09-07 14:00:00+00'
    ),
    (
        'b0010003-0000-0000-0000-000000000003',
        'a0030000-0000-0000-0000-000000000003',
        'Milestone Delay Alert - Stormwater Phase 3',
        'Trunk Pipeline Segment Laying is 45 days overdue. Flood prevention timeline compromised.',
        'Critical',
        'Milestone Overdue',
        false,
        '2026-09-06 16:30:00+00'
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Notifications
INSERT INTO public.notifications (id, title, message, type, is_read, project_id, created_at)
VALUES
    (
        'n0010001-0000-0000-0000-000000000001',
        'New Field Update Submitted',
        'Field Officer submitted site update with GPS photo for Urban Road Improvement Project.',
        'field_update',
        false,
        'a0010000-0000-0000-0000-000000000001',
        '2026-09-08 11:20:00+00'
    ),
    (
        'n0010002-0000-0000-0000-000000000002',
        'Critical Field Issue Reported',
        'High severity issue reported: Bitumen supply delivery delay from refinery.',
        'issue_reported',
        false,
        'a0010000-0000-0000-0000-000000000001',
        '2026-08-25 10:05:00+00'
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Budget Transactions for Urban Road Improvement Project
INSERT INTO public.budget_transactions (id, project_id, transaction_type, description, amount, transaction_date, category, created_at)
VALUES
    ('t0010001-0000-0000-0000-000000000001', 'a0010000-0000-0000-0000-000000000001', 'Allocation', 'State Infrastructure Budget Allocation', 18.00, '2026-01-05', 'Capital Grant', '2026-01-05 10:00:00+00'),
    ('t0010002-0000-0000-0000-000000000002', 'a0010000-0000-0000-0000-000000000001', 'Payment', 'Mobilization Advance to ABC Infrastructure Ltd', 3.60, '2026-01-18', 'Contractor Advance', '2026-01-18 11:00:00+00'),
    ('t0010003-0000-0000-0000-000000000003', 'a0010000-0000-0000-0000-000000000001', 'Expense', 'Land Acquisition & Utility Relocation Clearance', 2.80, '2026-03-25', 'Site Preparation', '2026-03-25 15:30:00+00'),
    ('t0010004-0000-0000-0000-000000000004', 'a0010000-0000-0000-0000-000000000001', 'Payment', 'Milestone Stage 2 Running Account Bill', 7.64, '2026-07-15', 'Civil Works', '2026-07-15 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Audit Logs
INSERT INTO public.audit_logs (id, action, project_id, entity_type, description, created_at)
VALUES
    ('l0010001-0000-0000-0000-000000000001', 'Project Created', 'a0010000-0000-0000-0000-000000000001', 'projects', 'Project Urban Road Improvement Project registered in CityTrack AI portal.', '2026-01-10 09:00:00+00'),
    ('l0010002-0000-0000-0000-000000000002', 'Progress Updated', 'a0010000-0000-0000-0000-000000000001', 'projects', 'Physical progress updated to 54% following field inspection.', '2026-09-08 11:20:00+00'),
    ('l0010003-0000-0000-0000-000000000003', 'AI Analysis Generated', 'a0010000-0000-0000-0000-000000000001', 'ai_predictions', 'AI Delay Engine calculated 78% delay probability and 18 days predicted delay.', '2026-09-08 11:25:00+00')
ON CONFLICT (id) DO NOTHING;

-- 11. Sync Base and _cr / _percentage Column Aliases in projects
UPDATE public.projects 
SET 
  total_budget_cr = COALESCE(NULLIF(total_budget_cr, 0), total_budget, 0),
  allocated_budget_cr = COALESCE(NULLIF(allocated_budget_cr, 0), allocated_budget, total_budget, 0),
  spent_budget_cr = COALESCE(NULLIF(spent_budget_cr, 0), spent_budget, 0),
  actual_progress_percentage = COALESCE(NULLIF(actual_progress_percentage, 0), progress, 0),
  expected_progress_percentage = COALESCE(NULLIF(expected_progress_percentage, 0), expected_progress, 0),
  total_budget = COALESCE(NULLIF(total_budget, 0), total_budget_cr, 0),
  allocated_budget = COALESCE(NULLIF(allocated_budget, 0), allocated_budget_cr, 0),
  spent_budget = COALESCE(NULLIF(spent_budget, 0), spent_budget_cr, 0),
  progress = COALESCE(NULLIF(progress, 0), actual_progress_percentage, 0),
  expected_progress = COALESCE(NULLIF(expected_progress, 0), expected_progress_percentage, 0);

NOTIFY pgrst, 'reload schema';
