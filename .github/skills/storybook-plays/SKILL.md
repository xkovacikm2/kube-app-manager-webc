---
name: storybook-plays
description: Create Storybook stories for a target LitElement component in the tests/ folder. Stories cover all attribute/property variants and include play functions for interactive scenarios targeting 100% statement coverage.
---

Create or update a `tests/<element-name>.stories.ts` file with comprehensive Storybook stories for the target LitElement custom element.

## Workspace conventions

- Framework: `@storybook/web-components-vite`
- Test runner: `@storybook/addon-vitest` + Vitest + Playwright (Chromium, headless)
- Coverage tool: `@vitest/coverage-v8` — target **100 % statement coverage** for the component under test.
- Shadow DOM testing: `shadow-dom-testing-library` provides `within`, `screen` variants that understand shadow roots. Use it where its queries return correct results; fall back to direct `shadowRoot` traversal when it does not.
- All story files live in the `tests/` folder beside the source.
- each story has own  description of element behavior relevant for that story, which will be shown in Storybook docs.

---

## File structure

* for documentation purposes each meta shall have a description of the component, which will be shown in Storybook docs.
* Meta must include component name in the `component` field to link stories to the correct custom element and enable automatic controls generation.
* If element uses Polyfea contexts then the story must add context description into "Context"  table using placeholder "argTypes" fields, e.g. 

```ts
argTypes: {
  // contexts
    mainContentContext: {
      name: "main-content",
      description:
        "Main content element(s). E.g . &lt;polyfea-md-apps&gt; for landing page or custom content on functionality pages." +
        " If no elements are provided then the shell will render elements with no slot specified",
      control: false,
      table: {
        category: "Polyfea Contexts",
      },
    },

    topbarLeadingContext: {
      name: "topbar-leading-icon",
      description:
        "Leading icon element. Only one element is taken from the context" +
        ' If no elements are provided then elements slotted to slot "topbar-leading" are used, or default hamburger menu icon is rendered',
      control: false,
      table: {
        category: "Polyfea Contexts",
      },
    },
}
```



```ts
// tests/<element-name>.stories.ts

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { within, userEvent, expect, waitFor } from '@storybook/test';          // play helpers
import { screen as shadowScreen } from 'shadow-dom-testing-library';            // shadow-aware queries
import '../src/<element-name>';                                                  // register custom element
// import additional dependencies as needed (Lit context providers, sibling elements, etc.)

// ── Optional stubs ──────────────────────────────────────────────────────────
// Register lightweight stubs for any peer custom elements (e.g. polyfea-context)
// that are not available in the test environment so stories are self-contained.

if (!customElements.get('polyfea-context')) {
  customElements.define('polyfea-context', class extends HTMLElement {
    static observedAttributes = ['name'];
    connectedCallback() { this.style.display = 'contents'; this.#render(); }
    attributeChangedCallback() { this.#render(); }
    #render() {
      const name = this.getAttribute('name') ?? '';
      this.innerHTML = `<div style="padding:8px;font-family:sans-serif;color:#555">
        [polyfea-context: <strong>${name}</strong>]</div>`;
    }
  });
}

// ── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Scida/<ComponentTitle>',
  tags: ['autodocs'],
  component: '<element-name>',
  render: (args) => html`<my-element .prop=${args.prop} attr=${args.attr}></my-element>`,
  argTypes: { /* one entry per @property */ /* one entry per available context, with category "Polyfea Contexts" */ },
  args: { /* sensible defaults */ },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ... more stories below
```

---

## Story categories to implement

Cover each of the following categories, adapting them to the specific component:

### 1. Static attribute/property variants

Create one story per meaningful combination or distinct value of every `@property`. Name stories descriptively: `WithImage`, `DarkTheme`, `Condensed`, `NavigationCollapsed`, etc.

- Set only `args` (and `render` if a custom wrapper is needed).
- Do **not** add a `play` function to pure visual/structural stories.

### 2. Edge cases

Enumerate boundary or degenerate states:

- Empty collections, zero values, very long strings, missing optional attributes.
- Boolean flags both `true` and `false`.
- Combinations that the component explicitly branches on in its `render()`.

### 3. Slot usage

Where the component exposes named slots, write stories that populate those slots so the slot rendering paths are exercised.

```ts
export const WithUserSlot: Story = {
  render: () => html`
    <my-element>
      <span slot="user">John Doe</span>
    </my-element>`,
};
```

### 4. Lit-context stories

When the component reads a value from a Lit context (via `@consume`), use `ContextProvider` to inject it:

```ts
import { ContextProvider } from '@lit/context';
import { uiSettingsContext } from '../src/ui-settings';

export const DarkThemeViaContext: Story = {
  render: () => {
    const host = document.createElement('div');
    new ContextProvider(host, { context: uiSettingsContext, initialValue: { theme: 'dark' } });
    const el = document.createElement('my-element');
    host.appendChild(el);
    return host;
  },
};
```

### 5. Interactive stories with `play` functions

Write `play` functions for every meaningful user interaction. These are what drive statement coverage. Add them to stories where user input has observable side effects.

Important: Never import 'vi' into `*.stories.ts` files because it breaks stories and requires usage of `storybook/test`. Use `waitFor` with real timers instead of `vi.useFakeTimers()` to test asynchronous behaviour.

```ts
export const NotifyUserInteraction: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('my-element') as HTMLElement;
    await (host as any).updateComplete;
    host.dispatchEvent(new CustomEvent('notify-user', { bubbles: true, composed: true,
      detail: { message: 'Hello', type: 'info' } }));
    await waitFor(() => {
      const notifications = host.shadowRoot!.querySelectorAll('sh-notification-item');
      expect(notifications.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
   },
};
```

#### Accessing shadow DOM in play functions

The `canvasElement` passed to every `play` function is the **host div** outside the shadow root. To query inside the component's shadow root use one of the following strategies (in order of preference):

**Strategy A — `shadow-dom-testing-library` `within`**

```ts
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('my-element')!;
  const shadow = within(host.shadowRoot!);            // shadow-dom-testing-library
  const btn = await shadow.findByRole('button', { name: /open/i });
  await userEvent.click(btn);
  await expect(shadow.getByRole('dialog')).toBeVisible();
},
```

> `within` from `shadow-dom-testing-library` accepts a `ShadowRoot` directly.

**Strategy B — direct `shadowRoot` queries**

Use this when `shadow-dom-testing-library` returns stale, null, or incorrect results (e.g. for custom elements with their own nested shadow roots):

```ts
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('my-element') as HTMLElement;
  // Wait for LitElement to complete its first render
  await (host as any).updateComplete;
  const inner = host.shadowRoot!.querySelector<HTMLButtonElement>('sh-vertical-nav-item[icon="settings"]');
  inner!.click();
  await (host as any).updateComplete;
  expect(host.shadowRoot!.querySelector('sh-modal')).not.toBeNull();
},
```

**Strategy C — `waitFor` + repeated query**

When state changes are asynchronous or triggered by timers, wrap assertions in `waitFor`:

```ts
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('my-element')!;
  await (host as any).updateComplete;
  host.dispatchEvent(new CustomEvent('notify-user', { bubbles: true, composed: true,
    detail: { message: 'Hello', type: 'info' } }));
  await waitFor(() => {
    const notifications = host.shadowRoot!.querySelectorAll('sh-notification-item');
    expect(notifications.length).toBeGreaterThan(0);
  }, { timeout: 3000 });
},
```

#### Dispatching custom events

When the component listens for custom events dispatched on itself or window, dispatch them from the play function:

```ts
host.dispatchEvent(new CustomEvent('my-custom-event', {
  bubbles: true,
  composed: true,
  detail: { key: 'value' },
}));
await (host as any).updateComplete;
```

#### Interacting with nested ShadowRoots

Third-party SHUI (`sh-*`) and `polyfea-context` elements have their own shadow roots. When you need to click a button or input inside them, walk the shadow chain manually:

```ts
const nav = host.shadowRoot!.querySelector('sh-vertical-nav');
const item = nav!.shadowRoot?.querySelector('sh-vertical-nav-item[icon="notification-center"]');
(item as HTMLElement)?.click();
await (host as any).updateComplete;
```

> **If you cannot pierce a shadow root** because `shadowRoot` is null (closed mode or the element has not yet rendered), wait and retry:
> ```ts
> await waitFor(() => expect(nav!.shadowRoot).not.toBeNull());
> ```
> If this still does not work, dispatch the relevant custom event directly instead of simulating the click.

---

## What interactions to cover

Cover every distinct code path that depends on an interaction:

| Branching condition | Story + play approach |
|---------------------|----------------------|
| Boolean `@property` toggled by user | Use two stories: one with the flag false, one with the flag true; add `play` to verify the rendered difference. |
| User click opens modal / panel | Click the trigger element in `play`, then assert the modal appears in the shadow root. |
| User click closes modal / panel | Open first (set hash or click), then click close, assert modal gone. |
| Custom events `NOTIFY_USER_EVENT`, `DELETE_NOTIFICATION_EVENT`, … | Dispatch with `host.dispatchEvent(...)`, then `waitFor` expected DOM change. |
| Hash change (`#setting=true`, `#notifications=true`) | Set `window.location.hash` before or inside `play`, then assert rendered content. |
| Navigation collapse toggle | Click the collapser nav item, assert `navigationCollapsed` reflects expected value or attribute. |
| Timer-driven dismissal | Use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` inside the play body when testing timed side effects. |
| Resize / media breakpoint | Use `ResizeObserver` mocks or set the element's `clientWidth` to trigger the responsive path. |
| Error / rejection listeners | Dispatch a synthetic `ErrorEvent` on `window`, wait for notification to appear. |

---

## play function skeleton

```ts
export const OpenSettings: Story = {
  play: async ({ canvasElement }) => {
    // 1. Get the component host
    const host = canvasElement.querySelector('scida-shell') as HTMLElement;

    // 2. Ensure first render is done
    await (host as any).updateComplete;

    // 3. Query the element to interact with
    const navItem = host.shadowRoot!
      .querySelector('sh-vertical-nav')!
      .shadowRoot?.querySelector('sh-vertical-nav-item[icon="settings"]') as HTMLElement | null;

    // 4. Act
    navItem?.click();
    await (host as any).updateComplete;

    // 5. Assert
    const modal = host.shadowRoot!.querySelector('sh-modal');
    expect(modal).not.toBeNull();
    expect(modal!.hasAttribute('visible')).toBe(true);
  },
};
```

---

## Naming conventions

| Story name | Purpose |
|-----------|---------|
| `Default` | One canonical "all defaults" story |
| `<Feature>` | Each meaningful property variation |
| `<Feature>Interaction` | Same variation **plus** a play function |
| `<AdjectiveNoun>` | Descriptive combos, e.g. `CollapsedNavigation`, `DarkThemeWithScale` |

---

## Coverage checklist

Before finishing, verify:

- [ ] Every branch in `render()` is exercised by at least one story.
- [ ] Every branch in event handlers / private methods that change state is exercised by a `play` function.
- [ ] Every named slot is populated in at least one story.
- [ ] Lit-context dependencies use `ContextProvider` wrappers.
- [ ] Polyfea and other external custom elements are stubbed if not available.
- [ ] `window` event listeners (`error`, `unhandledrejection`, `hashchange`) are poked in play functions where the component registers them.
- [ ] Each conditional block in lifecycle methods (`connectedCallback`, etc.) is reached by at least one story's setup.
- [ ] Timer-driven behaviour is covered (fake timers or `waitFor` with adequate timeouts).


Coverage reports can be generated by running  `npm run coverage` and inspecting the output in `coverage/` folder.

---

## Common pitfalls

1. **`within(canvasElement)` from `@storybook/test` does *not* cross shadow boundaries.** Always use `within(host.shadowRoot!)` from `shadow-dom-testing-library` or query via `shadowRoot.querySelector()` directly.

2. **LitElement renders asynchronously.** Always `await (host as any).updateComplete` after setting properties or dispatching events before querying the shadow DOM.

3. **Nested shadow roots** (e.g. `sh-*` elements): each element has its own shadow root. To reach an element inside `sh-vertical-nav` you must traverse: `host.shadowRoot → sh-vertical-nav → sh-vertical-nav.shadowRoot → element`. If any link is null the element has not rendered yet — use `waitFor`.

4. **Closed shadow roots** will return `null` for `shadowRoot`. In those cases drive behaviour via dispatched events instead of direct DOM manipulation.

5. **`userEvent.click` vs `.click()`**: `userEvent.click` from `@storybook/test` (Storybook's re-export of Testing Library) is pointer-event based and may not propagate correctly through shadow DOM. Prefer `.click()` or `dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))` for elements inside shadow roots.

6. **Stubs must be registered before the component is imported** if the component's module-level code references the stub element. Register stubs at the top of the file, before any `import '../src/...'` of the component itself.

7. **Hash state pollution**: Stories that manipulate `window.location.hash` leave hash state that can affect other tests. Use a `play` function with a `finally` block to clean up:
   ```ts
   play: async ({ canvasElement }) => {
     try {
       window.location.hash = 'setting=true';
       // ... assertions
     } finally {
       window.location.hash = '';
     }
   },
   ```

8. **If you get stuck** — if a shadow root boundary cannot be pierced, or if queries consistently return null despite the element visually appearing in the story — ask the user for intervention rather than silently skipping coverage of that branch.

---

## Example: complete stories file for a simple element

```ts
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { within, expect, waitFor } from '@storybook/test';
import { screen } from 'shadow-dom-testing-library';
import '../src/scida-app-card';

const meta: Meta = {
  title: 'Scida/AppCard',
  tags: ['autodocs'],
  component: 'scida-app-card',
  render: (args) => html`
    <scida-app-card
      headline=${args.headline}
      supporting-text=${args.supportingText}
      image-src=${args.imageSrc}
      href=${args.href}
      card-height=${args.cardHeight}
    ></scida-app-card>`,
  argTypes: {
    headline:       { control: 'text' },
    supportingText: { control: 'text' },
    imageSrc:       { control: 'text' },
    href:           { control: 'text' },
    cardHeight:     { control: 'text' },
  },
  args: {
    headline:       'My Application',
    supportingText: 'Short description.',
    imageSrc:       '',
    href:           '',
    cardHeight:     '100%',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Default state — no image, no link */
export const Default: Story = {};

/** With cover image */
export const WithImage: Story = {
  args: { imageSrc: 'https://picsum.photos/seed/scida/400/200', cardHeight: '15rem' },
  parameters: {
    docs: {
      description: {
        story: 'Shows card with image.',
      },
    },
  },
};

/** With navigation link */
export const WithLink: Story = {
  args: { href: 'https://example.com' },
  parameters: {
    docs: {
      description: {
        story: 'Shows card with a navigation link then can be used to navigate to the specified URL when user clicks the card.',
      },
    },
  },
};

/** Long headline overflows gracefully */
export const LongHeadline: Story = {
  args: { headline: 'A Very Long Application Name That May Overflow The Card Container Widget' },
  parameters: {
    docs: {
      description: {
        story: 'Long headline text wraps or truncates gracefully without breaking the layout.',
      },
    },
  },
};

/** Interaction: clicking a linked card should not navigate (no href set) */
export const ClickNoHref: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('scida-app-card') as HTMLElement;
    await (host as any).updateComplete;
    // Verify card renders without a link wrapper
    const anchor = host.shadowRoot!.querySelector('a');
    expect(anchor).toBeNull();
  },
  parameters: {
    docs: {
      description: {
        story: 'Clicking the card does nothing when no `href` is set, ensuring it does not behave like a link.',
      },
    },
  },
};

/** Interaction: clicking a linked card exposes its href */
export const ClickWithHref: Story = {
  args: { href: 'https://example.com' },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('scida-app-card') as HTMLElement;
    await (host as any).updateComplete;
    const anchor = host.shadowRoot!.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('https://example.com');
  },
  parameters: {
    docs: {
      description: {
        story: 'When `href` is set, the card renders an anchor element with the correct URL, making it navigable.',
      },
    },
  },
};
```