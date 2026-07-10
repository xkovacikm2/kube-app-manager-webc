export interface AppManifestEntry {
  name: string
  description: string
  url: string
  icon: string
}

export const DEV_APPS_MANIFEST_PATH = '/dev-apps.json'
export const PRODUCTION_APPS_MANIFEST_PATH = '/apps'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function resolveAppsManifestPath(isDev = import.meta.env.DEV): string {
  return isDev ? DEV_APPS_MANIFEST_PATH : PRODUCTION_APPS_MANIFEST_PATH
}

export function normalizeAppsManifest(payload: unknown): AppManifestEntry[] {
  if (!Array.isArray(payload)) {
    throw new Error('App manifest must be an array.')
  }

  return payload.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`App entry ${index + 1} is invalid.`)
    }

    const { description, icon, name, url } = entry

    if (
      typeof name !== 'string' ||
      typeof description !== 'string' ||
      typeof url !== 'string' ||
      typeof icon !== 'string'
    ) {
      throw new Error(`App entry ${index + 1} must contain string fields.`)
    }

    return {
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      icon: icon.trim(),
    }
  })
}

export async function loadAppsManifest(
  fetcher: typeof fetch = fetch,
  manifestPath = resolveAppsManifestPath(),
): Promise<AppManifestEntry[]> {
  const response = await fetcher(manifestPath)

  if (!response.ok) {
    throw new Error(`Unable to load apps: ${response.status}`)
  }

  const payload = await response.json()

  return normalizeAppsManifest(payload)
}