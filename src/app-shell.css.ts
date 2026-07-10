import { css } from 'lit'

export const appShellStyles = css`
  :host {
    color: #18313a;
    display: block;
    font-family: 'IBM Plex Sans', 'Avenir Next', 'Segoe UI', sans-serif;
    min-height: 100svh;
  }

  button,
  a {
    font: inherit;
  }

  .shell {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr);
    min-height: 100svh;
    position: relative;
  }

  .shell--drawer-open {
    overflow: hidden;
  }

  .drawer {
    background: #1b3944;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    color: #f8f2e8;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    inset: 0 auto 0 0;
    padding: 1.1rem 0.65rem;
    position: sticky;
    top: 0;
    transition: transform 180ms ease, width 180ms ease;
    width: 3rem;
    z-index: 30;
  }

  .drawer--expanded {
    width: 13rem;
  }

  .drawer-header {
    align-items: center;
    display: flex;
    gap: 0.6rem;
    justify-content: space-between;
  }

  .drawer-toggle,
  .overlay-close,
  .compact-trigger,
  .external-link,
  .tile,
  .nav-item,
  .backdrop {
    border: 0;
  }

  .drawer-toggle,
  .nav-item,
  .compact-trigger {
    align-items: center;
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    gap: 0.8rem;
    justify-content: flex-start;
    text-decoration: none;
    transition: background 160ms ease, color 160ms ease, transform 160ms ease;
  }

  .drawer-toggle {
    background: rgba(255, 244, 232, 0.12);
    min-height: 3rem;
    padding: 0 0.75rem;
    width: 100%;
  }

  .toggle-mark {
    display: inline-flex;
    font-size: 1.2rem;
    justify-content: center;
    width: 1.25rem;
  }

  .overlay-close,
  .compact-trigger {
    background: rgba(22, 49, 60, 0.1);
    color: #16313c;
    cursor: pointer;
    display: inline-flex;
    height: 2.75rem;
    justify-content: center;
    width: 2.75rem;
  }

  .overlay-close {
    background: rgba(255, 244, 232, 0.12);
    color: #f8f2e8;
  }

  .compact-trigger {
    display: none;
    font-size: 1.2rem;
    inset: 0.9rem auto auto 0.9rem;
    position: fixed;
    z-index: 25;
  }

  .drawer-nav {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .nav-item {
    min-height: 3.5rem;
    padding: 0 0.55rem;
    width: 100%;
  }

  .nav-item:hover,
  .nav-item:focus-visible,
  .drawer-toggle:hover,
  .drawer-toggle:focus-visible,
  .compact-trigger:hover,
  .compact-trigger:focus-visible,
  .tile:hover,
  .tile:focus-visible,
  .external-link:hover,
  .external-link:focus-visible,
  .overlay-close:hover,
  .overlay-close:focus-visible {
    outline: none;
    transform: translateY(-1px);
  }

  .nav-item--selected {
    background: rgba(255, 244, 232, 0.18);
  }

  .nav-icon {
    align-items: center;
    display: inline-flex;
    height: 2rem;
    justify-content: center;
    width: 2rem;
  }

  .nav-icon img {
    height: 2rem;
    object-fit: cover;
    width: 2rem;
  }

  .nav-icon-home {
    font-size: 1.35rem;
    line-height: 1;
  }

  .nav-copy {
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .backdrop {
    background: rgba(9, 18, 23, 0.38);
    inset: 0;
    position: fixed;
    z-index: 20;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
    padding: 1.5rem;
  }

  .topbar,
  .intro-card,
  .viewer-panel,
  .status-card {
    background: rgba(255, 252, 246, 0.88);
    border: 1px solid rgba(24, 49, 58, 0.08);
    box-shadow: 0 18px 40px rgba(22, 49, 60, 0.08);
  }

  .topbar {
    align-items: center;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    padding: 1.25rem 1.4rem;
  }

  .eyebrow {
    color: #8c5b38;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    margin: 0 0 0.25rem;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-family: 'Fraunces', 'Georgia', serif;
    font-size: clamp(1.9rem, 4vw, 3rem);
    line-height: 1;
  }

  h2 {
    font-family: 'Fraunces', 'Georgia', serif;
    font-size: clamp(1.4rem, 2.5vw, 2.1rem);
    line-height: 1.05;
  }

  .topbar-note,
  .viewer-description,
  .tile-description,
  .intro-card p,
  .status-card,
  .iframe-status {
    color: #4f666c;
    line-height: 1.5;
  }

  .external-link {
    background: #f59c64;
    color: #132c34;
    display: inline-flex;
    font-weight: 700;
    padding: 0.8rem 1.15rem;
    text-decoration: none;
    white-space: nowrap;
  }

  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .intro-card,
  .viewer-panel,
  .status-card {
    padding: 1.5rem;
  }

  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  .tile {
    background: rgba(255, 251, 245, 0.95);
    box-shadow: 0 14px 28px rgba(22, 49, 60, 0.08);
    color: #18313a;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    min-height: 14rem;
    padding: 1.2rem;
    text-align: left;
  }

  .tile-icon {
    background: #fef4eb;
    height: 3.5rem;
    object-fit: cover;
    width: 3.5rem;
  }

  .tile-name {
    font-size: 1.15rem;
    font-weight: 700;
  }

  .viewer-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1rem;
    min-height: 70svh;
  }

  .viewer-header {
    align-items: flex-start;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
  }

  .iframe-status {
    align-items: center;
    background: #fef4eb;
    display: inline-flex;
    font-weight: 600;
    min-height: 3rem;
    padding: 0 1rem;
  }

  .viewer-frame {
    background: #ffffff;
    border: 1px solid rgba(24, 49, 58, 0.12);
    flex: 1;
    min-height: 64svh;
    width: 100%;
  }

  .status-card--error {
    color: #9c2f2f;
  }

  @media (min-width: 720px) {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 1260px) {
    .grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }

  @media (max-width: 959px) {
    .shell {
      grid-template-columns: 1fr;
    }

    .drawer {
      bottom: 0;
      position: fixed;
      top: 0;
      transform: translateX(-105%);
    }

    .drawer--compact-open {
      transform: translateX(0);
    }

    .compact-trigger {
      display: inline-flex;
    }

    .content {
      padding-top: 4.25rem;
    }
  }

  @media (max-width: 719px) {
    .content {
      padding: 1rem;
    }

    .topbar,
    .viewer-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .viewer-header {
      gap: 0.65rem;
    }

    .external-link {
      width: 100%;
    }

    .tile {
      min-height: 12rem;
    }
  }
`