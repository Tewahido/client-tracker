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
import { execFileSync, execSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
  // user@host only: anything else (e.g. a leading '-') would be read by ssh as an option.
  else if (!/^[A-Za-z0-9._][A-Za-z0-9._-]*@[A-Za-z0-9.-]+$/.test(config.host)) problems.push(`DEPLOY_HOST must look like user@host, not "${config.host}".`)
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

/**
 * Contents of dist/version.json: which commit is live. The Deploy workflow reads it from
 * the live site to list database migrations added since, before anyone approves.
 */
export function versionFile(commit, deployedAt = new Date()) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`Not a commit id: ${commit}`)
  return `${JSON.stringify({ commit, deployedAt: deployedAt.toISOString() }, null, 2)}\n`
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options }).trim()
}

/** Never ask questions, never trust an unknown server, and only use the configured keys. */
const SSH_OPTIONS = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'IdentitiesOnly=yes']

const step = (message) => console.log(`\n▶ ${message}`)

function fail(problems) {
  for (const problem of [problems].flat()) console.error(`✖ ${problem}`)
  process.exit(1)
}

/**
 * Streams dist/ to the server's receiver and returns its last line of output (the live
 * index.html hash). Fails if either side fails, e.g. tar skipping an unreadable file.
 */
function upload(host) {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', [...SSH_OPTIONS, '--', host, 'lendly-receive'], { stdio: ['pipe', 'pipe', 'inherit'] })
    const tar = spawn('tar', ['-C', 'dist', '-cf', '-', '.'], { stdio: ['ignore', 'pipe', 'inherit'] })
    tar.stdout.pipe(ssh.stdin)
    let output = ''
    let tarCode = null
    ssh.stdout.on('data', (chunk) => (output += chunk))
    // The server stopping early (e.g. a full disk) closes the pipe; ssh's exit code explains why.
    ssh.stdin.on('error', () => {})
    tar.on('error', reject)
    ssh.on('error', reject)
    tar.on('close', (code) => (tarCode = code))
    ssh.on('close', (code) => {
      if (code !== 0) return reject(new Error(`the server refused the upload (exit ${code}); the live site is unchanged`))
      if (tarCode !== 0) return reject(new Error(`tar couldn't pack dist/ (exit ${tarCode}). Run npm run deploy -- --rollback, then fix dist/`))
      resolve(output.trim().split(/\r?\n/).pop() ?? '')
    })
  })
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const fileEnv = existsSync('.env.local') ? parseEnvFile(readFileSync('.env.local', 'utf8')) : {}
  const { config, problems } = deployConfig(process.env, fileEnv)

  if (args.has('--rollback')) {
    const hostProblems = problems.filter((p) => p.includes('DEPLOY_HOST'))
    if (hostProblems.length) fail(hostProblems)
    step(`Rolling back on ${config.host}`)
    console.log(run('ssh', [...SSH_OPTIONS, '--', config.host, 'lendly-receive', 'rollback']))
    return
  }
  if (problems.length) fail(problems)
  // Only CI may skip the checks: it runs them in its own job. On a PC, dist/ could be from any branch.
  if (args.has('--skip-checks') && !process.env.CI) fail('--skip-checks is for GitHub Actions only. Run npm run deploy.')

  if (!process.env.CI) {
    step('Checking this is the reviewed main')
    run('git', ['fetch', '--quiet', 'origin', 'main'])
    const [behind, ahead] = run('git', ['rev-list', '--left-right', '--count', 'origin/main...HEAD']).split(/\s+/).map(Number)
    const local = localProblems({
      branch: run('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
      // Untracked files count: one in public/ would end up in the build. Ignored files don't show here.
      dirty: run('git', ['status', '--porcelain']) !== '',
      ahead,
      behind,
    })
    if (local.length) fail(local)
  }

  if (!args.has('--skip-checks')) {
    step('Running every check: typecheck, lint, tests, audit, build, end-to-end')
    // One command string: npm is a .cmd file on Windows, so it needs a shell there.
    execSync('npm run verify --silent', { stdio: 'inherit' })
  }

  step('Checking the build')
  if (!existsSync('dist/index.html')) fail('There is no dist/index.html. Run the checks (or npm run build) first.')
  const page = readFileSync('dist/index.html')
  const problem = buildProblem(page.toString('utf8'), config.supabaseUrl)
  if (problem) fail(problem)
  writeFileSync('dist/version.json', versionFile(run('git', ['rev-parse', 'HEAD'])))

  step(`Uploading to ${config.host}`)
  const liveHash = await upload(config.host).catch((err) => fail(err.message))
  if (liveHash !== sha256(page)) {
    fail(`The server reports a different index.html than was built (${liveHash}). The upload is live; run npm run deploy -- --rollback if the site is broken.`)
  }
  console.log('The server is serving this build.')

  if (config.url) {
    step(`Checking ${config.url}`)
    try {
      const res = await fetch(config.url, { cache: 'no-store' })
      const body = Buffer.from(await res.arrayBuffer())
      if (res.ok && sha256(body) === sha256(page)) console.log(`${config.url} is live with this build.`)
      else console.warn(`⚠ ${config.url} answered ${res.status} with different content (a cache, or the domain points elsewhere).`)
    } catch (err) {
      // The upload worked; the public address can lag behind (e.g. a new domain's DNS).
      console.warn(`⚠ Couldn't reach ${config.url} (${err.cause?.code ?? err.message}). The server has the build.`)
    }
  }
  console.log('\n✔ Deployed.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main().catch((err) => fail(err.message))
