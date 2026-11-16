# PulseMind

A custom English landing page built with React, TypeScript, and Vite. The visual identity pairs crimson and warm white, oversized Manrope typography, a custom glass-lung sculpture, and a gently animated signal field.

## Run

```sh
npm install
npm run dev
```

Open the local address printed by Vite (normally http://localhost:5173).

```sh
npm run build   # TypeScript validation and production build
npm run preview # Serve the production build
npm test        # Browser interaction, responsive layout, and accessibility checks
```

Use Node 22.12+ or a newer supported version. Tests use installed Google Chrome on macOS; otherwise install Playwright Chromium with `npx playwright install chromium`.

## Included interactions

- Responsive navigation and section links.
- Subtle pointer movement and breathing animation on the hero artwork.
- Animated canvas visualization, paused outside the viewport and respectful of reduced-motion preferences.
- Three-stage product demonstration: searchable unit overview, patient review, and source detail.
- Synthetic patient states, missing-data display, chart time ranges, and reversible local review state.
- Keyboard-operable tabs, FAQ accordion, native modal dialogs, and focus restoration.
- Research dialog with an [English brief](./public/research-brief.md).
- Contact form that prepares a `mailto:` draft for review in the visitor’s email application. It does not send messages, store submissions, or require a backend.

## Content and publication

All survey figures use the updated analysis: **36 respondents**, **4.25 of 6 information-source groups**, and **28/36 (77.8%) conditional usefulness**. The earlier report informs product scope and development stage, not survey numbers. These are exploratory findings, not proof of clinical performance.

The interactive preview was built for this landing page and uses synthetic examples. It is not the original PulseMind dashboard, a functioning predictive model, or a live clinical system. Patient review state lasts only while the page is open.

The contact email comes from the supplied project report. Confirm that public contact address before production publication. Original project documents are not bundled. No analytics, trackers, external runtime fonts, or remote image dependencies are included.

See [design notes](./docs/design-notes.md) for references and [artwork provenance](./docs/artwork.md) for the image prompt. Production output is generated in `dist/`; the site has not been deployed to a public host.
