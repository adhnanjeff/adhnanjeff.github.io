# MyFolio — Engineer Mode / Story Mode

A personal portfolio with a signature entry moment: visitors pick one of **two
ways of knowing Adhnan** — **Engineer Mode** (a real, fullscreen terminal) or
**Story Mode** (a warm editorial site). Both are skins over one shared content
model, narrated by a custom mascot named **Byte**, with light gamification and
visitor memory (localStorage). Built to the `Portfolio Build Spec`.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19**
- **Tailwind CSS v4** (CSS-first `@theme`)
- **Motion 12** (`motion/react`)
- **TypeScript**, self-hosted fonts via `next/font` (Geist, Geist Mono, Fraunces)
- Persistence: **cookie** (mode, read before paint → no flash) + **localStorage** (memory)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Node **20+** required.

## Where things live

| Path | What |
|---|---|
| `content/content.ts` | **Single source of truth** — profile, projects, skills (with proficiency), experience, responsibilities, certs, links. Edit here. |
| `content/systems.ts` | Typed nodes/edges for the system diagrams (overview + per-project architectures). |
| `components/diagram/` | Reusable, theme-aware `SystemDiagram` + `KnowledgeGraph` (used by both modes). |
| `lib/mode.ts` | `Mode` type, cookie helpers, default mode. |
| `lib/memory.ts` | Visitor memory + mission/completion logic. |
| `lib/motion.ts` | Shared Motion variants + easing. |
| `components/entry/` | Entry gate, mode provider/switcher, app shell. |
| `components/byte/` | Byte — greetings, ASCII render, illustrated render. |
| `components/terminal/` | Engineer Mode — terminal, commands, boot, diagram, mission. |
| `components/story/` | Story Mode — hero, project sections, editorial home. |
| `public/Resume.pdf` | The résumé unlocked at mission complete. |

### Editing content

Almost everything a recruiter reads comes from `content/content.ts`. Each
project carries **both** `descEngineer` (stack/architecture) and `descStory`
(plain-language impact) so both modes narrate from one record — never fork
content. Add/remove projects there and both modes update.

### Byte (mascot)

`Byte` is a placeholder — an ASCII face in the terminal (`ByteAscii.tsx`) and a
simple SVG character in Story Mode (`ByteIllustrated.tsx`). Both are intended to
be revised into final art later; his voice/greetings live in
`components/byte/greetings.ts`.

## Terminal commands

`help` · `whoami` · `builds` (then a number or `open <n>`) · `arsenal` ·
`graph` (or `arsenal --graph` — the skills knowledge graph) · `timeline`
(experience + positions of responsibility) · `certs` ·
`ping` (`ping --email` reveals email) · `architecture [overview|vehicle-security|notification-system]`
(the animated system diagrams) · `story` (switch mode) · `clear`. Plus a few
easter eggs (`coffee`, `sudo`, `byte`, …).

**Diagrams in both modes.** Engineer Mode opens `SystemDiagram` /
`KnowledgeGraph` as fullscreen terminal overlays (via commands/chips or the
"view architecture" action on a project). Story Mode opens the same components
in an editorial (light) variant via the "View architecture" / "View as
knowledge graph" buttons. Projects with a diagram carry `hasArchitecture: true`
in `content.ts`; add a matching entry to `systems.ts` to give any project its own.

## Deploy

Deploy to Vercel (framework auto-detected). No env vars or backend required —
all memory is client-side.
