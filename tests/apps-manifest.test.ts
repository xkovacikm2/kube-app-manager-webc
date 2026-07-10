import { describe, expect, it, vi } from 'vitest'
import {
  DEV_APPS_MANIFEST_PATH,
  PRODUCTION_APPS_MANIFEST_PATH,
  loadAppsManifest,
  normalizeAppsManifest,
  resolveAppsManifestPath,
} from '../src/apps-manifest.js'

const manifestFixture = [
  {
    description: 'Counting + and - if we should have another',
    icon: 'https://baby-counter.kovko.top/icon.png',
    name: 'Baby counter',
    url: 'https://baby-counter.kovko.top/',
  },
]

describe('normalizeAppsManifest', () => {
  it('returns typed manifest entries', () => {
    expect(normalizeAppsManifest(manifestFixture)).toEqual(manifestFixture)
  })

  it('throws when payload is not an array', () => {
    expect(() => normalizeAppsManifest({})).toThrow('App manifest must be an array.')
  })

  it('throws when an entry has missing string fields', () => {
    expect(() =>
      normalizeAppsManifest([{ description: 'x', icon: 'y', name: 'z', url: 1 }]),
    ).toThrow('App entry 1 must contain string fields.')
  })
})

describe('loadAppsManifest', () => {
  it('returns the dev manifest path when running in development', () => {
    expect(resolveAppsManifestPath(true)).toBe(DEV_APPS_MANIFEST_PATH)
  })

  it('returns the production manifest path when not in development', () => {
    expect(resolveAppsManifestPath(false)).toBe(PRODUCTION_APPS_MANIFEST_PATH)
  })

  it('fetches from the supplied manifest path', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(manifestFixture),
      ok: true,
    })

    await expect(
      loadAppsManifest(fetcher as typeof fetch, PRODUCTION_APPS_MANIFEST_PATH),
    ).resolves.toEqual(manifestFixture)
    expect(fetcher).toHaveBeenCalledWith(PRODUCTION_APPS_MANIFEST_PATH)
  })

  it('throws for a non-ok response', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 })

    await expect(loadAppsManifest(fetcher as typeof fetch)).rejects.toThrow(
      'Unable to load apps: 503',
    )
  })
})