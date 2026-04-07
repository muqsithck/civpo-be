import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { requireWorkspaceMember } from '../middleware/workspaceAccess.js'
import * as workspaceController from '../controllers/workspaceController.js'
import * as dataController from '../controllers/dataController.js'

const router = Router({ mergeParams: true })

router.use(authMiddleware)
router.use(requireWorkspaceMember)

router.get('/members', workspaceController.listMembers)
router.post('/members', workspaceController.addMember)
router.patch('/members/:memberId', workspaceController.updateMember)
router.delete('/members/:memberId', workspaceController.removeMember)

router.get('/projects', workspaceController.listProjects)
router.put('/projects', workspaceController.replaceAllProjects)
router.post('/projects', workspaceController.createProject)
router.patch('/projects/:projectId', workspaceController.updateProject)
router.delete('/projects/:projectId', workspaceController.deleteProject)

router.get('/prefs', dataController.getPrefs)
router.put('/prefs', dataController.putPrefs)

router.get('/labour-deployments', dataController.getLabour)
router.put('/labour-deployments', dataController.putLabour)

router.get('/material-entries', dataController.getMaterials)
router.put('/material-entries', dataController.putMaterials)

router.get('/machinery-entries', dataController.getMachinery)
router.put('/machinery-entries', dataController.putMachinery)

router.get('/site-logs', dataController.getSiteLogs)
router.put('/site-logs', dataController.putSiteLogs)

router.get('/activity-log', dataController.getActivityLog)
router.put('/activity-log', dataController.putActivityLog)

router.get('/material-ledger', dataController.getMaterialLedger)
router.put('/material-ledger', dataController.putMaterialLedger)

router.get('/projects/:projectId/planning', dataController.getPlanning)
router.put('/projects/:projectId/planning', dataController.putPlanning)

export default router
