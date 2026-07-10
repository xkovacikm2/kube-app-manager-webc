---
name: unit-tests
description: Create Vitest unit tests for non-visual application logic and utility functions, targeting 100% statement coverage. Complements the storybook-plays skill which covers LitElement rendering.
---

Write or update Vitest unit tests for **non-visual** source modules. These tests run entirely in a Node/jsdom environment without a browser and without Storybook, making them fast and deterministic.

---

## Scope — what belongs here vs. storybook-plays

| Concern | Skill to use |
|---------|-------------|
| LitElement `render()` output, shadow DOM, slots, CSS parts | **storybook-plays** |
| Storybook story interactions and visible behaviour | **storybook-plays** |
| Utility / helper functions | **unit-tests** ← this skill |
| Custom event classes and factory functions | **unit-tests** |
| Lit `ReactiveController` logic (no rendering) | **unit-tests** |
| Context keys and typed context identifiers | **unit-tests** |
| `localStorage`-backed settings loaders/savers | **unit-tests** |
| Pure TypeScript business logic extracted from components | **unit-tests** |
| Localization helpers and locale-loading utilities | **unit-tests** |

> Rule of thumb: if the code under test does **not** call `LitElement.render()` or manipulate the shadow DOM, it belongs in a Vitest unit test, not a Storybook story.

---

## Workspace conventions

- Test runner: **Vitest** (already configured in `vite.config.ts`)
- Environment: `jsdom` (default) or `node` — set per file with `// @vitest-environment node` when no DOM is needed
- Coverage provider: `@vitest/coverage-istanbul` — target **100 % statement coverage** for every module under test
- Coverage reports: run `npm run coverage` and inspect `coverage/` folder
- Test files live in **`tests/`** alongside story files, named `<module-name>.test.ts`
- Import from `vitest` directly: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`

---

## File layout

```
tests/
  localization.test.ts          ← tests for src/localization.ts
  ui-settings.test.ts           ← tests for src/ui-settings.ts
  notify-user.test.ts           ← tests for src/notify-user.ts
  resize-controller.test.ts     ← tests for src/resize-controller.ts
  <module>.test.ts              ← one file per non-visual source module
```

Each file should import only from the module it is testing and from `vitest`. Avoid importing LitElement component classes.

---

## Test file skeleton

```ts
// tests/<module-name>.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { functionUnderTest } from '../src/<module-name>';

describe('<module-name>', () => {
  beforeEach(() => {
    // reset mocks and side-effects before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('<functionUnderTest>', () => {
    it('returns expected value for normal input', () => {
      expect(functionUnderTest('input')).toBe('expected');
    });

    it('handles edge case: empty string', () => {
      expect(functionUnderTest('')).toBe('');
    });
  });
});
```

---

## Coverage target

Every module you add tests for must reach **100 % statement coverage**. Check coverage per file:

```sh
npm run coverage
```

Coverage HTML output is written to `coverage/`. Open `coverage/index.html` to inspect uncovered lines.

If 100 % statement coverage cannot be reached purely by testing the public API, apply one or more of the refactoring strategies described below before adding defensive `/* c8 ignore */` comments.

---

## Mocking strategies

### `localStorage`

```ts
beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('returns defaults when localStorage is empty', () => {
  const settings = loadUISettings();
  expect(settings.scale).toBe(1);
});

it('persists settings to localStorage', () => {
  saveUISettings({ theme: 'dark', scale: 2 });
  expect(localStorage.setItem).toHaveBeenCalledWith(
    expect.any(String),
    JSON.stringify({ theme: 'dark', scale: 2 }),
  );
});
```

### `window.matchMedia`

```ts
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
```

### Custom events dispatched on `EventTarget`

Test that an event is dispatched with the correct type and detail without relying on a DOM element:

```ts
it('dispatches NotifyUserEvent with correct detail', () => {
  const target = new EventTarget();
  const listener = vi.fn();
  target.addEventListener(NOTIFY_USER_EVENT, listener);

  notifyUser(target, { type: 'information', message: 'Hello', dismiss: 0 });

  expect(listener).toHaveBeenCalledOnce();
  const event = listener.mock.calls[0][0] as CustomEvent;
  expect(event.detail.message).toBe('Hello');
  expect(event.detail.type).toBe('information');
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
});
```

### `ResizeObserver` (controller tests)

The `ResizeController` depends on `ResizeObserver`, which is not available in jsdom. Provide a minimal stub:

```ts
class ResizeObserverStub {
  callback: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) { this.callback = cb; }
  observe   = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  /** Manually trigger with a fake entry */
  trigger(contentRect: Partial<DOMRectReadOnly>) {
    this.callback([{ contentRect } as ResizeObserverEntry], this as any);
  }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});
afterEach(() => {
  vi.unstubAllGlobals();
});
```

Then create a minimal `ReactiveControllerHost` stub:

```ts
function makeHost(): ReactiveControllerHost & HTMLElement {
  const el = document.createElement('div') as any;
  el.addController = vi.fn();
  el.removeController = vi.fn();
  el.requestUpdate = vi.fn();
  return el;
}
```

### Timers

Use Vitest's fake timer API to control `setTimeout` / `setInterval` in synchronous tests:

```ts
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it('fires callback after delay', () => {
  const cb = vi.fn();
  scheduleCallback(cb, 500);
  vi.advanceTimersByTime(499);
  expect(cb).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(cb).toHaveBeenCalledOnce();
});
```

### Module-level side effects and singletons

When a module registers event listeners or sets global state at import time, reset this state in `afterEach` by:

1. Calling an exported `reset()` / `cleanup()` function (preferred — see *refactoring* section below), or
2. Re-importing the module using `vi.resetModules()` + dynamic `import()`.

```ts
afterEach(async () => {
  vi.resetModules();
  // re-import module in each test when side effects cannot be reset otherwise
});
```

---

## Patterns for common module types

### Utility / helper functions

Test every branch explicitly with distinct `it` blocks:

```ts
describe('loc', () => {
  it('returns template without id', () => {
    expect(loc('Hello')).toBe('Hello');
  });

  it('passes id to msg when provided', () => {
    // spy on the underlying msg implementation if needed
    const result = loc('Hello', 'greeting');
    expect(result).toBeDefined();
  });
});
```

### Custom event classes

Verify constructor arguments end up in the event properties:

```ts
describe('ThemeChangeRequestEvent', () => {
  it.each([['light'], ['dark'], [undefined]] as const)(
    'sets theme detail to %s',
    (theme) => {
      const evt = new ThemeChangeRequestEvent(theme);
      expect(evt.type).toBe(THEME_CHANGE_REQUEST_EVENT);
      expect(evt.detail.theme).toBe(theme);
      expect(evt.bubbles).toBe(true);
      expect(evt.composed).toBe(true);
    },
  );
});
```

### Factory / request functions

```ts
describe('requestThemeChange', () => {
  it('dispatches ThemeChangeRequestEvent on the target', () => {
    const target = new EventTarget();
    const spy = vi.fn();
    target.addEventListener(THEME_CHANGE_REQUEST_EVENT, spy);

    requestThemeChange(target, 'dark');

    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.theme).toBe('dark');
  });
});
```

### Reactive controllers

Test the controller's public surface and internal state transitions without rendering:

```ts
describe('ResizeController', () => {
  let host: ReactiveControllerHost & HTMLElement;
  let observer: ResizeObserverStub;
  let controller: ResizeController;

  beforeEach(() => {
    host = makeHost();
    controller = new ResizeController(host, 40, 80);
    // Capture the stub instance created in the constructor
    observer = (ResizeObserver as any).mock.results[0].value as ResizeObserverStub;
  });

  it('starts observing the host on hostConnected', () => {
    controller.hostConnected();
    expect(observer.observe).toHaveBeenCalledWith(host);
  });

  it('classifies widths below phone breakpoint as "phone"', () => {
    controller.hostConnected();
    observer.trigger({ width: 320 });
    expect(controller.mediaSize).toBe('phone');
  });

  it('disconnects observer on hostDisconnected', () => {
    controller.hostConnected();
    controller.hostDisconnected();
    expect(observer.disconnect).toHaveBeenCalledOnce();
  });
});
```

---

## Localization module (example)

```ts
describe('registerLocaleModule', () => {
  it('dispatches register-locale-module event on window', () => {
    const spy = vi.fn();
    window.addEventListener(REGISTER_LOCALE_EVENT, spy);
    try {
      registerLocaleModule('@my-org/mod', ['de', 'es'], async () => ({ templates: {} }));
      expect(spy).toHaveBeenCalledOnce();
      const evt = spy.mock.calls[0][0] as CustomEvent;
      expect(evt.detail.module).toBe('@my-org/mod');
      expect(evt.detail.locales).toContain('de');
    } finally {
      window.removeEventListener(REGISTER_LOCALE_EVENT, spy);
    }
  });
});
```

---

## Refactoring source code to improve testability

When a module is hard to test because of tight coupling to global state, inline side effects, or untestable branching, **edit the source file** to improve testability. Common patterns:

### 1. Extract pure functions from methods with side effects

Before:
```ts
export function loadUISettings(): UISettings {
  const raw = localStorage.getItem(KEY);
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // ...
}
```

After — inject dependencies as optional parameters with production defaults:
```ts
export function loadUISettings(
  storage: Pick<Storage, 'getItem'> = localStorage,
  mediaQuery = (q: string) => window.matchMedia(q),
): UISettings {
  const raw = storage.getItem(KEY);
  const dark = mediaQuery('(prefers-color-scheme: dark)').matches;
  // ...
}
```

This eliminates the need to mock globals and makes tests deterministic.

### 2. Expose a `reset()` or `cleanup()` function for modules with global state

When a module registers window event listeners or holds a singleton map/array, add an exported reset helper:

```ts
// src/localization.ts
let _registry = new Map<string, LoaderFn>();

export function _resetRegistryForTesting() {
  _registry = new Map();
}
```

Prefix the name with `_` (or place it under a `/* @internal */` comment) to signal it is test-only.

### 3. Lift module-level code into lazily-called init functions

If a module registers event listeners at the module level (top-level `window.addEventListener(…)`), move the registration into an exported `init()` function so tests can call `init()` / `cleanup()` around each test.

### 4. Use constructor injection in controllers

Pass collaborators (e.g. `ResizeObserver` constructor) as constructor parameters with production defaults:

```ts
export class ResizeController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost & HTMLElement,
    smallPx = 40,
    mediumPx = 80,
    ObserverCtor: typeof ResizeObserver = ResizeObserver,
  ) { … }
}
```

### 5. Keep changes backward-compatible

- Use **optional parameters with production defaults** so existing call sites continue to work unchanged.
- Do **not** change the public API signature in a breaking way without updating all callers.
- Run `npm run build` after refactoring to confirm the project still compiles.

---

## Coverage checklist

Before marking the task done, verify:

- [ ] Every exported function, class, and constant in the module under test has at least one test.
- [ ] Every `if` / `else` / ternary branch is covered by a distinct test case.
- [ ] Error paths (`catch`, `throw`, rejection handlers) are covered.
- [ ] Every `switch` case (including `default`) has a test.
- [ ] `localStorage`, `window.matchMedia`, `ResizeObserver`, and other browser globals are mocked — tests must pass with `vitest run` (no browser).
- [ ] `vi.restoreAllMocks()` or `vi.unstubAllGlobals()` is called in `afterEach` to prevent test pollution.
- [ ] No `// @vitest-environment browser` annotation — unit tests run in jsdom or node.
- [ ] `npm run coverage` output shows 100 % statement coverage for the targeted file(s).

---

## Common pitfalls

1. **Do not import LitElement components** in unit test files. Their module-level code calls `customElements.define`, which either fails in node or causes test pollution.

2. **Do not use `@storybook/test` imports** (`within`, `userEvent`, `waitFor`) in `.test.ts` files. Use Vitest APIs only.

3. **`vi.fn()` vs `vi.spyOn`**: prefer `vi.spyOn(object, 'method')` when you need the real implementation to fall through in some tests and want per-test control. Use `vi.fn()` for completely synthetic stubs.

4. **`vi.mock` is hoisted** by Vitest's transform — the factory runs before any imports in the file. Do not reference variables declared in the test file inside a `vi.mock` factory.

5. **jsdom does not implement `ResizeObserver`** — always stub it before constructing controllers that require it.

6. **localStorage in jsdom is real but shared** across test files in the same worker. Always call `localStorage.clear()` or mock `Storage.prototype` in `beforeEach` to avoid cross-test pollution.

7. **Async module-level registration**: if the module under test calls `window.dispatchEvent` at import time, dynamically import it inside each test (after setting up listeners) to observe those events:
   ```ts
   it('dispatches init event', async () => {
     const spy = vi.fn();
     window.addEventListener('my-init-event', spy);
     await import('../src/my-module');
     expect(spy).toHaveBeenCalledOnce();
     window.removeEventListener('my-init-event', spy);
   });
   ```
