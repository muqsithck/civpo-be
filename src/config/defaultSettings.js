/**
 * Default master data seeded per workspace (labour, machinery, units, materials, project types).
 * Used by seedDefaultSettings / ensureWorkspaceSettings — do not import in hot paths from frontend.
 */

export const DEFAULT_SETTINGS = {
  projectTypes: [
    { name: 'Residential House', description: 'Independent home construction' },
    { name: 'Villa', description: 'Premium residential villa projects' },
    { name: 'Apartment', description: 'Multi-unit residential buildings' },
    { name: 'Commercial Building', description: 'Shops, offices, complexes' },
    { name: 'Renovation', description: 'Modification or upgrade of existing building' },
    { name: 'Interior Work', description: 'Interior design and finishing' },
  ],

  labour: [
    { name: 'Mason', dailyWage: 900, unit: 'day', category: 'Skilled' },
    { name: 'Carpenter', dailyWage: 850, unit: 'day', category: 'Skilled' },
    { name: 'Electrician', dailyWage: 950, unit: 'day', category: 'Skilled' },
    { name: 'Plumber', dailyWage: 900, unit: 'day', category: 'Skilled' },
    { name: 'Bar Bender', dailyWage: 800, unit: 'day', category: 'Skilled' },
    { name: 'Welder', dailyWage: 1000, unit: 'day', category: 'Skilled' },

    { name: 'Helper', dailyWage: 500, unit: 'day', category: 'Unskilled' },
    { name: 'Cleaner', dailyWage: 450, unit: 'day', category: 'Unskilled' },
    { name: 'Watchman', dailyWage: 600, unit: 'day', category: 'Unskilled' },
  ],

  machinery: [
    { name: 'JCB', rate: 1500, unit: 'hour' },
    { name: 'Concrete Mixer', rate: 800, unit: 'day' },
    { name: 'Vibrator', rate: 300, unit: 'day' },
    { name: 'Mini Truck', rate: 1200, unit: 'trip' },
    { name: 'Scaffolding Set', rate: 500, unit: 'day' },
    { name: 'Water Pump', rate: 400, unit: 'day' },
  ],

  units: [
    { name: 'Square Feet', symbol: 'sqft', type: 'area' },
    { name: 'Square Meter', symbol: 'sqm', type: 'area' },

    { name: 'Cubic Meter', symbol: 'm3', type: 'volume' },
    { name: 'Cubic Feet', symbol: 'cft', type: 'volume' },
    { name: 'Litre', symbol: 'ltr', type: 'volume' },

    { name: 'Kilogram', symbol: 'kg', type: 'weight' },
    { name: 'Ton', symbol: 'ton', type: 'weight' },

    { name: 'Numbers', symbol: 'nos', type: 'count' },
    { name: 'Bag', symbol: 'bag', type: 'count' },
  ],

  materials: [
    { name: 'Cement', unit: 'kg', defaultRate: 7 },
    { name: 'Sand', unit: 'm3', defaultRate: 1200 },
    { name: 'Steel', unit: 'kg', defaultRate: 65 },
    { name: 'Bricks', unit: 'nos', defaultRate: 8 },
    { name: 'Gravel', unit: 'm3', defaultRate: 1000 },
    { name: 'Paint', unit: 'ltr', defaultRate: 250 },
    { name: 'Tiles', unit: 'sqft', defaultRate: 60 },
  ],
}
