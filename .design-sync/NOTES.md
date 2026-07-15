# design-sync notes for fengshuigarden-web

## Repo shape

This repo is a full Vite app, not a component-library package — no `main`/`module`/`exports`
in `package.json`, no `dist/` library build. The converter runs in synth-entry mode
directly against `src/components/ui`.

`src/components/ui` itself is a mix: some genuinely reusable/self-contained components
(BackToTopButton, Calendar, Modal, HeroSlider, FeatureBar, Footer, FooterManager,
ToastExample) and some full page sections wired to Redux/live APIs/routing
(Navbar, CategoryBar, PopularCategories, WorkspaceSwitcher, Search). The user chose to
sync all of them, accepting mocked data for the app-coupled ones rather than excluding them.
`Button.tsx`, `PopUp.tsx`, `3DSection.tsx` are empty files (0 bytes) — nothing to sync,
excluded automatically since they have no exports.

## PKG_DIR workaround (junction)

The converter expects `node_modules/<cfg.pkg>` to exist (a published-package assumption).
Since this repo isn't installed as a dependency of itself, `node_modules/fengshuigarden-web`
is a Windows directory **junction** pointing back at the repo root:
`New-Item -ItemType Junction -Path node_modules\fengshuigarden-web -Target .`
Recreate this on a fresh clone (junctions aren't committed — `node_modules/` is gitignored
wholesale). Same for `.design-sync/node_modules` → `.ds-sync/node_modules` (needed so the
`source-kit.mjs` fork can resolve its `ts-morph` import).

## Forked lib: `.design-sync/overrides/source-kit.mjs`

The stock synth-entry writer emits `export * from <path>` for every file. `export *` never
forwards a module's **default** export, and every component in `src/components/ui` is
`export default function Name()` — so none of them would have reached
`window.FengDeskUI.*` in the real functional bundle, even though `deriveComponentsFromSrc`
correctly _discovers_ their names. The fork adds `export { default as Name } from <path>`
alongside the original `export *` line whenever a file's default-exported declaration name
can be determined via regex. Declared in `cfg.libOverrides`.

## tsconfig alias overrides (`.design-sync/tsconfig.dssync.json`)

`tsconfigPathsPlugin` (in `lib/bundle.mjs`, not forked — it's part of the output contract)
resolves `@/*` path aliases by checking `existsSync(stem + ext)` for `ext` in
`['', '.ts', '.tsx', ...]`, **checking the bare/extensionless candidate first**. Several
`@/` imports in the real transitive component graph point at directories that have BOTH a
same-named file and an `index.ts` barrel (`src/app/store.ts` + `src/app/store/`), or are
barrel-only directories (`@/features/cart`, `@/features/category`, `@/features/chatbox`,
`@/features/manager/components`, `@/features/notification`, `@/features/orders`,
`@/features/payment`, `@/features/products`, `@/features/review`, `@/features/search`,
`@/utils`, `@/constants`) — the bare directory path exists too, so esbuild tries to read a
directory as a file and fails ("Incorrect function" on Windows). Fixed with explicit
non-wildcard `paths` entries pointing straight at the real file (checked before the generic
`@/*` wildcard, since `Object.entries` preserves JSON key order and the plugin takes the
first match). If a NEW component pulls in another barrel-style `@/` import not in this list,
the build will fail the same way — add the missing entry rather than re-diagnosing from
scratch.

`@/lib/axios` is also aliased — see below.

## API/data mocking (`.design-sync/mocks/`)

- `axios-stub.ts`: replaces `@/lib/axios` (the shared `fetchHttpClient`) for the sync build
  only. `CategoryBar`/`PopularCategories` call `getCategoriesRequest()` unconditionally on
  mount; without a real backend that would hang/error every preview. The stub returns canned
  demo categories for `/categories` and a generic empty-success shape for everything else, so
  any other endpoint hit transitively (cart, notifications, shop) resolves harmlessly instead
  of failing.
- `DesignSyncProviders.tsx`: wraps every preview in Redux (`Provider` around the REAL
  `@/app/store`, not a reimplementation), TanStack `QueryClientProvider`, `BrowserRouter`, and
  `SearchProvider` — required by `Navbar`, `WorkspaceSwitcher`, `CategoryBar`,
  `PopularCategories`, `SearchBar`. Wired via `cfg.provider` + `extraEntries`. The file is
  named to match its `DesignSyncProviders` export on purpose — see the `storyImports.shim`
  note below for why that matters.
  - Also exports `createStoryStore(preloadedState)` / `<StoryStoreProvider preloadedState=…>`:
    a FRESH, isolated Redux store (same 6 reducers as the real `@/app/store`, but not the
    same instance) for previews whose look depends on auth/cart/notification state (Navbar,
    WorkspaceSwitcher). Grid view mounts every story in one page, so dispatching into the
    shared global `store` would leak state between cells — nest `<StoryStoreProvider>` inside
    a story to shadow the outer store for just that story's subtree. See
    `.design-sync/previews/Navbar.tsx` for the pattern (LoggedIn/LoggedOut).
- `NotificationDropdown`'s `useUnreadCount` polls every 60s even with the stub — harmless
  (resolves against the stub), but worth knowing if a preview looks like it's "doing
  something" during a long review session.

## `cfg.storyImports.shim` override (required)

Preview `.tsx` files import the real component via `@/components/ui/<Name>` (or a relative
path to `.design-sync/mocks/DesignSyncProviders`), which esbuild resolves through the
`node_modules/fengshuigarden-web` junction — so the resolved path string always contains the
literal substring `/node_modules/`. `lib/story-imports.mjs`'s import policy has a blanket
`if (p.includes('/node_modules/')) return r; // third-party stays put` rule that fires BEFORE
the exported-component shim check, so without an override every preview would get the real
component's SOURCE re-bundled fresh (a second module instance, breaking Redux/Router context
identity with the outer `cfg.provider` wrap — symptom: `useNavigate()`/`useSelector` throwing
"must be used inside a Provider" even though `cfg.provider` is correctly configured).
`cfg.storyImports.shim` is a documented, forkless override — checked BEFORE the node_modules
rule — so `.design-sync/config.json` sets:

```json
"storyImports": { "shim": ["/fengshuigarden-web/src/", "/fengshuigarden-web/.design-sync/mocks/"] }
```

This is safe here because every preview only ever imports TOP-LEVEL exported components
(never internal utility/slice files directly) — once the top-level import shims, esbuild
never resolves that module's internals at all, so there's no risk of e.g. `authSlice.ts`
getting wrongly shimmed to the whole `window.FengDeskUI` object. If a future preview imports
something under `src/` that ISN'T an exported component, check this doesn't over-shim it.

**Two sharp edges this substring-based shim creates, both worked around at the preview-file
level (no config/lib changes) — same underlying cause: `exportedComponentFor` keys off the
resolved file's BASENAME, and `shimResult(null)` collapses every unmatched-name import onto
one shared synthetic module:**

1. **Default-importing a component whose file name != its declared export name breaks.**
   `src/components/ui/Search.tsx` exports `SearchBar` from a file named `Search.tsx` — a
   default import (`import SearchBar from "@/components/ui/Search"`) resolves to basename
   "Search" (not a registered component name), falls to the null-name shim, and yields the
   WHOLE `window.FengDeskUI` namespace object instead of the component — React throws
   "Element type is invalid ... but got: object", capture sheet blank. **Fix: use a named
   import instead** — `import { SearchBar } from "@/components/ui/Search"`. The shim's
   `export * from "__ds_raw__"` line forwards every `window.FengDeskUI` key as a named
   export regardless of the broken `default` computation, so `{ SearchBar }` resolves
   correctly even though the default doesn't. Any other component whose file-basename
   differs from its declared default-export name will hit this same bug — same fix.
2. **`@/`-aliased asset imports (images, json) collide with the same shim rule as component
   imports.** Since `@/*` resolves through the `node_modules/fengshuigarden-web` junction,
   an `@/assets/foo.png` import ALSO matches the `storyImports.shim` substring and gets
   funneled through `exportedComponentFor` (which obviously finds no component named "foo"),
   falling to the SAME shared null-name shim as case 1 — and because `shimResult(null)`
   always returns the same synthetic module regardless of which file triggered it, TWO
   DIFFERENT images imported this way both resolve to the identical (broken) value. HeroSlider
   hit this: two hero images both rendered the same corrupted placeholder. **Fix: import repo
   assets via a RELATIVE path instead of `@/`** — e.g. `import hero from
"../../src/assets/hero.png"` from `.design-sync/previews/HeroSlider.tsx`. A relative
   import resolves directly against the preview file's own location, never touches the
   junction, and falls through to esbuild's normal `.png → dataurl` loader. Prefer relative
   imports for any non-component asset a future preview needs.

(A proper fix would teach `exportedComponentFor` to also check the regex-detected declared
default-export name — same regex `overrides/source-kit.mjs` already uses — and/or exclude
asset extensions from the shim substring match before it runs. Both require forking
`story-imports.mjs` + a `cfg.libOverrides` entry; not done — the story-level workarounds
above are sufficient and lower-risk.)

## Known render warns / limitations

- **`FooterManager` has no preview card.** The converter's `isComponentName` heuristic
  (`lib/dts.mjs`) treats any name ending in `Manager` as a non-renderable "utility singleton"
  (e.g. `ToastManager`), which is a false positive here — `FooterManager` is a real,
  standalone footer variant for the manager/admin layout. It's still correctly present in
  the actual functional bundle (`window.FengDeskUI.FooterManager` — confirmed via esbuild's
  own export-evidence scan), just without an auto-generated `.html`/`.d.ts`/`.prompt.md`.
  Not forked (would require changing a shared heuristic used across every repo this skill
  touches, for one edge case) — accepted as a minor, non-blocking gap.
- All 12 previewed components land in a single "general" group — every file sits flat in
  `src/components/ui/` with no subdirectories, so the converter's dir-derived grouping has
  nothing to key off. Cosmetic; can be split later via `docsDir`/`docsMap` category
  frontmatter if wanted.
- **`package-capture.mjs`'s grading sheets are blank for any preview whose final visible
  state depends on a POST-MOUNT effect (CSS-in-JS animation, a timer, a dispatched DOM
  event) — diagnosed, not a component or preview defect.** Root cause: `package-capture.mjs`
  installs `page.clock.setFixedTime(...)` (for deterministic timestamps) and then navigates
  the SAME page twice per component (once bare to read `window.__dsCells`, once per cell to
  `?story=<Name>`). Under that combination, the second navigation's `requestAnimationFrame`
  callbacks stop advancing relative to a real elapsed-time basis, so anything that needs a
  frame or two after mount to reach its final state (framer-motion's `AnimatePresence` spring
  in `Modal`, the scroll-triggered `useEffect` in `BackToTopButton`) is stuck at its initial,
  often-invisible frame when the screenshot is taken. `package-validate.mjs`'s render-check
  screenshots (single navigation, no fake clock, `fullPage: true`) do NOT have this problem —
  confirmed by diffing the two mechanically: `git-blind` A/B test with a throwaway script that
  reproduced the bug only when BOTH "fake clock" AND "two navigations to the same path" were
  present together (neither alone triggers it). `package-capture.mjs` is not part of `lib/` —
  it has no `loadLib` override seam, so this can't be forked; it's accepted and documented.
  **Affected so far:** `Modal` (all 3 cells), `BackToTopButton` (`Visible`). Both graded
  `good` in `.design-sync/.cache/review/<Name>.grade.json` with a note citing this section and
  independent verification (the render-check screenshot, or for Modal's non-primary stories, a
  one-off single-navigation Playwright script). **If a NEW preview shows a blank capture
  sheet**, check `ds-bundle/_screenshots/general__<Name>.png` (the render-check screenshot,
  `fullPage`) first before assuming the preview itself is broken — if THAT one looks right,
  it's this same harness issue, not a real defect.

## Re-sync risks

- The mock provider module (`design-sync-providers.tsx`) imports the REAL `@/app/store` and
  `@/features/search`'s `SearchProvider` — if either module's export shape changes upstream
  (e.g. `store` renamed, `SearchProvider` moved), the provider wrapper will fail to compile
  and every preview needing context will drop to the floor card. Re-verify on re-sync if
  those files change.
- The tsconfig alias-override list above is NOT automatically kept in sync with the app's
  import graph — a new barrel-style `@/` import anywhere in the transitive dependency graph
  of a synced component will need a new entry.
- The axios stub's canned category data is hand-written demo content, not derived from a
  real API contract beyond the `Category`/`ApiResponse` type shapes — cosmetic drift only.
