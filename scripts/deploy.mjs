// Builds main, runs every check, and uploads the app to the server. Used from a PC
// (`npm run deploy`) and by the "Deploy" GitHub Actions workflow, which runs only when
// someone starts it. See "Deploying" in README.md.
//
//   npm run deploy                     checks, builds and deploys main from this PC
//   npm run deploy -- --skip-checks    uploads an existing dist/ (CI runs the checks itself)
//   npm run deploy -- --rollback       puts the previous version back
//
// Settings, from the environment or .env.local (never committed):
//   DEPLOY_HOST   ssh destination, e.g. deploy@203.0.113.10
//   DEPLOY_URL    public address to check afterwards, e.g. https://lendly.co.za (optional)
//   VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY   built into the app
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/** KEY=value lines, ignoring comments and blank lines; quotes around values are dropped. */
export function parseEnvFile(text) {
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return env
}

/** What to deploy where, from the process environment first and .env.local second. */
export function deployConfig(env, fileEnv = {}) {
  const get = (name) => env[name] || fileEnv[name] || ''
  const config = { host: get('DEPLOY_HOST'), url: get('DEPLOY_URL'), supabaseUrl: get('VITE_SUPABASE_URL') }
  const problems = []
  if (!config.host) problems.push('Set DEPLOY_HOST (e.g. deploy@203.0.113.10) in .env.local or the environment.')
  if (!config.supabaseUrl) problems.push('Set VITE_SUPABASE_URL: without it the app builds in local-only mode.')
  return { config, problems }
}

/** Reasons a deploy from this PC shouldn't go ahead: it must be exactly the reviewed main. */
export function localProblems({ branch, dirty, ahead, behind }) {
  const problems = []
  if (branch !== 'main') problems.push(`You're on "${branch}". Deploy from main: git checkout main && git pull`)
  if (dirty) problems.push('There are uncommitted changes. Commit or stash them first.')
  if (behind > 0) problems.push(`main is ${behind} commit(s) behind origin/main. Run git pull.`)
  if (ahead > 0) problems.push(`main has ${ahead} commit(s) that aren't on GitHub. Changes reach main through a pull request.`)
  return problems
}

/** Checks the built index.html is a Supabase-mode production build with its security policy. */
export function buildProblem(html, supabaseUrl) {
  const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)?.[1]
  if (!policy) return 'dist/index.html has no Content-Security-Policy: is this a production build?'
  const connect = policy.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src')) ?? ''
  if (!connect.includes(new URL(supabaseUrl).origin)) return `The build doesn't connect to ${supabaseUrl}: it was built without that Supabase project.`
  return null
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options }).trim()
}

const step = (message) => console.log(`\n▶ ${message}`)

function fail(problems) {
  for (const problem of [problems].flat()) console.error(`✖ ${problem}`)
  process.exit(1)
}

/** Streams dist/ to the server's receiver and returns what it reports (the live index.html hash). */
function upload(host) {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', ['-o', 'BatchMode=yes', host, 'lendly-receive'], { stdio: ['pipe', 'pipe', 'inherit'] })
    const tar = spawn('tar', ['-C', 'dist', '-cf', '-', '.'], { stdio: ['ignore', 'pipe', 'inherit'] })
    tar.stdout.pipe(ssh.stdin)
    let output = ''
    ssh.stdout.on('data', (chunk) => (output += chunk))
    tar.on('error', reject)
    ssh.on('error', reject)
    ssh.on('close', (code) => (code === 0 ? resolve(output.trim()) : reject(new Error(`the server refused the upload (exit ${code})`))))
  })
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const fileEnv = existsSync('.env.local') ? parseEnvFile(readFileSync('.env.local', 'utf8')) : {}
  const { config, problems } = deployConfig(process.env, fileEnv)

  if (args.has('--rollback')) {
    if (!config.host) fail(problems)
    step(`Rolling back on ${config.host}`)
    console.log(run('ssh', ['-o', 'BatchMode=yes', config.host, 'lendly-receive', 'rollback']))
    return
  }
  if (problems.length) fail(problems)

  if (!process.env.CI) {
    step('Checking this is the reviewed main')
    run('git', ['fetch', '--quiet', 'origin', 'main'])
    const [behind, ahead] = run('git', ['rev-list', '--left-right', '--count', 'origin/main...HEAD']).split(/\s+/).map(Number)
    const local = localProblems({
      branch: run('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
      dirty: run('git', ['status', '--porcelain', '--untracked-files=no']) !== '',
      ahead,
      behind,
    })
    if (local.length) fail(local)
  }

  if (!args.has('--skip-checks')) {
    step('Running every check: typecheck, lint, tests, audit, build, end-to-end')
    execFileSync('npm', ['run', 'verify', '--silent'], { stdio: 'inherit', shell: process.platform === 'win32' })
  }

  step('Checking the build')
  if (!existsSync('dist/index.html')) fail('There is no dist/index.html. Run the checks (or npm run build) first.')
  const html = readFileSync('dist/index.html', 'utf8')
  const problem = buildProblem(html, config.supabaseUrl)
  if (problem) fail(problem)

  step(`Uploading to ${config.host}`)
  const liveHash = await upload(config.host).catch((err) => fail(err.message))
  if (liveHash !== sha256(html)) fail(`The server is serving a different index.html than was built (${liveHash}).`)
  console.log('The server is serving this build.')

  if (config.url) {
    step(`Checking ${config.url}`)
    try {
      const res = await fetch(config.url, { cache: 'no-store' })
      const body = await res.text()
      if (res.ok && sha256(body) === sha256(html)) console.log(`${config.url} is live with this build.`)
      else console.warn(`⚠ ${config.url} answered ${res.status} with different content (a cache, or the domain points elsewhere).`)
    } catch (err) {
      // The upload worked; the public address can lag behind (e.g. a new domain's DNS).
      console.warn(`⚠ Couldn't reach ${config.url} (${err.cause?.code ?? err.message}). The server has the build.`)
    }
  }
  console.log('\n✔ Deployed.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main()
