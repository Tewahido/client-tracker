// Runs the real receiver with sh against a temporary web root (LENDLY_WWW), so the code that
// changes production is tested. Skipped where sh or tar aren't available.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const RECEIVER = join(import.meta.dirname, 'lendly-receive.sh')
const has = (tool) => spawnSync('sh', ['-c', `command -v ${tool}`]).status === 0
const available = spawnSync('sh', ['-c', 'true']).status === 0 && ['tar', 'timeout', 'sha256sum'].every(has)
/** sh on Windows (Git Bash) understands C:/... but not backslashes. */
const posix = (path) => path.replace(/\\/g, '/')
const sha256 = (text) => createHash('sha256').update(text).digest('hex')

describe.skipIf(!available)('lendly-receive', () => {
  let root
  let www
  let env

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lendly-receive-'))
    www = join(root, 'www')
    mkdirSync(www)
    const shims = join(root, 'bin')
    mkdirSync(shims)
    // Git Bash has no flock; the lock itself is exercised on the Linux server and in CI.
    if (!has('flock')) {
      writeFileSync(join(shims, 'flock'), '#!/bin/sh\nexit 0\n')
      chmodSync(join(shims, 'flock'), 0o755)
    }
    env = { ...process.env, LENDLY_WWW: posix(www), PATH: `${shims}${delimiter}${process.env.PATH}` }
    delete env.SSH_ORIGINAL_COMMAND
  })

  afterEach(() => rmSync(root, { recursive: true, force: true }))

  /** A tar stream of the given files, like scripts/deploy.mjs sends. */
  function pack(files, links = {}) {
    const src = mkdtempSync(join(root, 'src-'))
    for (const [name, content] of Object.entries(files)) {
      mkdirSync(dirname(join(src, name)), { recursive: true })
      writeFileSync(join(src, name), content)
    }
    for (const [name, target] of Object.entries(links)) symlinkSync(target, join(src, name))
    return spawnSync('tar', ['-C', posix(src), '-cf', '-', '.']).stdout
  }

  const receive = (input, args = [], extraEnv = {}) =>
    spawnSync('sh', [posix(RECEIVER), ...args], { input: input ?? '', encoding: 'utf8', env: { ...env, ...extraEnv } })
  const live = (file = 'index.html') => readFileSync(join(www, 'lendly', file), 'utf8')

  it('makes a build live and reports the hash of its index.html', () => {
    const result = receive(pack({ 'index.html': '<h1>v1</h1>', 'assets/app.js': 'console.log(1)' }))
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe(sha256('<h1>v1</h1>'))
    expect(live()).toBe('<h1>v1</h1>')
    expect(live('assets/app.js')).toBe('console.log(1)')
  })

  it('keeps the previous version', () => {
    receive(pack({ 'index.html': 'v1' }))
    receive(pack({ 'index.html': 'v2' }))
    expect(live()).toBe('v2')
    expect(readFileSync(join(www, 'lendly.old', 'index.html'), 'utf8')).toBe('v1')
  })

  it('refuses an upload without index.html and leaves the site alone', () => {
    receive(pack({ 'index.html': 'v1' }))
    const result = receive(pack({ 'other.html': 'oops' }))
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/no index.html; nothing changed/)
    expect(live()).toBe('v1')
    expect(existsSync(join(www, 'lendly.new'))).toBe(false)
  })

  it('refuses something that is not a tar archive', () => {
    const result = receive('definitely not a tar file')
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/couldn't be unpacked/)
  })

  // Creating symlinks needs Linux or macOS (CI runs this).
  it.skipIf(process.platform === 'win32')('refuses links, which could publish other files on the server', () => {
    const result = receive(pack({ 'index.html': 'v1' }, { 'key.pem': '/etc/hostname' }))
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/links and special files/)
    expect(existsSync(join(www, 'lendly'))).toBe(false)
  })

  it('rolls back, and rolling back again returns to the newer version', () => {
    receive(pack({ 'index.html': 'v1' }))
    receive(pack({ 'index.html': 'v2' }))
    expect(receive(null, ['rollback']).status).toBe(0)
    expect(live()).toBe('v1')
    expect(receive(null, ['rollback']).status).toBe(0)
    expect(live()).toBe('v2')
  })

  it('says so when there is nothing to roll back to', () => {
    receive(pack({ 'index.html': 'v1' }))
    const result = receive(null, ['rollback'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/no previous version/)
    expect(live()).toBe('v1')
  })

  it.each([['lendly-receive; rm -rf /'], ['lendly-receive $(reboot)'], ['sh -c id']])(
    'only knows deploy and rollback, whatever a forced key asks for: %j',
    (request) => {
      const result = receive(null, [], { SSH_ORIGINAL_COMMAND: request })
      expect(result.status).toBe(2)
      expect(result.stderr).toMatch(/unknown command/)
    },
  )
})
