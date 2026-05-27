import fp from 'fastify-plugin'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { resolve } from 'path'
import { mkdirSync } from 'fs'

// Register this plugin in apps/server/src/index.ts, inside main(), before glue:
//   import uploadsPlugin from './plugins/uploads'
//   await server.register(uploadsPlugin)

const UPLOADS_DIR = resolve(__dirname, '../../../../uploads')

export default fp(async (server) => {
  // Multipart parsing — must be registered before fastify-openapi-glue
  await server.register(multipart, {
    limits: {
      // Hard cap — MediaService enforces the configurable limit per-request
      fileSize: 100 * 1024 * 1024,  // 100 MB absolute ceiling
    },
  })

  // Serve local uploads in dev. In production with a cloud provider
  // this is bypassed because files are served from R2/S3 directly.
  if (!process.env.STORAGE_PROVIDER || process.env.STORAGE_PROVIDER === 'local') {
    mkdirSync(UPLOADS_DIR, { recursive: true })
    await server.register(staticFiles, {
      root: UPLOADS_DIR,
      prefix: '/uploads/',
      decorateReply: false,  // avoid conflict if staticFiles is registered elsewhere
    })
  }
})
