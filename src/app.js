import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import { connectDb } from './config/db.js'
import { seedDatabase } from './config/seed.js'
import authRoutes from './routes/authRoutes.js'
import workspaceRoutes from './routes/workspaceRoutes.js'
import * as workspaceController from './controllers/workspaceController.js'
import * as historyController from './controllers/history.controller.js'
import { authMiddleware } from './middleware/auth.js'
import { requireWorkspaceMember } from './middleware/workspaceAccess.js'

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-insecure-jwt-secret-min-32-characters-long'
  console.warn('[startup] JWT_SECRET not set; using insecure dev default')
}

const PORT = Number(process.env.PORT) || 4000

function createApp() {
  const app = express()

  const corsOrigin = process.env.CORS_ORIGIN || '*'
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  )
  app.use(express.json({ limit: '10mb' }))

  app.get('/', (_req, res) => {
    res.type('text/plain').send('API is running')
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.post('/api/workspaces', authMiddleware, workspaceController.createWorkspace)
  app.post('/api/workspaces/join', authMiddleware, workspaceController.joinWorkspace)
  /** Audit log (registered before workspace router to guarantee GET matches). */
  app.get(
    '/api/workspaces/:workspaceId/history',
    authMiddleware,
    requireWorkspaceMember,
    historyController.listHistory
  )
  app.use('/api/workspaces/:workspaceId', workspaceRoutes)

  app.use((err, _req, res, _next) => {
    console.error('[express]', err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}

async function start() {
  console.log('[startup] Application starting…')

  try {
    await connectDb()

    console.log('[startup] Running database seed (if needed)…')
    await seedDatabase()
    console.log('[startup] Seed step finished')

    const app = createApp()

    app.listen(PORT, () => {
      console.log(`[startup] HTTP server listening at http://localhost:${PORT}`)
      console.log('[startup] MongoDB connection status: connected')
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[startup] Failed to start: ${message}`)
    if (err instanceof Error && err.stack) {
      console.error(err.stack)
    }
    process.exit(1)
  }
}

start()
