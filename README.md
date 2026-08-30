# ICOR for Life - Diagrams

A mermaid diagram is a picture of your thinking, and pictures deserve room.
ICOR for Life - Diagrams gives every rendered mermaid block one extra affordance: a
small fullscreen button, sitting right next to the native "edit this
block" control. Click it and the diagram opens edge to edge: zoom in on
the branch you care about, pan across the whole flow, and get back to
your note with a single keypress.

One button, one job. No settings, no sidebar, no new panes.

**Beta release.** This plugin works and is in daily use in a real vault,
but you will find rough edges. If something looks off, open an issue on
this repo and it gets fixed fast.

## The viewer

- **Mouse wheel** zooms around the cursor: the point under your pointer
  stays under your pointer (0.2x to 8x)
- **Drag** to pan anywhere
- **Double-click** resets to the fitted view
- **Esc** closes the viewer
- **Touch**: one-finger pan, two-finger pinch to zoom
- **Keyboard**: `+` / `-` zoom, `0` refits, arrow keys pan; small
  zoom and reset buttons sit bottom-right
- Diagrams render in your current theme, dark and light alike

The button appears in both reading view and live preview. In live preview
it sits to the left of Obsidian's own `</>` edit button, so the two
controls read as one row: edit the source, or see it big. The `</>` toggle
is Obsidian's; this plugin adds only the fullscreen button beside it.

This plugin styles nothing and renders nothing itself. It opens the
mermaid diagram Obsidian has already drawn on the page, which is why the
viewer always matches whatever theme you are running.

## Privacy: no network use at all

ICOR for Life - Diagrams makes no network requests, has no telemetry, and stores
nothing. There is nothing to configure and no account of any kind.

## Install

Requires Obsidian 1.4.0 or newer.

Copy `main.js`, `manifest.json` and `styles.css` from the latest release
into `.obsidian/plugins/icor-for-life-diagrams/` and enable the plugin in Settings,
Community plugins. No build step: `main.js` is hand-written CommonJS.
Works on desktop and mobile.

## ICOR for Life Obsidian Edition

ICOR for Life - Diagrams is a quality-of-life surface of the **ICOR for Life
Obsidian Edition**: ICOR (Input, Control, Output, Refine), the
productivity methodology by Paperless Movement / myICOR, implemented as a
ready-to-use Obsidian vault. Best to be used in combination with:

- **[ICOR for Life - INKLINE theme](https://community.obsidian.md/themes/icor-for-life-inkline)**,
  the hand-drawn ICOR look, which styles mermaid diagrams natively in both
  its modes. INKLINE decides how a diagram looks; this viewer keeps that
  look at every zoom level.
- **[ICOR for Life - Focus](https://obsidian.md/plugins?id=icor-for-life-focus)**, the gravity
  map of your attention: today's work orbits close, older work ripples
  outward. Same instinct as this viewer, which is to see the shape of a
  thing instead of scrolling through it.
- **[ICOR for Life - Planner](https://obsidian.md/plugins?id=icor-for-life-planner)**, the weekly
  planning board: Todoist, ClickUp, starred email and Google Calendar
  synced into the vault, planned by drag and drop.
- **[ICOR for Life - Connect](https://obsidian.md/plugins?id=icor-for-life-connect)**, your
  app.myicor.com account inside the vault: the ICOR Journey courses from
  myicor.com next to your notes.
- **[ICOR for Life - Chat](https://obsidian.md/plugins?id=icor-for-life-chat)**, your AI team
  in a tab beside your notes, working from your vault's own instructions. It
  drafts the mermaid a note needs; this viewer is where you read it back at
  full size.

The complete, preconfigured experience (theme, all plugins, the seven-room
vault structure and the AI team) ships free as the **ICOR for Life**
vault: https://myicor.com

## License

Please note that while the source can be read and modified for your
personal use, this plugin is not open source. It is licensed under the
ICOR for Life Source-Available License (Code) - see the `LICENSE` file
for the full terms. Third-party notices live in `THIRD-PARTY-NOTICES.md`.
