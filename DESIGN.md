---
name: Hack'n'Heal 2026, site de l'événement
description: Landing page, registration, teams, Agora, games, submissions and back-office for a two-day student health-tech hackathon at INSAT, Tunis.
colors:
  paper: "#F6F9F8"
  mist: "#E6EFEC"
  white: "#FFFFFF"
  ink: "#0D1F1E"
  graphite: "#3D4E4D"
  stone: "#8A9896"
  deep-jade: "#0A3F42"
  emerald: "#0B7A5E"
  luminous: "#3FBF9C"
  abyss: "#06292B"
  danger: "#B42318"
  danger-on-dark: "#F97066"
typography:
  hero:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(3.4rem, 13vw, 11.5rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 6vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  section: "112px"
components:
  button-on-dark:
    backgroundColor: "{colors.luminous}"
    textColor: "{colors.abyss}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 24px"
  button-on-dark-hover:
    backgroundColor: "{colors.mist}"
  button-primary:
    backgroundColor: "{colors.emerald}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.deep-jade}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.deep-jade}"
    rounded: "{rounded.none}"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.deep-jade}"
    textColor: "{colors.paper}"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "11px 14px"
  header-band:
    backgroundColor: "{colors.abyss}"
    textColor: "{colors.mist}"
  page-hero:
    backgroundColor: "{colors.abyss}"
    textColor: "{colors.mist}"
  footer-band:
    backgroundColor: "{colors.abyss}"
    textColor: "{colors.mist}"
---

# Design System: Hack'n'Heal 2026

## Overview

**Creative North Star: "The landing page, everywhere"**

The visual system comes from the landing page the organisers designed (`hnh/`, ported to `app/page.tsx` in French). Every other screen inherits it: an Abyss band at the top carrying the logo, huge extra-bold headlines set tight, square corners, Luminous actions on dark grounds and Emerald actions on light ones, 1px Deep Jade rules at 15%, and the logo's 30° stroke as the only ornament.

The landing page is a Persuade surface and spends its energy there: a 100svh Abyss hero with the symbol drawing itself, scroll reveals, a parallax icon, a Venn diagram, a timeline, tabs and four warm-up games in a dialog. The participant and organiser screens are Operate surfaces used on phones under deadlines: they keep the same type, colour and corners but no scroll animation, and the brand shows in the bands, the headlines and the restraint.

**Key Characteristics:**
- Flat. No gradients, shadows, gloss, blur or 3D. Depth is Paper, Mist, White, Deep Jade and Abyss.
- One typeface, Plus Jakarta Sans 400 to 800, tabular figures for codes, counts and dates.
- Square corners on everything, buttons and fields included.
- Abyss bands at the top of every page; the symbol, faded to 12–20%, sits at their edge.
- The logo is the landing page's rebuild of the guidelines' construction (`components/brand/logo.tsx`). Swap it for the delivered SVG files when they arrive.

## Colors

A cool green-teal palette; colour marks structure and action, never decoration.

### Primary
- **Luminous** (#3FBF9C): the action colour on dark grounds (Abyss text on it, 6.7:1), the tagline, the 30° strokes, the current nav item's underline, focus rings on dark. It fails on light grounds (2.2:1) and never appears there.
- **Emerald** (#0B7A5E): the action colour on light grounds (White text, 5.3:1), links on Paper or White (5.0:1), theme subtitles, the medical competition card. On Mist, links must be 16px or larger.
- **Deep Jade** (#0A3F42): headings on light grounds (11.0:1), the bioinformatics card, the "your discipline" band, the game dialog, secondary buttons.

### Neutral
- **Abyss** (#06292B): header, page heroes, the workshops band, the closing band and footer.
- **Paper** (#F6F9F8): page ground. **Mist** (#E6EFEC): the competitions and organisers bands, quiet alerts, and text on dark (13.2:1 on Abyss; at 80% opacity 8.8:1, at 70% 7.2:1).
- **White** (#FFFFFF): fields, cards, the QR panel, and the ground of every third-party logo.
- **Ink** (#0D1F1E): body text. **Graphite** (#3D4E4D): secondary text and every control border.
- **Stone** (#8A9896): small labels on Abyss only (5.2:1). It fails on every light ground.
- **Danger** (#B42318 on light, #F97066 on dark): errors only, always with an icon and words.

### Named Rules
**The Ground Decides the Action.** One filled button per step: Luminous on Abyss or Deep Jade, Emerald on Paper, Mist or White.

**The Dark-Only Rule.** Luminous and Stone only inside Abyss or Deep Jade. Text on Emerald is full-strength Paper or White (opacity drops it under 4.5:1), and focus rings on Emerald are White.

**The No Warning Colour Rule.** There is no amber. Warnings are Deep Jade text on Mist with an icon.

## Typography

**Font:** Plus Jakarta Sans (self-hosted through next/font, weights 400–800), falling back to Inter, then system-ui.

### Hierarchy
- **Hero** (800, clamp(3.4rem, 13vw, 11.5rem), 0.88, −3%): the landing page's "Hack N Heal" only.
- **Section** (700, clamp(2.2rem, 6vw, 5rem), 0.98, −2%): landing page section titles. The closing title goes to 800 and 6rem.
- **Display** (`t-display`, 800, clamp(2.5rem, 7vw, 5rem), 0.98, −2.5%): page titles in the Abyss hero band.
- **Headline** (`t-headline`, 700, clamp(2rem, 4.6vw, 3.5rem), 1.0, −2%): titles of single-task pages and the personal space.
- **Title** (`t-subhead`, 700, 1.375rem, 1.25, −1%): section headings.
- **Body** (400, 1rem, 1.6), at most 36rem wide. Intros on dark bands are 1.125rem in Mist at 80%.
- **Small** (400, 0.875rem): hints, metadata, nav items, buttons.
- **Label** (`t-label`, 500, 0.8125rem, sentence case): keys in fact lists, Graphite on light and Stone on dark. Never above a heading as a kicker.

## Layout

Content edge: `max-w-7xl` with 20px (phone) or 40px (desktop) inner padding on the landing page, `max-w-6xl` with 20px on the app pages, 80rem for the back-office, 42rem for single-task pages. Landing sections breathe at 112px vertical padding; app pages at 48–64px. Sections are separated by grounds (Paper, Mist, Abyss, Deep Jade) and 1px Deep Jade rules at 15%, not by cards. The app header's nav scrolls horizontally on phones; the landing page's section links hide below 1024px, leaving the lockup and "S'inscrire".

## Motion

framer-motion, landing page only, always under `MotionConfig reducedMotion="user"`:
- the hero symbol draws itself (brackets, then stem, then branches), then the title rises in;
- the hero symbol drifts with scroll (parallax, 120px over 600px);
- blocks rise 28px and fade in once as they enter the viewport (0.8s, ease-out-expo);
- the workshops line grows downwards; tab panels slide in 24px.

App pages use only colour transitions and the 2px button lift (`motion-safe`).

## Shapes

Every corner is square (0px), controls included. Borders are 1px. Two marks carry the brand:
- **The 30° stroke** (`components/ui/stroke.tsx`): a 20×4px bar rotated −30°, Luminous on dark and Emerald on light, used as a bullet and as the "opens on…" marker.
- **Square markers** (`components/ui/markers.tsx`): data only, for team slots and status checks.

The landing page keeps two features of its design that the generic rules would refuse: a 4px left rule on the discipline list and on the "your discipline" note, and 01–03 numbers on the themes.

## Components

- **Buttons:** 48px (40px small), square, semibold small text, lift 2px on hover. `on-dark` (Luminous, Abyss text, Mist on hover), `outline-dark` (Mist 40% border), `primary` (Emerald, Deep Jade on hover), `secondary` (Deep Jade border, fills Deep Jade on hover), `danger`, `ghost`.
- **Fields:** White, 1px Graphite border, square, 48px minimum, Deep Jade border on hover, Danger border when `aria-invalid`.
- **Header band:** Abyss; lockup at 22px; Mist 80% links that turn Luminous on hover; current page White with a 2px Luminous underline; one Luminous button ("S'inscrire", or "Mon espace" when signed in).
- **Page hero** (`components/page-hero.tsx`): Abyss, the title in Display (or Headline), Mist 80% intro, the symbol at 12% bottom right.
- **Fact list:** ruled `dl` (Deep Jade 15%), sentence-case label, semibold value.
- **Competition cards** (landing page): Emerald (medical) and Deep Jade (bioinformatics), 26rem tall, the symbol at 15% rotated in the corner, the second card offset 64px down on desktop.
- **Logo band:** White band above the footer on app pages: "Organisé par" (64px logos) and "Ils nous ont soutenus en 2022" (44px, alphabetical). On the landing page the same logos sit in the organisers section, on White tiles.
- **Footer band** (`FooterBar`): Abyss; lockup, dates and place; site links; each club's email and networks from the sponsorship dossier.
- **Game dialog:** Deep Jade panel over Abyss at 90%, Luminous for right answers, Graphite for wrong ones, closes on Escape or outside click and returns focus to the game card.
- **Tables (back-office):** Small text, 1px rules, Mist zebra rows, right-aligned tabular numbers.

## Do's and Don'ts

- **Do** check every new text pair against the contrast notes above.
- **Do** keep the word "mur" out of the interface: the online feed is "The Wall".
- **Don't** use the old identity file `assets/logos/hnh-symbol.svg` (blue chevrons, cyan circuit plant).
- **Don't** draw a badge, circle, medical cross, DNA helix or plant illustration around or beside the symbol.
- **Don't** add shadows, gradients, glass, blur or rounded corners.
- **Don't** put Luminous or Stone on a light ground, or text below full strength on Emerald.
- **Don't** put organiser or sponsor logos on a dark ground, or recolour them.
