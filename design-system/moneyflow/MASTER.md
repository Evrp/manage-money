# MoneyFlow — Focused Finance

Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The requested skill was read and its design-system search run for this redesign.
Verified direction: “banking dashboard” matched Minimalism & Swiss Style,
IBM Plex Sans, clear hierarchy, restrained motion and accessible contrast.
Marketing landing-page suggestions were not applicable to this authenticated
finance application. React searches returned no matching guidance; implementation
uses the existing React, Tailwind and Zustand architecture.

## Product-specific decisions

- Thai-first IBM Plex Sans Thai with IBM Plex Sans; tabular amounts.
- Neutral canvas, flat surfaces, deep green balance card and restrained accents.
- Shared semantic tokens in index.css; light, dark, green and ocean palettes.
- Desktop sidebar at 1024px; five mobile destinations with profile in the top bar.
- Responsive home overview, ledger, budget grid, analytics grid, card collection,
  and identity/appearance settings columns.
- Appearance previews show actual palette tokens and store the existing local
  theme preference. No server profile update is implied.
- Preserve existing API endpoints and financial operations.
- Visible keyboard focus, semantic navigation, route focus, 44px controls,
  safe-area padding, enabled page zoom and reduced-motion support.

## Verification

Production frontend build and whitespace checks passed. The ngrok endpoint
served the updated Layout and ProfilePage modules. Visual browser QA could not
run because this session's browser tool reported no available browser.
