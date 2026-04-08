import { WorkspaceLabourData } from '../models/WorkspaceLabourData.js'
import { WorkspaceMaterialData } from '../models/WorkspaceMaterialData.js'
import { WorkspaceMachineryData } from '../models/WorkspaceMachineryData.js'
import { WorkspaceSiteLogData } from '../models/WorkspaceSiteLogData.js'
import { WorkspaceActivityLogData } from '../models/WorkspaceActivityLogData.js'
import { WorkspaceMaterialLedgerData } from '../models/WorkspaceMaterialLedgerData.js'
import { PlanningDocument } from '../models/PlanningDocument.js'
import { UserWorkspacePrefs } from '../models/UserWorkspacePrefs.js'
import { Project } from '../models/Project.js'
import { logActivity } from '../services/audit.service.js'
import { resolveActor } from '../lib/auditActor.js'
import { ENTITY_TYPES, AUDIT_ACTIONS } from '../config/auditConstants.js'
import {
  payloadsEqual,
  changedProjectIdsForDeployments,
  changedProjectIdsForMaterialEntries,
  changedProjectIdsForMachineryEntries,
} from '../lib/auditSnapshot.js'
import {
  describeLabourDeploymentsForProject,
  describeMaterialEntriesDiff,
  describeMachineryEntriesDiff,
} from '../lib/auditDescriptions.js'

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
    const prev = await WorkspaceLabourData.findOne({ workspaceId }).lean()
    const prevList = Array.isArray(prev?.deployments) ? prev.deployments : []
    const nextList = Array.isArray(deployments) ? deployments : []

    if (payloadsEqual(prevList, nextList)) {
      return res.json({ ok: true })
    }

    await WorkspaceLabourData.findOneAndUpdate(
      { workspaceId },
      { deployments: nextList },
      { upsert: true }
    )
    const actor = await resolveActor(req)
    const name = actor?.name ?? 'User'
    const changed = [...new Set(changedProjectIdsForDeployments(prevList, nextList))]

    if (changed.length === 0) {
      const uniquePids = [
        ...new Set(
          nextList
            .map((d) => d.projectId)
            .filter((x) => x != null && String(x).trim() !== '')
        ),
      ].map(String)
      const inferredPid = uniquePids.length === 1 ? uniquePids[0] : null
      const desc = inferredPid
        ? describeLabourDeploymentsForProject(nextList, inferredPid)
        : `${nextList.length} deployment${nextList.length !== 1 ? 's' : ''}`
      await logActivity({
        workspaceId,
        projectId: inferredPid,
        entityType: ENTITY_TYPES.LABOUR,
        entityId: inferredPid ?? '',
        action: AUDIT_ACTIONS.UPDATE,
        performedBy: actor?._id,
        description: inferredPid
          ? `${name} updated labour: ${desc}`
          : `${name} updated labour (${desc})`,
        metadata: { previousCount: prevList.length, nextCount: nextList.length },
      })
    } else {
      for (const pid of changed) {
        const desc = describeLabourDeploymentsForProject(nextList, pid)
        await logActivity({
          workspaceId,
          projectId: pid,
          entityType: ENTITY_TYPES.LABOUR,
          entityId: pid != null ? String(pid) : '',
          action: AUDIT_ACTIONS.UPDATE,
          performedBy: actor?._id,
          description: `${name} updated labour: ${desc}`,
          metadata: {
            previousCount: prevList.length,
            nextCount: nextList.length,
            projectId: pid,
          },
        })
      }
    }
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
    const prev = await WorkspaceMaterialData.findOne({ workspaceId }).lean()
    const prevList = Array.isArray(prev?.entries) ? prev.entries : []
    const nextList = Array.isArray(entries) ? entries : []

    if (payloadsEqual(prevList, nextList)) {
      return res.json({ ok: true })
    }

    await WorkspaceMaterialData.findOneAndUpdate(
      { workspaceId },
      { entries: nextList },
      { upsert: true }
    )
    const actor = await resolveActor(req)
    const name = actor?.name ?? 'User'
    const changed = [...new Set(changedProjectIdsForMaterialEntries(prevList, nextList))]

    if (changed.length === 0) {
      const uniquePids = [
        ...new Set(
          nextList
            .map((e) => e.projectId)
            .filter((x) => x != null && String(x).trim() !== '')
        ),
      ].map(String)
      const inferredPid = uniquePids.length === 1 ? uniquePids[0] : null
      const desc = inferredPid
        ? describeMaterialEntriesDiff(prevList, nextList, inferredPid)
        : `${nextList.length} row${nextList.length !== 1 ? 's' : ''}`
      await logActivity({
        workspaceId,
        projectId: inferredPid,
        entityType: ENTITY_TYPES.MATERIAL,
        entityId: inferredPid ?? '',
        action: AUDIT_ACTIONS.UPDATE,
        performedBy: actor?._id,
        description: inferredPid
          ? `${name} updated materials: ${desc}`
          : `${name} updated materials (${desc})`,
        metadata: { entryCount: nextList.length },
      })
    } else {
      for (const pid of changed) {
        const desc = describeMaterialEntriesDiff(prevList, nextList, pid)
        await logActivity({
          workspaceId,
          projectId: pid,
          entityType: ENTITY_TYPES.MATERIAL,
          entityId: pid != null ? String(pid) : '',
          action: AUDIT_ACTIONS.UPDATE,
          performedBy: actor?._id,
          description: `${name} updated materials: ${desc}`,
          metadata: { entryCount: nextList.length, projectId: pid },
        })
      }
    }
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
    const prev = await WorkspaceMachineryData.findOne({ workspaceId }).lean()
    const prevList = Array.isArray(prev?.entries) ? prev.entries : []
    const nextList = Array.isArray(entries) ? entries : []
    if (payloadsEqual(prevList, nextList)) {
      return res.json({ ok: true })
    }
    await WorkspaceMachineryData.findOneAndUpdate(
      { workspaceId },
      { entries: nextList },
      { upsert: true }
    )
    const actor = await resolveActor(req)
    const name = actor?.name ?? 'User'
    const changed = [...new Set(changedProjectIdsForMachineryEntries(prevList, nextList))]

    if (changed.length === 0) {
      const uniquePids = [
        ...new Set(
          nextList
            .map((e) => e.projectId)
            .filter((x) => x != null && String(x).trim() !== '')
        ),
      ].map(String)
      const inferredPid = uniquePids.length === 1 ? uniquePids[0] : null
      const desc = inferredPid
        ? describeMachineryEntriesDiff(prevList, nextList, inferredPid)
        : `${nextList.length} row${nextList.length !== 1 ? 's' : ''}`
      await logActivity({
        workspaceId,
        projectId: inferredPid,
        entityType: ENTITY_TYPES.MACHINERY,
        entityId: inferredPid ?? '',
        action: AUDIT_ACTIONS.UPDATE,
        performedBy: actor?._id,
        description: inferredPid
          ? `${name} updated machinery: ${desc}`
          : `${name} updated machinery (${desc})`,
        metadata: { entryCount: nextList.length },
      })
    } else {
      for (const pid of changed) {
        const desc = describeMachineryEntriesDiff(prevList, nextList, pid)
        await logActivity({
          workspaceId,
          projectId: pid,
          entityType: ENTITY_TYPES.MACHINERY,
          entityId: pid != null ? String(pid) : '',
          action: AUDIT_ACTIONS.UPDATE,
          performedBy: actor?._id,
          description: `${name} updated machinery: ${desc}`,
          metadata: { entryCount: nextList.length, projectId: pid },
        })
      }
    }
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
    const actor = await resolveActor(req)
    const n = Array.isArray(siteLogs) ? siteLogs.length : 0
    await logActivity({
      workspaceId,
      projectId: null,
      entityType: ENTITY_TYPES.SITE_LOG,
      entityId: workspaceId,
      action: AUDIT_ACTIONS.UPDATE,
      performedBy: actor?._id,
      description: `${actor?.name ?? 'User'} updated daily site logs (${n} entr${n !== 1 ? 'ies' : 'y'})`,
      metadata: { siteLogCount: n },
    })
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
    const prev = await PlanningDocument.findOne({ workspaceId, projectId }).lean()
    await PlanningDocument.findOneAndUpdate(
      { workspaceId, projectId },
      {
        stages: Array.isArray(stages) ? stages : [],
        activities: Array.isArray(activities) ? activities : [],
      },
      { upsert: true }
    )

    const proj = await Project.findOne({ workspaceId, projectId }).lean()
    const projectName = proj?.payload?.name ?? projectId
    const actor = await resolveActor(req)
    const nextStages = Array.isArray(stages) ? stages : []
    const nextActivities = Array.isArray(activities) ? activities : []
    const progressMsg = summarizeProgressChange(prev?.activities ?? [], nextActivities)

    await logActivity({
      workspaceId,
      projectId,
      entityType: ENTITY_TYPES.SCHEDULE,
      entityId: projectId,
      action: prev ? AUDIT_ACTIONS.UPDATE : AUDIT_ACTIONS.CREATE,
      performedBy: actor?._id,
      description: progressMsg
        ? `${actor?.name ?? 'User'} updated schedule for '${projectName}': ${progressMsg}`
        : `${actor?.name ?? 'User'} ${prev ? 'updated' : 'created'} schedule for '${projectName}' (${nextStages.length} stages, ${nextActivities.length} activities)`,
      metadata: {
        stagesCount: nextStages.length,
        activitiesCount: nextActivities.length,
        before: prev ? { stages: prev.stages, activities: prev.activities } : null,
        after: { stages: nextStages, activities: nextActivities },
      },
    })

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

/** Detect activity progress % changes for schedule audit descriptions */
function summarizeProgressChange(prevActs, nextActs) {
  if (!Array.isArray(prevActs) || !Array.isArray(nextActs)) return null
  const byId = (arr) => {
    const m = new Map()
    for (const a of arr) {
      const id = a.id ?? a._id
      if (id != null) m.set(String(id), a)
    }
    return m
  }
  const pm = byId(prevActs)
  const msgs = []
  for (const na of nextActs) {
    const id = na.id ?? na._id
    if (id == null) continue
    const pa = pm.get(String(id))
    const pProg = pa?.progress ?? pa?.progressPercent ?? pa?.plannedProgress
    const nProg = na?.progress ?? na?.progressPercent ?? na?.plannedProgress
    if (pProg !== undefined && nProg !== undefined && Number(pProg) !== Number(nProg)) {
      const label = na.name ?? na.title ?? na.label ?? String(id)
      msgs.push(`${label} ${pProg}% → ${nProg}%`)
    }
  }
  return msgs.length ? msgs.slice(0, 4).join('; ') : null
}
