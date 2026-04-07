import { getDemoDate } from '../lib/demoDates.js'

/** Mirrors frontend labour seed (ids preserved). */
export function buildLabourDeployments() {
  const d = getDemoDate
  const now = new Date().toISOString()
  return [
    {
      id: 'dep-seed-1',
      projectId: '2',
      date: d(0),
      title: 'Column casting',
      activityName: 'Column casting',
      stageName: 'Structure',
      location: 'Block A',
      gangName: 'Bhaskar Gang',
      labourMix: [
        { trade: 'mason', count: 3, rate: 800, lineTotal: 2400, tradeName: 'Mason' },
        { trade: 'mason_helper', count: 2, rate: 400, lineTotal: 800, tradeName: 'Mason Helper' },
      ],
      workDescription: 'Formwork and casting for columns C1–C8',
      workDurationType: 'full-day',
      wageRatePerLabour: 800,
      totalLabourCost: 3200,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-2',
      projectId: '2',
      date: d(0),
      title: 'Steel fixing',
      activityName: 'Steel fixing',
      stageName: 'Structure',
      location: 'Block B',
      gangName: 'Raju Steel Works',
      labourMix: [
        { trade: 'steel_fixer', count: 4, rate: 900, lineTotal: 3600, tradeName: 'Steel Fixer' },
        { trade: 'helper', count: 2, rate: 900, lineTotal: 1800, tradeName: 'Helper' },
      ],
      workDescription: 'Rebar placement for slab',
      workDurationType: 'full-day',
      wageRatePerLabour: 900,
      totalLabourCost: 5400,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-3',
      projectId: '2',
      date: d(1),
      title: 'Boundary wall plastering',
      activityName: 'Boundary wall plastering',
      stageName: 'Finishing',
      location: 'Block A',
      gangName: 'Bhaskar',
      labourMix: [
        { trade: 'mason', count: 2, rate: 750, lineTotal: 1500, tradeName: 'Mason' },
        { trade: 'mason_helper', count: 1, rate: 750, lineTotal: 750, tradeName: 'Mason Helper' },
        { trade: 'carpenter', count: 1, rate: 750, lineTotal: 750, tradeName: 'Carpenter' },
      ],
      workDescription: 'Site cleaning and plaster support',
      workDurationType: 'full-day',
      wageRatePerLabour: 750,
      totalLabourCost: 3000,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-4',
      projectId: '2',
      date: d(2),
      title: 'Foundation pour',
      activityName: 'Foundation pour',
      stageName: 'Foundation',
      location: 'Block C',
      gangName: 'Concrete Crew',
      labourMix: [
        { trade: 'mason', count: 5, rate: 850, lineTotal: 4250, tradeName: 'Mason' },
        { trade: 'mason_helper', count: 3, rate: 850, lineTotal: 2550, tradeName: 'Mason Helper' },
      ],
      workDescription: 'Concrete pour foundation F1–F4',
      workDurationType: 'full-day',
      wageRatePerLabour: 850,
      totalLabourCost: 6800,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-5',
      projectId: '2',
      date: d(2),
      title: 'Electrical conduit laying',
      activityName: 'Electrical conduit laying',
      stageName: 'Structure',
      location: 'Block A',
      gangName: 'Sharma Electric',
      labourMix: [
        { trade: 'electrician', count: 2, rate: 600, lineTotal: 1200, tradeName: 'Electrician' },
        { trade: 'helper', count: 1, rate: 600, lineTotal: 600, tradeName: 'Helper' },
      ],
      workDescription: 'Conduit runs for ground floor',
      workDurationType: 'half-day',
      wageRatePerLabour: 600,
      totalLabourCost: 1800,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-6',
      projectId: '2',
      date: d(3),
      title: 'Formwork erection',
      activityName: 'Formwork erection',
      stageName: 'Structure',
      location: 'Block B',
      gangName: 'Carpenter Squad',
      labourMix: [
        { trade: 'carpenter', count: 4, rate: 700, lineTotal: 2800, tradeName: 'Carpenter' },
        { trade: 'helper', count: 2, rate: 700, lineTotal: 1400, tradeName: 'Helper' },
      ],
      workDescription: 'Beam and slab formwork',
      workDurationType: 'full-day',
      wageRatePerLabour: 700,
      totalLabourCost: 4200,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-7',
      projectId: '1',
      date: d(1),
      title: 'Slab concreting',
      activityName: 'Slab concreting',
      stageName: 'Structure',
      location: 'Tower A',
      gangName: 'Downtown Crew',
      labourMix: [
        { trade: 'mason', count: 4, rate: 820, lineTotal: 3280, tradeName: 'Mason' },
        { trade: 'mason_helper', count: 2, rate: 820, lineTotal: 1640, tradeName: 'Mason Helper' },
      ],
      workDescription: 'Grade slab pour',
      workDurationType: 'full-day',
      wageRatePerLabour: 820,
      totalLabourCost: 4920,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
    {
      id: 'dep-seed-8',
      projectId: '2',
      date: d(4),
      title: 'Excavation',
      activityName: 'Excavation',
      stageName: 'Preparation',
      location: 'Block A',
      gangName: 'Earthworks',
      labourMix: [
        { trade: 'mason', count: 6, rate: 550, lineTotal: 3300, tradeName: 'Mason' },
        { trade: 'mason_helper', count: 2, rate: 550, lineTotal: 1100, tradeName: 'Mason Helper' },
      ],
      workDescription: 'Initial excavation for foundations',
      workDurationType: 'full-day',
      wageRatePerLabour: 550,
      totalLabourCost: 4400,
      costType: 'per-day',
      createdBy: 'Site Engineer',
      createdAt: now,
    },
  ]
}

function migrateActivity(a) {
  return {
    ...a,
    blockOrZone: a.blockOrZone ?? '',
    priority: a.priority ?? '3',
    remarks: a.remarks ?? '',
    estimatedQuantity: a.estimatedQuantity ?? a.plannedQuantity ?? '',
    estimatedRate: a.estimatedRate ?? 0,
  }
}

function migrateStage(s) {
  return { ...s, sanctionedBudget: s.sanctionedBudget ?? null }
}

const DEFAULT_STAGES = [
  { id: '1', name: 'Foundation', order: 0, startDate: '2025-01-01', endDate: '2025-02-15', status: 'completed' },
  { id: '2', name: 'Structure', order: 1, startDate: '2025-02-16', endDate: '2025-05-30', status: 'in_progress' },
  { id: '3', name: 'Brickwork', order: 2, startDate: '2025-06-01', endDate: '2025-08-15', status: 'not_started' },
  { id: '4', name: 'Plaster', order: 3, startDate: '2025-08-16', endDate: '2025-10-15', status: 'not_started' },
  { id: '5', name: 'Finishing', order: 4, startDate: '2025-10-16', endDate: '2025-12-31', status: 'not_started' },
]

const DEFAULT_ACTIVITIES = [
  { id: 'a1', stageId: '1', title: 'Excavation', blockOrZone: 'Block A', plannedStartDate: '2025-01-01', plannedEndDate: '2025-01-15', plannedQuantity: '500', unit: 'cum', priority: '1', remarks: '', status: 'completed', progress: 100 },
  { id: 'a2', stageId: '1', title: 'Foundation pour', blockOrZone: 'Block A', plannedStartDate: '2025-01-16', plannedEndDate: '2025-02-10', plannedQuantity: '120', unit: 'cum', priority: '1', remarks: '', status: 'completed', progress: 100 },
  { id: 'a3', stageId: '2', title: 'Column casting', blockOrZone: 'Block A', plannedStartDate: '2025-02-16', plannedEndDate: '2025-04-30', plannedQuantity: '48', unit: 'nos', priority: '2', remarks: '', status: 'in_progress', progress: 65 },
  { id: 'a4', stageId: '2', title: 'Slab work', blockOrZone: 'Block A', plannedStartDate: '2025-05-01', plannedEndDate: '2025-05-30', plannedQuantity: '2500', unit: 'sqft', priority: '2', remarks: '', status: 'not_started', progress: 0 },
]

export function buildPlanningPrototype() {
  return {
    stages: DEFAULT_STAGES.map(migrateStage),
    activities: DEFAULT_ACTIVITIES.map(migrateActivity),
  }
}

export function buildMaterialContextEntries() {
  const d = getDemoDate
  const now = new Date().toISOString()
  return [
    { id: 'mat-ctx-seed-1', date: d(0), projectId: '2', materialType: 'cement', materialName: 'Cement', quantity: 200, unit: 'bags', totalCost: 50000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mat-ctx-seed-2', date: d(0), projectId: '2', materialType: 'steel', materialName: 'Steel', quantity: 1.5, unit: 'ton', totalCost: 105000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mat-ctx-seed-3', date: d(1), projectId: '2', materialType: 'sand', materialName: 'Sand', quantity: 20, unit: 'cum', totalCost: 45000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mat-ctx-seed-4', date: d(0), projectId: '1', materialType: 'cement', materialName: 'Cement', quantity: 100, unit: 'bags', totalCost: 24000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mat-ctx-seed-5', date: d(2), projectId: '2', materialType: 'aggregate', materialName: 'Aggregate', quantity: 15, unit: 'cum', totalCost: 22500, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mat-ctx-seed-6', date: d(1), projectId: '1', materialType: 'bricks', materialName: 'Bricks', quantity: 5000, unit: 'nos', totalCost: 35000, createdBy: 'Site Engineer', createdAt: now },
  ]
}

export function buildMachineryContextEntries() {
  const d = getDemoDate
  const now = new Date().toISOString()
  return [
    { id: 'mach-ctx-seed-1', date: d(0), projectId: '2', machineType: 'concrete_mixer', machineName: 'Concrete Mixer', hoursUsed: 8, durationType: 'hours', cost: 12000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mach-ctx-seed-2', date: d(0), projectId: '2', machineType: 'jcb', machineName: 'JCB', hoursUsed: 6, durationType: 'hours', cost: 15000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mach-ctx-seed-3', date: d(1), projectId: '2', machineType: 'excavator', machineName: 'Excavator', hoursUsed: 8, durationType: 'hours', cost: 25000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mach-ctx-seed-4', date: d(0), projectId: '1', machineType: 'concrete_mixer', machineName: 'Concrete Mixer', hoursUsed: 8, durationType: 'hours', cost: 12000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mach-ctx-seed-5', date: d(2), projectId: '2', machineType: 'crane', machineName: 'Crane', hoursUsed: 8, durationType: 'hours', cost: 18000, createdBy: 'Site Engineer', createdAt: now },
    { id: 'mach-ctx-seed-6', date: d(1), projectId: '1', machineType: 'jcb', machineName: 'JCB', hoursUsed: 4, durationType: 'hours', cost: 10000, createdBy: 'Site Engineer', createdAt: now },
  ]
}

export function buildSiteLogsSeed() {
  const d = getDemoDate
  const now = new Date().toISOString()
  return [
    {
      id: 'log-seed-1',
      date: d(0),
      projectId: '2',
      engineerName: 'Site Engineer',
      workProgress: [
        { source: 'planned', activityId: 'a1', activityTitle: 'Column casting', stageName: 'Structure', progress: 75, quantityCompleted: '8 nos', blockOrZone: 'Block A' },
        { source: 'planned', activityId: 'a2', activityTitle: 'Steel fixing', stageName: 'Structure', progress: 100, quantityCompleted: 'Slab 1', blockOrZone: 'Block B' },
        {
          source: 'unplanned',
          manualEntryId: 'manual-seed-1',
          activityTitle: 'Emergency shuttering repair',
          stageName: 'Structure',
          progress: 0,
          quantityCompleted: '4 nos',
          remarks: 'Ad-hoc repair — not on schedule',
        },
      ],
      machinery: [
        { machineType: 'excavator', hoursUsed: 4, remarks: 'Block A excavation' },
        { machineType: 'mixer', hoursUsed: 6, remarks: 'Concrete batching' },
      ],
      issues: [{ delayType: 'rain', severity: 'low', note: 'Light drizzle, work continued', status: 'resolved' }],
      photos: [],
      manpower: [],
      materialLog: [],
      createdAt: now,
    },
    {
      id: 'log-seed-2',
      date: d(1),
      projectId: '2',
      engineerName: 'Site Engineer',
      workProgress: [
        { activityId: 'a1', activityTitle: 'Column casting', stageName: 'Structure', progress: 65, quantityCompleted: '6 nos', blockZone: 'Block A' },
      ],
      machinery: [{ machineType: 'tower_crane', hoursUsed: 8, remarks: 'Full day lifting' }],
      issues: [{ delayType: 'material_delay', severity: 'medium', note: 'Cement delivery delayed 2hrs', status: 'open' }],
      photos: [],
      manpower: [],
      materialLog: [],
      createdAt: now,
    },
    {
      id: 'log-seed-3',
      date: d(2),
      projectId: '2',
      engineerName: 'Site Engineer',
      workProgress: [
        { activityId: 'a3', activityTitle: 'Foundation pour', stageName: 'Foundation', progress: 100, quantityCompleted: '120 cum', blockZone: 'Block C' },
      ],
      machinery: [
        { machineType: 'mixer', hoursUsed: 10, remarks: 'Foundation concrete' },
        { machineType: 'jcb', hoursUsed: 3, remarks: 'Site levelling' },
      ],
      issues: [],
      photos: [],
      manpower: [],
      materialLog: [],
      createdAt: now,
    },
    {
      id: 'log-seed-4',
      date: d(3),
      projectId: '2',
      engineerName: 'Site Engineer',
      workProgress: [
        { activityId: 'a4', activityTitle: 'Formwork erection', stageName: 'Structure', progress: 40, quantityCompleted: '—', blockZone: 'Block B' },
      ],
      machinery: [{ machineType: 'crane', hoursUsed: 5, remarks: 'Formwork panels' }],
      issues: [{ delayType: 'labour_shortage', severity: 'high', note: 'Mason gang short', status: 'open' }],
      photos: [],
      manpower: [],
      materialLog: [],
      createdAt: now,
    },
    {
      id: 'log-seed-5',
      date: d(1),
      projectId: '1',
      engineerName: 'Site Engineer',
      workProgress: [
        { activityId: 'a5', activityTitle: 'Slab concreting', stageName: 'Structure', progress: 100, quantityCompleted: 'Grade slab', blockZone: 'Tower A' },
      ],
      machinery: [{ machineType: 'mixer', hoursUsed: 8, remarks: 'Slab pour' }],
      issues: [],
      photos: [],
      manpower: [],
      materialLog: [],
      createdAt: now,
    },
    {
      id: 'log-seed-6',
      date: d(4),
      projectId: '2',
      engineerName: 'Site Engineer',
      workProgress: [{ activityId: 'a6', activityTitle: 'Site clearing', stageName: 'Preparation', progress: 100, quantityCompleted: 'Zone 1', blockZone: 'Block A' }],
      machinery: [{ machineType: 'jcb', hoursUsed: 4, remarks: 'Site prep' }],
      issues: [],
      photos: [],
      manpower: [],
      materialLog: [],
      createdAt: now,
    },
  ]
}

export function buildMaterialLedgerSeed() {
  const d = getDemoDate
  return [
    { id: 'mat-seed-1', date: d(0), projectId: '2', material: 'Cement (OPC)', type: 'received', quantity: 200, unit: 'bags', supplier: 'ACC Ltd', cost: 50000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-2', date: d(0), projectId: '2', material: 'Steel TMT', type: 'used', quantity: 1.5, unit: 'tons', supplier: 'JSW Steel', cost: 105000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-3', date: d(1), projectId: '2', material: 'Sand', type: 'received', quantity: 20, unit: 'trucks', supplier: 'Local', cost: 45000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-4', date: d(1), projectId: '2', material: 'Aggregate 20mm', type: 'received', quantity: 15, unit: 'cubic m', supplier: 'Quarry Co', cost: 22500, engineerName: 'Site Engineer' },
    { id: 'mat-seed-5', date: d(2), projectId: '2', material: 'Cement (OPC)', type: 'used', quantity: 180, unit: 'bags', supplier: 'ACC Ltd', cost: 45000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-6', date: d(2), projectId: '2', material: 'Steel TMT', type: 'received', quantity: 3, unit: 'tons', supplier: 'JSW Steel', cost: 210000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-7', date: d(3), projectId: '2', material: 'Bricks', type: 'received', quantity: 5000, unit: 'nos', supplier: 'Brick Works', cost: 35000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-8', date: d(0), projectId: '1', material: 'Cement (PPC)', type: 'received', quantity: 100, unit: 'bags', supplier: 'Ultratech', cost: 24000, engineerName: 'Site Engineer' },
    { id: 'mat-seed-9', date: d(4), projectId: '2', material: 'Sand', type: 'received', quantity: 10, unit: 'trucks', supplier: 'Local', cost: 22000, engineerName: 'Site Engineer' },
  ]
}
