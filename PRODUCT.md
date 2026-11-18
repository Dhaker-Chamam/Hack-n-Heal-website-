# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated ("you will build this", 16 Nov 2026): Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase Postgres (schema `hnh`, accessed server-side with postgres.js) and Supabase Storage for CVs, Nodemailer over the club mailbox's SMTP, hosted on Vercel. Chosen because a single builder has under 3 weeks and the data (teams, jury scores, check-ins) needs relational constraints and server-time deadlines.

## Users

- **Participants**: 300+ students, mostly French-speaking Tunisians (medicine, pharmacy, biology, bioinformatics, computer science, data/AI). They register on their phones, often from a WhatsApp link, and come back to the site through a personal link sent by email. They have no account and no password.
- **Organizers** (Symbio INSAT and INSAT Android Club): they validate registrations, build teams, moderate the Agora, run check-in at the INSAT entrance on 5 and 6 December, and export badge and certificate data.
- **Jurors** (including a seat for the Official Partner): they score medical pitches on their phones on Sunday 6 December.
- **Visitors**: friends and the public. They read the Agora, like posts and play the mini-games.

## Product Purpose

The event web app for Hack'n'Heal 2026 (5–6 Dec 2026, INSAT Tunis), a student health-tech hackathon on cancer and autoimmune diseases (mainly diabetes). It handles:
- registration and team formation for two competitions;
- check-in;
- the Agora (a public idea feed, where the most-liked author wins a speaking slot);
- themed mini-games;
- medical project submission and jury scoring.

Success means:
- every participant is in a mixed health and tech team before the locks;
- no deadline is missed or disputed;
- check-in runs smoothly;
- organizers export clean badge and certificate data on the first try.

## Positioning

The two competitions run on two rhythms: a one-week remote medical challenge, and a 12-hour on-site bioinformatics sprint hosted on Kaggle. Teams must be mixed (health + tech). The app enforces both of these: per-competition windows, team composition rules, and server-side deadlines.

## Operating Context

Key dates (Africa/Tunis):

| When | What |
|---|---|
| Thu 26 Nov 23:59 | Medical registration closes |
| Fri 27 Nov 23:59 | Medical teams lock |
| Sat 28 Nov 10:00 | Medical challenge published, publicly |
| Wed 2 Dec 23:59 | Bioinformatics registration closes |
| Thu 3 Dec 20:00 | Agora voting closes |
| Thu 3 Dec 23:59 | Medical submission deadline (a 5-minute video link) |
| Sat 5 Dec | Bioinformatics launch on Kaggle, 12 h non-stop |
| Sun 6 Dec | Medical pitches to the jury at INSAT, awards |

- Organizers use phones as QR scanners at the entrance. The INSAT Wi-Fi can saturate.
- The landing page is part of the site, at `/`. The organisers designed it in English (`hnh/`, kept as the reference); it was ported in French on 18 Nov 2026 and sets the visual system for every page.
- The physical "mur des sponsors" at the venue is unrelated to the online feed. The feed is called "l'Agora", and the word "mur" never appears in the site's interface.

## Capabilities and Constraints

- Unlimited places, free.
- One person can enter both competitions, with a separate team in each.
- Team rules:
  - Medical: 4–7 members, at least one health and one tech profile.
  - Bioinformatics: 2–4 members, same mix. Bioinformatics profiles count as both.
- No participant accounts. Each person has a personal link (token, stored hashed) and a signed QR code.
- Only staff log in, by emailed link.
- Agora:
  - Only confirmed participants post, and posts are pre-moderated.
  - Anyone can like without an account: one like per post per browser, with layered anti-fraud and organizers confirming the winner.
  - No images, so patient data can't be exposed.
- Bioinformatics is submitted and scored on Kaggle. The site only maps teams and reveals the link.
- Sponsor commitments:
  - Silver and above get their logo on badges and certificates, and their internship offers relayed (opt-in).
  - The Official Partner gets the CVs of people who explicitly opt in.
  - Sponsor-facing portals are out of scope, but the data model must leave room for them.
- Law: Tunisian Loi organique n° 2004-63.
  - Symbio INSAT is the data controller.
  - No health data, date of birth or national ID is collected.
  - Consent events are recorded.
  - The INPDP filing, including the transfer abroad (EU hosting), is the organizers' job.
- Language: French only.

## Brand Commitments

From the Visual Identity Guidelines v1.0 (Nov 2026, Mohammed W. Hammami) and the 2026 sponsorship dossier, both binding:

- **Typeface:** Plus Jakarta Sans only, falling back to Inter, then system-ui.
- **Palette:**

  | Name | Hex | Role |
  |---|---|---|
  | Clinical Emerald | #0B7A5E | Primary |
  | Deep Jade | #0A3F42 | Secondary |
  | Luminous Jade | #3FBF9C | On dark backgrounds only |
  | Abyss | #06292B | Dark background |
  | Ink | #0D1F1E | Text |
  | Graphite | #3D4E4D | Secondary text |
  | Stone | #8A9896 | Captions |
  | Mist | #E6EFEC | Surfaces |
  | Paper | #F6F9F8 | Page background |

  Balance: Paper and Mist 62%, Deep Jade 22%, Emerald 12%, Luminous 4%.
- **Style:** flat. No gradients, drop shadows, gloss or 3D, no badge or circle around the logo, no medical crosses, DNA helices or decorative plant illustrations, in the UI and in game art alike.
- **Logo:** use only the supplied SVG files, never retype the wordmark, respect the clear space and minimum sizes (icon 16 px, horizontal lockup 112 px), and use the icon as the favicon.
  - The 8 SVGs have not been delivered yet. Since 18 Nov 2026 the site uses the landing page's rebuild of the symbol and lockup from the guidelines' construction (`components/brand/logo.tsx`, `app/icon.svg`), to be replaced by the delivered files.
  - `hacknheal-2026/assets/logos/hnh-symbol.svg` is the OLD identity and must never be used.
- **Event name in body text:** "Hack'n'Heal".

## Evidence on Hand

- `HacknHeal_2026_Dossier_Sponsoring.pdf`: format, schedule, theme figures (GLOBOCAN 2022: ~20 million new cancer cases; IDF Atlas 2024: 1.4 million adults with diabetes in Tunisia), organizers, packs.
- `hack-n-heal-visual-identity (1) (1).pdf`: the brand rules above.
- Absent:
  - the 8 brand SVG files;
  - the sponsor list for 2026;
  - the medical challenge text;
  - the Kaggle URL.

  Never fabricate sponsors, prizes or participant counts.

## Product Principles

1. The deadline is the server's: every window is enforced in the database, and countdowns are only for display.
2. Mixed teams or nothing: the interface always shows which profile a team is missing.
3. No account, no password: the email link is the key, and losing it is a one-step recovery.
4. Health content stays safe: no patient data, no unsourced medical claims, moderation before publication.
5. Collect the minimum, record every consent, delete on schedule.

## Accessibility & Inclusion

WCAG 2.1 AA. All colour pairs were measured:
- Stone fails on every light background (2.8:1) and is used only on Abyss.
- Luminous fails on light backgrounds (2.2:1) and is used only on dark ones.

Mobile-first: participants register on phones, and volunteers scan at the door.
