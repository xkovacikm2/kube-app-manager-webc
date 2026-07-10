import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { appShellStyles } from './app-shell.css.js'
import {
  loadAppsManifest,
  type AppManifestEntry,
} from './apps-manifest.js'

declare global {
  interface HTMLElementTagNameMap {
    'kube-app-manager-app': KubeAppManagerApp
  }
}

@customElement('kube-app-manager-app')
export class KubeAppManagerApp extends LitElement {
  @state()
  private apps: AppManifestEntry[] = []

  @state()
  private drawerExpanded = false

  @state()
  private errorMessage = ''

  @state()
  private iframeLoading = false

  @state()
  private isCompactViewport = false

  @state()
  private isLoading = true

  @state()
  private mobileDrawerOpen = false

  @state()
  private selectedApp: AppManifestEntry | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    void this.loadManifest()
  }

  disconnectedCallback(): void {
    window.removeEventListener('resize', this.handleResize)
    super.disconnectedCallback()
  }

  render() {
    return html`
      <div class="shell ${this.mobileDrawerClass}">
        <aside class=${classMap(this.drawerClass)}>
          <div class="drawer-header">
            <button
              class="drawer-toggle"
              type="button"
              aria-expanded=${String(this.drawerExpanded)}
              aria-label=${this.drawerExpanded ? 'Collapse navigation' : 'Expand navigation'}
              @click=${this.toggleDrawerExpanded}
              data-testid="drawer-expand"
            >
              <span class="toggle-mark">${this.drawerExpanded ? '«' : '»'}</span>
              ${this.drawerExpanded ? html`<span>Apps</span>` : null}
            </button>
            ${this.isCompactViewport
              ? html`
                  <button
                    class="overlay-close"
                    type="button"
                    aria-label="Close navigation"
                    @click=${this.closeMobileDrawer}
                  >
                    ×
                  </button>
                `
              : null}
          </div>

          <nav class="drawer-nav" aria-label="Applications">
            ${this.renderNavItem({
              description: 'Return to the application grid',
              icon: '',
              isHome: true,
              name: 'Home',
              url: '',
            })}
            ${this.apps.map((app) => this.renderNavItem(app))}
          </nav>
        </aside>

        ${this.renderCompactTrigger()}

        ${this.renderBackdrop()}

        <main class="content">
          ${this.renderMainContent()}
        </main>
      </div>
    `
  }

  private get drawerClass() {
    return {
      'drawer': true,
      'drawer--compact-open': this.isCompactViewport && this.mobileDrawerOpen,
      'drawer--expanded': this.drawerExpanded,
    }
  }

  private get mobileDrawerClass() {
    return this.isCompactViewport && this.mobileDrawerOpen ? 'shell--drawer-open' : ''
  }

  private closeMobileDrawer = () => {
    this.mobileDrawerOpen = false
  }

  private openMobileDrawer = () => {
    if (this.isCompactViewport) {
      this.mobileDrawerOpen = true
    }
  }

  private handleResize = () => {
    const compact = window.innerWidth < 960

    this.isCompactViewport = compact

    if (!compact) {
      this.mobileDrawerOpen = false
    }
  }

  private async loadManifest() {
    this.errorMessage = ''
    this.isLoading = true

    try {
      this.apps = await loadAppsManifest()
    } catch (error) {
      this.apps = []
      this.errorMessage =
        error instanceof Error ? error.message : 'Unable to load applications.'
    } finally {
      this.isLoading = false
    }
  }

  private onIframeLoaded = () => {
    this.iframeLoading = false
  }

  private openApp(app: AppManifestEntry) {
    this.selectedApp = app
    this.iframeLoading = true
    this.mobileDrawerOpen = false
  }

  private renderBackdrop() {
    if (!this.isCompactViewport || !this.mobileDrawerOpen) {
      return null
    }

    return html`<button
      class="backdrop"
      type="button"
      aria-label="Close navigation"
      @click=${this.closeMobileDrawer}
    ></button>`
  }

  private renderCompactTrigger() {
    if (!this.isCompactViewport || this.mobileDrawerOpen) {
      return null
    }

    return html`
      <button
        class="compact-trigger"
        type="button"
        aria-label="Open navigation"
        @click=${this.openMobileDrawer}
        data-testid="mobile-drawer-open"
      >
        ☰
      </button>
    `
  }

  private renderGrid() {
    if (this.isLoading) {
      return html`<section class="status-card">Loading applications…</section>`
    }

    if (this.errorMessage) {
      return html`<section class="status-card status-card--error" role="alert">
        ${this.errorMessage}
      </section>`
    }

    if (!this.apps.length) {
      return html`<section class="status-card">No applications are available.</section>`
    }

    return html`
      <section class="intro-card">
        <p class="eyebrow">Embedded workspace</p>
        <h2>Choose an app to open inside the manager.</h2>
        <p>
          Use the drawer for persistent navigation or launch directly from the grid.
        </p>
      </section>

      <section class="grid" aria-label="Application tiles">
        ${this.apps.map(
          (app) => html`
            <button
              class="tile"
              type="button"
              @click=${() => this.openApp(app)}
              data-testid="tile-${app.name}"
            >
              <img class="tile-icon" src=${app.icon} alt="" />
              <span class="tile-name">${app.name}</span>
              <span class="tile-description">${app.description}</span>
            </button>
          `,
        )}
      </section>
    `
  }

  private renderMainContent() {
    if (!this.selectedApp) {
      return html`<section class="dashboard">${this.renderGrid()}</section>`
    }

    return html`
      <section class="viewer-panel">
        <div class="viewer-header">
          <div>
            <p class="eyebrow">Embedded application</p>
            <h2>${this.selectedApp.name}</h2>
          </div>
          <p class="viewer-description">${this.selectedApp.description}</p>
        </div>

        ${this.iframeLoading
          ? html`<div class="iframe-status">Opening ${this.selectedApp.name}…</div>`
          : null}

        <iframe
          class="viewer-frame"
          src=${this.selectedApp.url}
          title=${this.selectedApp.name}
          @load=${this.onIframeLoaded}
        ></iframe>
      </section>
    `
  }

  private renderNavItem(app: AppManifestEntry & { isHome?: boolean }) {
    const isSelected = app.isHome ? this.selectedApp === null : this.selectedApp?.url === app.url

    return html`
      <button
        class="nav-item ${isSelected ? 'nav-item--selected' : ''}"
        type="button"
        @click=${() => this.selectNavItem(app)}
        data-testid=${app.isHome ? 'nav-home' : `nav-${app.name}`}
      >
        <span class="nav-icon" aria-hidden="true">
          ${app.isHome
            ? html`<span class="nav-icon-home">⌂</span>`
            : html`<img src=${app.icon} alt="" />`}
        </span>
        ${this.drawerExpanded ? html`<span class="nav-copy">${app.name}</span>` : null}
      </button>
    `
  }

  private selectNavItem(app: AppManifestEntry & { isHome?: boolean }) {
    if (app.isHome) {
      this.selectedApp = null
      this.iframeLoading = false
      this.mobileDrawerOpen = false
      return
    }

    this.openApp(app)
  }

  private toggleDrawerExpanded = () => {
    this.drawerExpanded = !this.drawerExpanded
  }

  static styles = appShellStyles
}