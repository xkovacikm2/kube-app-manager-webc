import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../src/app-shell.js'
import type { KubeAppManagerApp } from '../src/app-shell.js'

const manifestFixture = [
  {
    description: 'Counting + and - if we should have another',
    icon: 'https://baby-counter.kovko.top/icon.png',
    name: 'Baby counter',
    url: 'https://baby-counter.kovko.top/',
  },
  {
    description: 'My Virtual Battery charge',
    icon: 'https://ssd-virtual-battery.kovko.top/icon.png',
    name: 'SSD Virtual Battery',
    url: 'https://ssd-virtual-battery.kovko.top',
  },
]

async function settle(element: KubeAppManagerApp) {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

async function renderApp() {
  const element = document.createElement('kube-app-manager-app') as KubeAppManagerApp
  document.body.appendChild(element)
  await settle(element)
  return element
}

describe('kube-app-manager-app', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: vi.fn().mockResolvedValue(manifestFixture),
      ok: true,
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('renders tiles and drawer entries from the manifest', async () => {
    const element = await renderApp()

    const tiles = element.shadowRoot?.querySelectorAll('.tile')
    const navItems = element.shadowRoot?.querySelectorAll('.nav-item')

    expect(tiles).toHaveLength(2)
    expect(navItems).toHaveLength(3)
  })

  it('opens an app inside the iframe when a tile is clicked', async () => {
    const element = await renderApp()

    const tile = element.shadowRoot?.querySelector('[data-testid="tile-Baby counter"]') as HTMLButtonElement
    tile.click()
    await settle(element)

    const frame = element.shadowRoot?.querySelector('iframe')

    expect(frame?.getAttribute('src')).toBe('https://baby-counter.kovko.top/')
    expect(element.shadowRoot?.textContent).toContain('Opening Baby counter…')
  })

  it('expands the drawer labels and returns home from the drawer', async () => {
    const element = await renderApp()

    const toggle = element.shadowRoot?.querySelector('[data-testid="drawer-expand"]') as HTMLButtonElement
    toggle.click()
    await settle(element)

    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(element.shadowRoot?.textContent).toContain('SSD Virtual Battery')

    const navApp = element.shadowRoot?.querySelector('[data-testid="nav-Baby counter"]') as HTMLButtonElement
    navApp.click()
    await settle(element)

    const home = element.shadowRoot?.querySelector('[data-testid="nav-home"]') as HTMLButtonElement
    home.click()
    await settle(element)

    expect(element.shadowRoot?.querySelector('iframe')).toBeNull()
    expect(element.shadowRoot?.querySelector('.grid')).not.toBeNull()
  })

  it('shows an error state when manifest loading fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    const element = await renderApp()
    const alert = element.shadowRoot?.querySelector('[role="alert"]')

    expect(alert?.textContent).toContain('Unable to load apps: 500')
  })
})