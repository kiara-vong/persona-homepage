# Persona Homepage, a public recreation

A working recreation of a customisable, persona-based homepage: the page opens as
one of two defaults depending on what you are responsible for, and everything on
it can be rearranged, resized, stacked, swapped, saved and undone.

**Everything here is mock data.** The accounts, divisions, teams, jobs, notices
and figures are invented placeholders. This is a rebuild of the interaction model,
not a copy of anything internal, and nothing in it came out of a real system.

## Run it

No build step. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## What is in it

**Two personas.** Contributor, the default, is scoped to one account. Leader is
scoped to a division. Switch from the person control in the toolbar; each has its
own default layout. Switching with unsaved edits prompts you to name what you have
first rather than discarding it silently.

**Two-dimension scope.** The page reads its persona from account and division, and
nothing else. An earlier draft had a third application selector, but an account
already implies the application that owns it, so the third control could only ever
agree with the second: a control with no state of its own is a control to delete.

**Per-widget scope.** Every widget declares which dimensions it accepts, and the
effective scope resolves widget, then page, then default. A divisional rollup on a
page scoped to one account cannot use that scope, so it falls back to its own
dimension and says so on the card rather than showing numbers for a scope nobody
asked for. Any widget can also be pinned a level below the page from its menu,
which is how two cards on one page look at different subsets.

**Onboarding.** On a first visit the page shows what it detected, account and
division, with where each came from, and lets you change any of it before a single
preference is written. Nothing is applied to your layout until you confirm, and the
persona follows what you confirmed rather than a job title: adding a division in
the dialog is what makes you a Leader. A
five-step tour then walks the toolbar, the scope chips, edit mode, the catalog and
the save control, dimming the page and cutting a hole around whatever it is
talking about.

**Edit mode.** *Edit layout* adds a grip to every widget and an action menu on
each: expand, replace, delete, move, merge with the next stack, unstack, and three
sizes. Nothing else about the page changes, so the page you were reading is the
page you are rearranging. Drag a grip to reorder.

**Resize by dragging.** Every card in edit mode carries three handles. The right
edge snaps the card to the nearest of the three column widths, the bottom edge
sets its height, and the corner does both.

**Undo.** Every layout change pushes the previous arrangement onto a history
stack. Cmd/Ctrl+Z steps back through it, and the toast names what it undid.

**Stacked widgets.** More than one widget can share a cell behind numbered tabs,
which is how a column holds more than it has room for.

**The catalog.** *Add widget* opens a drawer with twenty-five widgets under six
headings and a search field. Widgets already in your layout are marked. Every one
of them is something that already exists elsewhere in the product, because a first
release that also invents widgets cannot tell you whether people disliked the
customisation or the new content.

**Templates and presets.** The product curates a small set of layouts per persona,
and you can save your own under a name. Both load from the same list, which is
what keeps a template from being a special case. The first change you make creates
"My Contributor view" for you, so what you are editing has somewhere to live before
you think to ask for it.

**Streaming load.** The page paints its skeleton first and fills the cards in
after, because a homepage that waits for its slowest widget reads as broken even
when it is not.

**Persistence.** The layout, the persona and any named presets are kept in
`localStorage` under a `{schemaVersion, data}` envelope, so a stored layout written
by an older shape is discarded rather than half-read; a page that comes up almost
right is worse than one that comes up fresh. A refresh finds the page as you left
it. The real thing keeps
them server-side, keyed by user, so they follow you between devices; local storage
is the offline cache underneath that.

## Layout of the code

| file | what it holds |
|---|---|
| `index.html` | the shell: rail, header, scope bar, grid, drawer, modals, tour |
| `styles.css` | all of the styling, one file, custom properties at the top |
| `data.js` | the widget catalog, the two presets, the templates, every mock figure |
| `app.js` | render, edit mode, drag, resize, undo, menus, drawer, tour, persistence |

The state is one small object and every change re-renders the whole grid. At this
size a partial update would buy nothing and cost a class of bug.

## Not in this build

Real data, entitlements, server-side preferences, URL sharing, user-authored
templates, and the finer five-persona split. Those are described in the case study
rather than implemented here.
