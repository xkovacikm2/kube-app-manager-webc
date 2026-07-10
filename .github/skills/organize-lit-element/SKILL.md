---
name: organize-lit-element
description: Reorganize a LitElement component class to follow a consistent structure and add comprehensive TSDoc comments.
---
Reorganize a LitElement component class to follow a consistent structure and add comprehensive TSDoc comments. Apply each section below in sequence: first **Member Ordering**, then **TSDoc Comments**, then **HTMLElementTagNameMap Declaration**, and finally verify the **Checklist**.

## Member Ordering

Reorder all fields and methods within the LitElement class body according to the following sequence:

1. **`@property` fields** — ordered alphabetically by field name.
2. **`@state` fields** — ordered alphabetically by field name.
3. **Other fields** (no decorator, or decorators other than `@property`/`@state`) — ordered alphabetically by field name. This includes `@provide`, `@consume`, and similar context decorators.
4. **`constructor`**
5. **Public methods** — ordered so that a method which *calls* another method appears *before* the method it calls (caller-first / top-down readability). Always prioritize caller-first ordering; use alphabetical order only as a secondary criterion when the call order is ambiguous. Lit lifecycle methods (`connectedCallback`, `disconnectedCallback`, `render`, `firstUpdated`, `updated`, `willUpdate`, etc.) are treated as public methods for ordering purposes.
6. **Private and protected methods** — same caller-first rule, alphabetical order as a secondary criterion when call order is ambiguous.
7. **`static styles`** — always the very last member in the class body.

> **Note:** Keep decorators together with the field/method they annotate. Do not split decorator lines from the declaration they precede.

## TSDoc Comments

### Class-level comment

Every LitElement class must have a JSDoc block immediately above the `@customElement` (or equivalent) decorator. It must include:

- A one-paragraph description of the component's purpose.
- **`@slot`** entries for every named slot the component exposes, plus the default slot if used. Format:
  ```
  @slot {default} - Description of default slot content.
  @slot navigation - Navigation items rendered inside the vertical nav.
  ```
- **`@csspart`** entries for any exposed CSS shadow parts (omit section if none).
- **Design token** entries for every CSS custom property the component reads or exposes. Use a custom `@cssprop` tag:
  ```
  @cssprop --notification-max-width - Maximum width of a toast notification item. Default: 25rem.
  ```
- **`@polyfea`** entries for every `<polyfea-context>` element used inside the component's template. Explain the purpose of each context slot:
  ```
  @polyfea navigation - Injects micro-frontend navigation items into the vertical nav bar.
  @polyfea main-content - Injects the primary page content area.
  ```

### Field comments

- **`@property` fields** (HTML attributes): Add a TSDoc comment describing the attribute's purpose. Tag each one with `@attr`:
  ```ts
  /**
   * The display name shown in the access bar header.
   * @attr product-name
   */
  @property({ attribute: 'product-name' }) productName: string = 'Product Name';
  ```
- **`@state` fields**, private fields, and fields decorated with framework-level decorators (`@provide`, `@consume`): Add a brief one-line `/** ... */` comment and mark with `@ignore`:
  ```ts
  /** @ignore */
  @state() private _showSetting = false;
  ```
- **Public fields** that are not attributes: Comment with full description, no `@ignore`.

### Method comments

- **Private methods** (prefix `#` or keyword `private`) and **protected methods**: Add a one-line `/** @ignore */` comment.
- **Lit lifecycle methods** (`connectedCallback`, `disconnectedCallback`, `render`, `firstUpdated`, `updated`, `willUpdate`, `attributeChangedCallback`): Mark with `@ignore` and a one-liner explaining what the override does, e.g.:
  ```ts
  /**
   * Registers global event listeners and initialises locale/theme on attach.
   * @ignore
   */
  override connectedCallback() { ... }
  ```
- **Public methods**: Provide a full TSDoc block:
  - Summary sentence.
  - `@param` for every parameter.
  - `@returns` if the return type is non-void.
  - `@fires` for every custom event dispatched by the method.
  - Example block (`@example`) when usage is non-obvious.

### `static styles`

Add a brief comment:
```ts
/** @ignore Component styles. */
static override styles = [ ... ];
```

## HTMLElementTagNameMap Declaration

After the closing brace of the class, append (or ensure the presence of) a module-level declaration:

```ts
declare global {
  interface HTMLElementTagNameMap {
    'tag-name': ClassName;
  }
}
```

where `'tag-name'` matches the tag name passed to `@customElement` (or the equivalent registration call) and `ClassName` is the class name.

## Example — Before / After Sketch

```ts
// BEFORE (illustrative excerpt)
@customElement('my-widget')
export class MyWidget extends LitElement {
  static styles = css`...`;

  #log = Logger.getLogger('MyWidget');

  @state() private _open = false;

  @property({ type: String }) label = '';

  constructor() { super(); }

  render() { ... }

  #toggle() { this._open = !this._open; }

  open() { this.#toggle(); }
}
```

```ts
// AFTER
/**
 * A focusable disclosure widget with a labelled trigger button.
 *
 * @slot - Default slot for the expandable content.
 * @cssprop --my-widget-border-radius - Border radius applied to the container. Default: 4px.
 */
@customElement('my-widget')
export class MyWidget extends LitElement {
  // ── @property fields ──────────────────────────────────────────────
  /**
   * Accessible label rendered on the trigger button.
   * @attr label
   */
  @property({ type: String }) label = '';

  // ── @state fields ─────────────────────────────────────────────────
  /** @ignore */
  @state() private _open = false;

  // ── Other fields ──────────────────────────────────────────────────
  /** @ignore */
  #log = Logger.getLogger('MyWidget');

  // ── Constructor ───────────────────────────────────────────────────
  constructor() { super(); }

  // ── Public methods ────────────────────────────────────────────────
  /**
   * Opens the widget's expandable region.
   */
  open() { this.#toggle(); }

  /**
   * Renders the component template.
   * @ignore
   */
  override render() { ... }

  // ── Private methods ───────────────────────────────────────────────
  /** @ignore */
  #toggle() { this._open = !this._open; }

  // ── Static styles (always last) ───────────────────────────────────
  /** @ignore Component styles. */
  static override styles = css`...`;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-widget': MyWidget;
  }
}
```

## Checklist for Agents

- [ ] All `@property` fields are present and sorted A–Z.
- [ ] All `@state` fields are present and sorted A–Z.
- [ ] Remaining fields are present and sorted A–Z.
- [ ] `constructor` follows the fields.
- [ ] Public methods appear before the private/protected methods they delegate to.
- [ ] `static styles` is the last member.
- [ ] Class TSDoc includes `@slot`, `@cssprop`, and `@polyfea` sections where applicable.
- [ ] Every `@property` field has `@attr` in its TSDoc.
- [ ] Private/protected fields and methods carry `/** @ignore */`.
- [ ] Lit lifecycle overrides carry `/** ... @ignore */`.
- [ ] Public methods have full TSDoc (`@param`, `@returns`, `@fires`).
- [ ] `declare global { interface HTMLElementTagNameMap { ... } }` block is present after the class.
