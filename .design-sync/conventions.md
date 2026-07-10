## Using this design system

**Wrap every screen in `<DesignSyncProviders>`.** Several components read from Redux, TanStack
Query, React Router, or a search context — without the wrapper they throw ("must be used
inside a Provider") or silently no-op. `DesignSyncProviders` is exported on the bundle just
like any component:

```jsx
const { DesignSyncProviders, Navbar, Footer } = window.FengDeskUI;

ReactDOM.createRoot(document.getElementById('ds-root')).render(
  <DesignSyncProviders>
    <Navbar />
    {/* page content */}
    <Footer />
  </DesignSyncProviders>
);
```

`Navbar`, `WorkspaceSwitcher`, `CategoryBar`, `PopularCategories`, and `SearchBar` specifically
need this (they read auth/cart/notification state and use the router). `Calendar`, `Modal`,
`HeroSlider`, `FeatureBar`, `Footer`, `BackToTopButton`, and `ToastExample` don't depend on
it, but wrapping is always safe and is the simplest default — do it once per screen.

## Styling idiom: Tailwind v4 utility classes + CSS custom properties

There is no separate component-level styling API (no `variant`/`color` props for
appearance) — components are built with Tailwind utility classes reading this app's own
design tokens. When composing your OWN layout glue around these components (wrappers,
spacing, page grids), use the same utility classes and the same tokens so new UI matches:

| Token (CSS custom property) | Utility classes it drives | Use for |
|---|---|---|
| `--color-primary` (#7d8f69) | `bg-primary`, `text-primary`, `border-primary` | brand green — primary actions, links, active states |
| `--color-primary-dark` | `hover:bg-primary-dark`, `bg-primary-dark` | primary hover/pressed states |
| `--color-secondary` (#a68a64) | `text-secondary` | brand tan — secondary accents |
| `--color-danger` (#c62828) | `bg-danger`, `text-danger` | destructive actions, errors |
| `--radius-sm/md/lg/full` (4px/10px/15px/9999px) | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full` | cards use `rounded-lg`/`rounded-xl`, pills/avatars use `rounded-full` |
| `--font-sans` ("Inter") | default body font, no utility needed | all text |

Neutrals and grays elsewhere in the existing components mostly use Tailwind's stock gray
scale (`text-gray-500`, `border-gray-200`, `bg-gray-50`, etc.), not custom tokens — match
that convention for supporting UI rather than inventing new gray values.

## Where the truth lives

Read `styles.css` (the tokens + compiled Tailwind output) and each component's own
`components/<group>/<Name>/<Name>.prompt.md` before styling — the prompt.md has real usage
examples pulled from this app's own composition. All 12 components currently live in a single
`general` group (the source repo doesn't subdivide `src/components/ui/`).

## Example: a page header built from real components + matching glue

```jsx
const { DesignSyncProviders, Navbar, FeatureBar, Footer } = window.FengDeskUI;

function Page({ children }) {
  return (
    <DesignSyncProviders>
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-10">
        <FeatureBar />
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          {children}
        </div>
      </main>
      <Footer />
    </DesignSyncProviders>
  );
}
```
