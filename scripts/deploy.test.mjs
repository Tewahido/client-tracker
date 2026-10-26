import { describe, expect, it } from 'vitest'
import { buildProblem, deployConfig, localProblems, parseEnvFile, versionFile } from './deploy.mjs'

describe('parseEnvFile', () => {
  it('reads KEY=value lines and ignores comments and blanks', () => {
    const text = '# Supabase\nVITE_SUPABASE_URL=https://abc.supabase.co\r\n\nDEPLOY_HOST="deploy@203.0.113.10"\n  DEPLOY_URL = https://lendly.example \n'
    expect(parseEnvFile(text)).toEqual({
      VITE_SUPABASE_URL: 'https://abc.supabase.co',
      DEPLOY_HOST: 'deploy@203.0.113.10',
      DEPLOY_URL: 'https://lendly.example',
    })
  })
})

describe('deployConfig', () => {
  it('prefers the environment over .env.local', () => {
    const { config, problems } = deployConfig(
      { DEPLOY_HOST: 'deploy@ci', VITE_SUPABASE_URL: 'https://ci.supabase.co' },
      { DEPLOY_HOST: 'deploy@pc', DEPLOY_URL: 'https://lendly.example', VITE_SUPABASE_URL: 'https://pc.supabase.co' },
    )
    expect(config).toEqual({ host: 'deploy@ci', url: 'https://lendly.example', supabaseUrl: 'https://ci.supabase.co' })
    expect(problems).toEqual([])
  })

  it.each(['-oProxyCommand=calc@x', 'deploy@host -oX', 'just-a-host', 'deploy@host;rm'])('refuses a host that could smuggle ssh options: %j', (host) => {
    expect(deployConfig({ DEPLOY_HOST: host, VITE_SUPABASE_URL: 'https://abc.supabase.co' }).problems).toEqual([expect.stringMatching(/must look like user@host/)])
  })

  it('says what is missing', () => {
    expect(deployConfig({}).problems).toEqual([expect.stringMatching(/DEPLOY_HOST/), expect.stringMatching(/local-only mode/)])
  })
})

describe('localProblems', () => {
  it('allows exactly the reviewed main', () => {
    expect(localProblems({ branch: 'main', dirty: false, ahead: 0, behind: 0 })).toEqual([])
  })

  it.each([
    [{ branch: 'feat/x', dirty: false, ahead: 0, behind: 0 }, /Deploy from main/],
    [{ branch: 'main', dirty: true, ahead: 0, behind: 0 }, /uncommitted changes/],
    [{ branch: 'main', dirty: false, ahead: 0, behind: 2 }, /2 commit\(s\) behind/],
    [{ branch: 'main', dirty: false, ahead: 1, behind: 0 }, /aren't on GitHub/],
  ])('refuses %j', (state, message) => {
    expect(localProblems(state).join(' ')).toMatch(message)
  })
})

describe('buildProblem', () => {
  const page = (policy) => `<html><head>\n<meta http-equiv="Content-Security-Policy" content="${policy}" />`

  it('accepts a production build for the right Supabase project', () => {
    expect(buildProblem(page("default-src 'self'; connect-src 'self' https://abc.supabase.co wss://abc.supabase.co"), 'https://abc.supabase.co')).toBeNull()
  })

  it('refuses a build without the security policy', () => {
    expect(buildProblem('<html><head></head></html>', 'https://abc.supabase.co')).toMatch(/no Content-Security-Policy/)
  })

  it('refuses a local-mode build or one for another project', () => {
    expect(buildProblem(page("connect-src 'self'"), 'https://abc.supabase.co')).toMatch(/built without that Supabase project/)
    expect(buildProblem(page("connect-src 'self' https://other.supabase.co"), 'https://abc.supabase.co')).toMatch(/built without/)
  })
})

describe('versionFile', () => {
  it('records which commit is live and when', () => {
    const commit = 'a'.repeat(40)
    expect(JSON.parse(versionFile(commit, new Date('2026-10-26T18:00:00Z')))).toEqual({ commit, deployedAt: '2026-10-26T18:00:00.000Z' })
  })

  it('refuses anything that is not a full commit id', () => {
    expect(() => versionFile('main')).toThrow(/Not a commit id/)
  })
})
