import { Router } from 'express'
import * as labour from '../controllers/settings/labour.controller.js'
import * as machinery from '../controllers/settings/machinery.controller.js'
import * as unit from '../controllers/settings/unit.controller.js'
import * as material from '../controllers/settings/material.controller.js'
import * as projectType from '../controllers/settings/projectType.controller.js'

const router = Router({ mergeParams: true })

router.get('/labour', labour.list)
router.post('/labour', labour.create)
router.patch('/labour/:id', labour.update)
router.delete('/labour/:id', labour.remove)

router.get('/machinery', machinery.list)
router.post('/machinery', machinery.create)
router.patch('/machinery/:id', machinery.update)
router.delete('/machinery/:id', machinery.remove)

router.get('/units', unit.list)
router.post('/units', unit.create)
router.patch('/units/:id', unit.update)
router.delete('/units/:id', unit.remove)

router.get('/materials', material.list)
router.post('/materials', material.create)
router.patch('/materials/:id', material.update)
router.delete('/materials/:id', material.remove)

router.get('/project-types', projectType.list)
router.post('/project-types', projectType.create)
router.patch('/project-types/:id', projectType.update)
router.delete('/project-types/:id', projectType.remove)

export default router
