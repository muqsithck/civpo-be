import { WorkspaceLabourData } from '../models/WorkspaceLabourData.js'
import { WorkspaceMaterialData } from '../models/WorkspaceMaterialData.js'
import { WorkspaceMachineryData } from '../models/WorkspaceMachineryData.js'
import { WorkspaceSiteLogData } from '../models/WorkspaceSiteLogData.js'
import { WorkspaceActivityLogData } from '../models/WorkspaceActivityLogData.js'
import { WorkspaceMaterialLedgerData } from '../models/WorkspaceMaterialLedgerData.js'
import { PlanningDocument } from '../models/PlanningDocument.js'
import { UserWorkspacePrefs } from '../models/UserWorkspacePrefs.js'

export async function getLabour(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await WorkspaceLabourData.findOne({ workspaceId }).lean()
    return res.json(doc?.deployments ?? [])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load labour data' })
  }
}

export async function putLabour(req, res) {
  try {
    const { workspaceId } = req.params
    const deployments = req.body
    await WorkspaceLabourData.findOneAndUpdate(
      { workspaceId },
      { deployments: Array.isArray(deployments) ? deployments : [] },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save labour data' })
  }
}

export async function getMaterials(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await WorkspaceMaterialData.findOne({ workspaceId }).lean()
    return res.json(doc?.entries ?? [])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load material data' })
  }
}

export async function putMaterials(req, res) {
  try {
    const { workspaceId } = req.params
    const entries = req.body
    await WorkspaceMaterialData.findOneAndUpdate(
      { workspaceId },
      { entries: Array.isArray(entries) ? entries : [] },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save material data' })
  }
}

export async function getMachinery(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await WorkspaceMachineryData.findOne({ workspaceId }).lean()
    return res.json(doc?.entries ?? [])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load machinery data' })
  }
}

export async function putMachinery(req, res) {
  try {
    const { workspaceId } = req.params
    const entries = req.body
    await WorkspaceMachineryData.findOneAndUpdate(
      { workspaceId },
      { entries: Array.isArray(entries) ? entries : [] },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save machinery data' })
  }
}

export async function getSiteLogs(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await WorkspaceSiteLogData.findOne({ workspaceId }).lean()
    return res.json(doc?.siteLogs ?? [])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load site logs' })
  }
}

export async function putSiteLogs(req, res) {
  try {
    const { workspaceId } = req.params
    const siteLogs = req.body
    await WorkspaceSiteLogData.findOneAndUpdate(
      { workspaceId },
      { siteLogs: Array.isArray(siteLogs) ? siteLogs : [] },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save site logs' })
  }
}

export async function getActivityLog(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await WorkspaceActivityLogData.findOne({ workspaceId }).lean()
    return res.json(doc?.entries ?? [])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load activity log' })
  }
}

export async function putActivityLog(req, res) {
  try {
    const { workspaceId } = req.params
    const entries = req.body
    await WorkspaceActivityLogData.findOneAndUpdate(
      { workspaceId },
      { entries: Array.isArray(entries) ? entries : [] },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save activity log' })
  }
}

export async function getMaterialLedger(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await WorkspaceMaterialLedgerData.findOne({ workspaceId }).lean()
    return res.json(doc?.entries ?? [])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load material ledger' })
  }
}

export async function putMaterialLedger(req, res) {
  try {
    const { workspaceId } = req.params
    const entries = req.body
    await WorkspaceMaterialLedgerData.findOneAndUpdate(
      { workspaceId },
      { entries: Array.isArray(entries) ? entries : [] },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save material ledger' })
  }
}

export async function getPlanning(req, res) {
  try {
    const { workspaceId, projectId } = req.params
    const doc = await PlanningDocument.findOne({ workspaceId, projectId }).lean()
    if (!doc) {
      return res.json({ stages: [], activities: [] })
    }
    return res.json({ stages: doc.stages ?? [], activities: doc.activities ?? [] })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load planning' })
  }
}

export async function putPlanning(req, res) {
  try {
    const { workspaceId, projectId } = req.params
    const { stages, activities } = req.body ?? {}
    await PlanningDocument.findOneAndUpdate(
      { workspaceId, projectId },
      {
        stages: Array.isArray(stages) ? stages : [],
        activities: Array.isArray(activities) ? activities : [],
      },
      { upsert: true }
    )
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save planning' })
  }
}

export async function getPrefs(req, res) {
  try {
    const { workspaceId } = req.params
    const doc = await UserWorkspacePrefs.findOne({ userId: req.userId, workspaceId }).lean()
    const projectPrefs = {}
    if (doc?.projectPrefs) {
      if (doc.projectPrefs instanceof Map) {
        doc.projectPrefs.forEach((v, k) => {
          projectPrefs[k] = v
        })
      } else if (typeof doc.projectPrefs === 'object') {
        Object.assign(projectPrefs, doc.projectPrefs)
      }
    }
    return res.json({
      activeProject: doc?.activeProject ?? null,
      lastProjectId: doc?.lastProjectId ?? null,
      projectPrefs,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load prefs' })
  }
}

export async function putPrefs(req, res) {
  try {
    const { workspaceId } = req.params
    const { activeProject, lastProjectId, projectPrefs } = req.body ?? {}

    let doc = await UserWorkspacePrefs.findOne({ userId: req.userId, workspaceId })
    if (!doc) {
      doc = new UserWorkspacePrefs({ userId: req.userId, workspaceId })
    }
    if (activeProject !== undefined) doc.activeProject = activeProject
    if (lastProjectId !== undefined) doc.lastProjectId = lastProjectId
    if (projectPrefs !== undefined && typeof projectPrefs === 'object') {
      const prev = doc.projectPrefs instanceof Map ? Object.fromEntries(doc.projectPrefs) : doc.projectPrefs || {}
      const merged = { ...prev }
      for (const [k, v] of Object.entries(projectPrefs)) {
        merged[k] = { ...(typeof prev[k] === 'object' && prev[k] ? prev[k] : {}), ...v }
      }
      doc.projectPrefs = new Map(Object.entries(merged))
    }
    await doc.save()
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save prefs' })
  }
}
