---
version: 1
slug: "app-inscription-page-tsx"
primary_target: "app/inscription/page.tsx"
related_targets: ["app/moi/page.tsx","app/agora/page.tsx","app/admin"]
---

## Scope
Participant-facing app surfaces of Hack'n'Heal 2026 (registration, /moi, team page, Agora, games, challenge, submission) plus the organizer back-office. Mode: Operate (Agora and games lean Experience within the same world). Code-led: no image generation available.

## Audience, job, constraints
French-speaking students on phones register in mixed teams before server-enforced deadlines; organizers run teams, moderation, check-in and exports. Brand guidelines v1.0 pin palette, type and flat style; see PRODUCT.md.

## Direction contract
THESIS (revised 18 Nov 2026): the app inherits the organisers' landing page (app/page.tsx): Abyss bands at the top, extra-bold tight headlines, square corners, Luminous actions on dark and Emerald on light, the symbol faded at the band's edge, the 30° stroke as the only ornament. See DESIGN.md.
OWN-WORLD: Paper ground, Abyss header and page heroes, Mist and Deep Jade bands, 1px Deep Jade rules at 15%, square ■□ markers for team slots and checks, Plus Jakarta Sans 400–800, tabular figures for codes and counts.
STORY: A student sees both competitions as two solid blocks (Deep Jade 1 semaine, Emerald 12 heures), picks one or both, gets a team code they can paste into WhatsApp, and always knows what their team is missing and what deadline is next.
FIRST VIEWPORT: Abyss header with the lockup and a Luminous "S'inscrire". Abyss hero with "S'inscrire à Hack'n'Heal 2026" in Display, date in Luminous, place and "gratuit". Below, the stepper and the two competition blocks; a ruled facts column on desktop lists the next deadlines. Primary action: Continuer, Emerald.
FINISH: reviewed on 18 Nov 2026 at 1440 and 390 px (.impeccable/review/d-inscription.png, m-*.png).

## Signature interaction
Team slots as square markers (■■■□□□□ for 3 of 7) with live health/tech checks; copyable team code with a WhatsApp share.

## Unresolved
Official logo SVGs pending (the landing page's rebuild is in place until then). Sponsor list pending.
