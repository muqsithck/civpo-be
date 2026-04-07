import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { Workspace } from '../models/Workspace.js'
import { Project } from '../models/Project.js'
import { WorkspaceLabourData } from '../models/WorkspaceLabourData.js'
import { WorkspaceMaterialData } from '../models/WorkspaceMaterialData.js'
import { WorkspaceMachineryData } from '../models/WorkspaceMachineryData.js'
import { WorkspaceSiteLogData } from '../models/WorkspaceSiteLogData.js'
import { WorkspaceActivityLogData } from '../models/WorkspaceActivityLogData.js'
import { WorkspaceMaterialLedgerData } from '../models/WorkspaceMaterialLedgerData.js'
import { PlanningDocument } from '../models/PlanningDocument.js'
import { getDefaultPermissions } from '../lib/roleDefaults.js'
import { DB_ROLES } from '../lib/workspaceMembership.js'
import {
  buildLabourDeployments,
  buildPlanningPrototype,
  buildMaterialContextEntries,
  buildMachineryContextEntries,
  buildSiteLogsSeed,
  buildMaterialLedgerSeed,
} from './seedData.js'

const DEMO_PW = 'Demo1234!'

const MOCK_PROJECTS_W1 = [
  { id: '1', name: 'Downtown Tower', progress: 68, status: 'On track', dueDate: 'Dec 2025' },
  { id: '2', name: 'Riverside Complex', progress: 42, status: 'Delayed', dueDate: 'Mar 2026' },
  { id: '3', name: 'Industrial Park', progress: 88, status: 'On track', dueDate: 'Oct 2025' },
]

export async function seedDatabase() {
  const existing = await Workspace.countDocuments()
  if (existing > 0) {
    return
  }

  const passwordHash = await bcrypt.hash(DEMO_PW, 10)

  const adminU = await User.create({
    userId: 'admin@demo.com',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    passwordHash,
    invitedMembers: [],
    roleOverride: null,
    currentWorkspaceId: '1',
  })

  const engineerU = await User.create({
    userId: 'engineer@demo.com',
    email: 'engineer@demo.com',
    name: 'Site Engineer',
    passwordHash,
    invitedMembers: [],
    roleOverride: null,
    currentWorkspaceId: '1',
  })

  const superU = await User.create({
    userId: 'superadmin@demo.com',
    email: 'superadmin@demo.com',
    name: 'Super Admin',
    passwordHash,
    invitedMembers: [],
    roleOverride: null,
    currentWorkspaceId: '1',
  })

  await Workspace.create({
    workspaceId: '1',
    name: 'Demo Workspace',
    companyCode: 'DEMO2024',
    alternateCodes: ['CIVPO'],
    ownerUserId: 'admin@demo.com',
    createdBy: adminU._id,
    members: [
      {
        user: adminU._id,
        role: DB_ROLES.SUPER_ADMIN,
        status: 'ACTIVE',
        name: 'Demo Admin',
        email: 'admin@demo.com',
        permissions: getDefaultPermissions('super_admin'),
        assignedProjectIds: ['1', '2', '3'],
      },
      {
        user: engineerU._id,
        role: DB_ROLES.MEMBER,
        status: 'ACTIVE',
        name: 'Site Engineer',
        email: 'engineer@demo.com',
        permissions: getDefaultPermissions('member'),
        assignedProjectIds: ['2'],
      },
      {
        user: superU._id,
        role: DB_ROLES.SUPER_ADMIN,
        status: 'ACTIVE',
        name: 'Super Admin',
        email: 'superadmin@demo.com',
        permissions: getDefaultPermissions('super_admin'),
        assignedProjectIds: ['1', '2', '3'],
      },
    ],
  })

  await Workspace.create({
    workspaceId: '2',
    name: 'Acme Corp',
    companyCode: 'ACME2024',
    alternateCodes: [],
    ownerUserId: 'admin@demo.com',
    createdBy: adminU._id,
    members: [
      {
        user: adminU._id,
        role: DB_ROLES.SUPER_ADMIN,
        status: 'ACTIVE',
        name: 'Demo Admin',
        email: 'admin@demo.com',
        permissions: getDefaultPermissions('super_admin'),
        assignedProjectIds: [],
      },
    ],
  })

  await Workspace.create({
    workspaceId: '3',
    name: 'BuildCo',
    companyCode: 'BUILD2024',
    alternateCodes: [],
    ownerUserId: 'admin@demo.com',
    createdBy: adminU._id,
    members: [
      {
        user: adminU._id,
        role: DB_ROLES.SUPER_ADMIN,
        status: 'ACTIVE',
        name: 'Demo Admin',
        email: 'admin@demo.com',
        permissions: getDefaultPermissions('super_admin'),
        assignedProjectIds: [],
      },
    ],
  })

  for (const p of MOCK_PROJECTS_W1) {
    await Project.create({
      workspaceId: '1',
      projectId: p.id,
      payload: p,
    })
  }

  const planning = buildPlanningPrototype()
  await PlanningDocument.create({
    workspaceId: '1',
    projectId: '1',
    stages: planning.stages,
    activities: planning.activities,
  })

  await WorkspaceLabourData.create({
    workspaceId: '1',
    deployments: buildLabourDeployments(),
  })

  await WorkspaceMaterialData.create({
    workspaceId: '1',
    entries: buildMaterialContextEntries(),
  })

  await WorkspaceMachineryData.create({
    workspaceId: '1',
    entries: buildMachineryContextEntries(),
  })

  await WorkspaceSiteLogData.create({
    workspaceId: '1',
    siteLogs: buildSiteLogsSeed(),
  })

  await WorkspaceActivityLogData.create({
    workspaceId: '1',
    entries: [],
  })

  await WorkspaceMaterialLedgerData.create({
    workspaceId: '1',
    entries: buildMaterialLedgerSeed(),
  })

  console.log('[seed] Demo database initialized (workspaces 1–3, demo users)')
}
