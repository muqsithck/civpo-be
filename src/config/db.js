import mongoose from 'mongoose'

const SERVER_SELECTION_TIMEOUT_MS = 5000

/**
 * Connects to MongoDB using MONGO_URI from the environment (Atlas or self-hosted).
 * Fails fast if the server is unreachable (no long hang).
 */
export async function connectDb() {
  const uri = process.env.MONGO_URI?.trim()
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables')
  }

  mongoose.set('strictQuery', true)

  mongoose.connection.on('error', (err) => {
    console.error('[mongodb] Runtime error:', err.message)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongodb] Disconnected from database')
  })

  console.log('[mongodb] Connecting...')

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      connectTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      maxPoolSize: 10,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[mongodb] Connection failed: ${msg}`)
    throw new Error(`MongoDB connection failed: ${msg}`)
  }

  console.log('[mongodb] Connected successfully')

  return mongoose.connection
}
