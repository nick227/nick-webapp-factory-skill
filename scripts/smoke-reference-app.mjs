#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtureRoot = join(root, 'fixtures/reference-social-feed')
const scratchRoot = existsSync('/tmp') ? '/tmp' : tmpdir()
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const target = resolve(
  process.env.FACTORY_SMOKE_DIR ?? join(scratchRoot, 'nick-webapp-factory', `reference-social-feed-${runId}`),
)
const portOffset = 10_000 + (Date.now() % 20_000)
const apiPort = Number(process.env.FACTORY_SMOKE_API_PORT ?? portOffset)
const webPort = Number(process.env.FACTORY_SMOKE_WEB_PORT ?? portOffset + 1)
const apiURL = `http://localhost:${apiPort}`
const webURL = `http://localhost:${webPort}`
const databaseUrl = 'file:./dev.db'
const smokeEnv = {
  DATABASE_URL: databaseUrl,
  PORT: String(apiPort),
  CORS_ORIGIN: webURL,
  VITE_API_URL: apiURL,
  PLAYWRIGHT_API_URL: apiURL,
  PLAYWRIGHT_BASE_URL: webURL,
  TMPDIR: scratchRoot,
  TEMP: scratchRoot,
  TMP: scratchRoot,
}
const keep = process.argv.includes('--keep')

function log(message) {
  console.log(`\n==> ${message}`)
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true })
}

function copyFile(source, dest) {
  ensureDir(dirname(dest))
  copyFileSync(source, dest)
}

function copyDir(source, dest) {
  ensureDir(dest)
  for (const entry of readdirSync(source)) {
    const from = join(source, entry)
    const to = join(dest, entry)
    if (statSync(from).isDirectory()) copyDir(from, to)
    else copyFile(from, to)
  }
}

function write(path, content) {
  ensureDir(dirname(path))
  writeFileSync(path, content)
}

function writeJson(path, value) {
  write(path, `${JSON.stringify(value, null, 2)}\n`)
}

function run(command, args, options = {}) {
  log([command, ...args].join(' '))
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? target,
    env: { ...process.env, ...smokeEnv, ...options.env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function spawnServer(command, args, url) {
  const child = spawn(command, args, {
    cwd: target,
    env: { ...process.env, ...smokeEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    detached: process.platform !== 'win32',
  })
  child.stdout.on('data', (chunk) => process.stdout.write(chunk))
  child.stderr.on('data', (chunk) => process.stderr.write(chunk))
  return waitFor(url, child).then(() => child)
}

function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
}

async function waitFor(url, child) {
  const started = Date.now()
  while (Date.now() - started < 45_000) {
    if (child.exitCode !== null) throw new Error(`Process exited before ${url} became ready`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function copyFactoryTemplates() {
  const templates = join(root, 'templates')

  copyDir(join(templates, 'scripts'), join(target, 'scripts'))
  copyDir(join(templates, 'github'), join(target, '.github'))

  copyFile(join(templates, 'configs/tailwind.config.ts'), join(target, 'apps/web/tailwind.config.ts'))
  copyFile(join(templates, 'configs/postcss.config.cjs'), join(target, 'apps/web/postcss.config.cjs'))
  copyFile(join(templates, 'configs/index.css'), join(target, 'apps/web/src/index.css'))
  copyFile(join(templates, 'configs/tsconfig.app.json'), join(target, 'apps/web/tsconfig.json'))
  copyFile(join(templates, 'configs/tsconfig.server.json'), join(target, 'apps/server/tsconfig.json'))
  copyFile(join(templates, 'configs/tsconfig.base.json'), join(target, 'tsconfig.base.json'))
  copyFile(join(templates, 'configs/playwright.config.ts'), join(target, 'apps/web/playwright.config.ts'))

  copyDir(join(templates, 'components'), join(target, 'apps/web/src/components/ui'))
  copyFile(join(templates, 'layouts/Shell.tsx'), join(target, 'apps/web/src/components/layout/Shell.tsx'))
  copyFile(join(templates, 'lib/utils.ts'), join(target, 'apps/web/src/lib/utils.ts'))
  copyFile(join(templates, 'lib/theme.ts'), join(target, 'apps/web/src/lib/theme.ts'))
  copyFile(join(templates, 'web/main.tsx'), join(target, 'apps/web/src/main.tsx'))
  copyFile(join(templates, 'web/vite-env.d.ts'), join(target, 'apps/web/src/vite-env.d.ts'))
  copyFile(join(templates, 'web/queryClient.ts'), join(target, 'apps/web/src/lib/queryClient.ts'))
  copyFile(join(templates, 'web/AuthGuard.tsx'), join(target, 'apps/web/src/lib/AuthGuard.tsx'))
  copyFile(join(templates, 'web/vite.config.ts'), join(target, 'apps/web/vite.config.ts'))
  copyDir(join(templates, 'web/e2e'), join(target, 'apps/web/e2e'))

  copyFile(join(templates, 'sdk/client.ts'), join(target, 'packages/sdk/src/client.ts'))
  copyFile(join(templates, 'sdk/index.ts'), join(target, 'packages/sdk/src/index.ts'))
  copyFile(join(templates, 'sdk/generate.ts'), join(target, 'packages/sdk/scripts/generate.ts'))
  copyDir(join(templates, 'sdk/hooks'), join(target, 'packages/sdk/src/hooks'))

  copyFile(join(templates, 'server/index.ts'), join(target, 'apps/server/src/index.ts'))
  copyFile(join(templates, 'server/security.ts'), join(target, 'apps/server/src/plugins/security.ts'))
  copyFile(join(templates, 'server/pagination.ts'), join(target, 'apps/server/src/lib/pagination.ts'))
  copyFile(join(templates, 'server/handlers/auth.ts'), join(target, 'apps/server/src/handlers/auth.ts'))
  copyFile(join(templates, 'server/services/AuthService.ts'), join(target, 'apps/server/src/services/AuthService.ts'))
  copyDir(join(templates, 'server/test-helpers'), join(target, 'apps/server/src/__tests__/helpers'))
}

function writeScaffoldFiles() {
  write(target + '/pnpm-workspace.yaml', "packages:\n  - 'apps/*'\n  - 'packages/*'\n")
  writeJson(join(target, 'package.json'), {
    name: 'reference-social-feed',
    private: true,
    scripts: {
      dev: "pnpm --parallel --filter './apps/*' dev",
      typecheck: 'pnpm --recursive typecheck',
      test: 'pnpm --recursive test',
      'sdk:generate': 'pnpm --filter @project/sdk generate',
      'sdk:check': 'tsx scripts/check-sdk-drift.ts',
      'test:generate': 'tsx scripts/generate-tests.ts',
      'pages:generate': 'tsx scripts/generate-pages.ts',
      'db:push': 'pnpm --filter @project/db db:push',
      'db:seed': 'pnpm --filter @project/db db:seed',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/js-yaml': '^4.0.0',
      'js-yaml': '^4.0.0',
      tsx: '^4.0.0',
      typescript: '^5.0.0',
    },
  })

  writeJson(join(target, 'packages/api-spec/package.json'), {
    name: '@project/api-spec',
    version: '0.0.1',
    main: './openapi.yaml',
  })

  writeJson(join(target, 'packages/sdk/package.json'), {
    name: '@project/sdk',
    version: '0.0.1',
    exports: { '.': './src/index.ts' },
    scripts: {
      generate: 'tsx scripts/generate.ts',
      typecheck: 'tsc --noEmit',
      test: 'echo "sdk has no tests"',
    },
    dependencies: {
      '@tanstack/react-query': '^5.0.0',
      'openapi-fetch': '^0.12.0',
    },
    devDependencies: {
      'openapi-typescript': '^7.0.0',
      tsx: '^4.0.0',
      typescript: '^5.0.0',
    },
    peerDependencies: {
      react: '^18.0.0',
    },
  })

  writeJson(join(target, 'packages/db/package.json'), {
    name: '@project/db',
    version: '0.0.1',
    main: './src/client.ts',
    scripts: {
      'db:push': 'prisma db push',
      'db:seed': 'tsx prisma/seed.ts',
      typecheck: 'tsc --noEmit',
      test: 'echo "db has no tests"',
    },
    dependencies: {
      '@prisma/client': '^5.0.0',
      bcryptjs: '^2.4.3',
    },
    devDependencies: {
      '@types/bcryptjs': '^2.4.0',
      prisma: '^5.0.0',
      tsx: '^4.0.0',
      typescript: '^5.0.0',
    },
  })

  writeJson(join(target, 'apps/server/package.json'), {
    name: 'server',
    version: '0.0.1',
    scripts: {
      dev: 'tsx watch src/index.ts',
      typecheck: 'tsc --noEmit',
      test: 'vitest run --pool=forks --maxWorkers=1 --minWorkers=1',
    },
    dependencies: {
      '@fastify/cookie': '^9.0.0',
      '@fastify/cors': '^9.0.0',
      '@fastify/swagger': '^8.0.0',
      '@fastify/swagger-ui': '^3.0.0',
      '@project/db': 'workspace:*',
      bcryptjs: '^2.4.3',
      fastify: '^4.0.0',
      'fastify-openapi-glue': '^4.0.0',
      'js-yaml': '^4.0.0',
    },
    devDependencies: {
      '@apidevtools/swagger-parser': '^10.0.0',
      '@types/bcryptjs': '^2.4.0',
      '@types/js-yaml': '^4.0.0',
      ajv: '^8.0.0',
      'ajv-formats': '^3.0.0',
      tsx: '^4.0.0',
      typescript: '^5.0.0',
      vitest: '^2.0.0',
    },
  })

  writeJson(join(target, 'apps/web/package.json'), {
    name: 'web',
    version: '0.0.1',
    scripts: {
      dev: 'vite',
      typecheck: 'tsc --noEmit',
      'test:e2e': 'playwright test',
      test: 'echo "web has no unit tests"',
    },
    dependencies: {
      '@hookform/resolvers': '^3.0.0',
      '@project/sdk': 'workspace:*',
      '@tanstack/react-query': '^5.0.0',
      'class-variance-authority': '^0.7.0',
      clsx: '^2.0.0',
      'lucide-react': '^0.400.0',
      react: '^18.0.0',
      'react-dom': '^18.0.0',
      'react-hook-form': '^7.0.0',
      'react-router-dom': '^6.0.0',
      sonner: '^1.0.0',
      'tailwind-merge': '^2.0.0',
      zod: '^3.0.0',
    },
    devDependencies: {
      '@playwright/test': '^1.45.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      autoprefixer: '^10.0.0',
      postcss: '^8.0.0',
      tailwindcss: '^3.0.0',
      typescript: '^5.0.0',
      vite: '^5.0.0',
    },
  })

  write(join(target, '.env'), `DATABASE_URL="${databaseUrl}"\nPORT=${apiPort}\nCORS_ORIGIN=${webURL}\nVITE_API_URL=${apiURL}\n`)
  write(join(target, '.env.example'), readFileSync(join(target, '.env'), 'utf8'))
  write(join(target, 'packages/db/.env'), `DATABASE_URL="${databaseUrl}"\n`)
  write(join(target, 'packages/db/tsconfig.json'), '{\n  "extends": "../../tsconfig.base.json",\n  "include": ["src/**/*.ts", "prisma/**/*.ts"]\n}\n')
  write(join(target, 'packages/sdk/tsconfig.json'), '{\n  "extends": "../../tsconfig.base.json",\n  "include": ["src/**/*.ts", "scripts/**/*.ts"]\n}\n')
  write(join(target, 'apps/web/index.html'), '<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Reference Social Feed</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n')
}

function overlayFixture() {
  copyDir(join(fixtureRoot, 'overlay'), target)
}

async function bootChecks() {
  log('server boot check')
  const server = await spawnServer('pnpm', ['--filter', 'server', 'dev'], `${apiURL}/health`)
  stopProcess(server)

  log('web boot check')
  const web = await spawnServer('pnpm', ['--filter', 'web', 'exec', 'vite', '--host', '127.0.0.1', '--port', String(webPort)], webURL)
  stopProcess(web)
}

async function main() {
  if (!keep && process.env.FACTORY_SMOKE_DIR && existsSync(target)) {
    try {
      rmSync(target, { recursive: true, force: true })
    } catch (error) {
      console.error(`Could not remove FACTORY_SMOKE_DIR target: ${target}`)
      throw error
    }
  }
  ensureDir(target)

  copyFactoryTemplates()
  writeScaffoldFiles()
  overlayFixture()
  write(join(target, 'packages/db/prisma/dev.db'), '')

  run('pnpm', ['install'])
  run('pnpm', ['db:push'])
  run('pnpm', ['sdk:generate'])
  run('pnpm', ['sdk:check'])
  run('pnpm', ['test:generate'])
  run('pnpm', ['pages:generate'])
  run('pnpm', ['typecheck'])
  await bootChecks()
  run('pnpm', ['test'])
  run('pnpm', ['db:seed'])
  run('pnpm', ['--filter', 'web', 'exec', 'playwright', 'install', 'chromium'])
  run('pnpm', ['--filter', 'web', 'test:e2e'], { env: { CI: '1' } })

  log(`reference app smoke passed: ${target}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
