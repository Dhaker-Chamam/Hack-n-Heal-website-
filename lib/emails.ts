import "server-only";
import { env } from "./env";
import { COMPETITIONS, type Competition } from "./constants";

/*
 * Emails: flat, brand palette, one column. No logo until the brand SVGs are
 * delivered (and the wordmark is never retyped): the event name is plain text.
 */

const C = {
  paper: "#F6F9F8",
  mist: "#E6EFEC",
  ink: "#0D1F1E",
  graphite: "#3D4E4D",
  jade: "#0A3F42",
  emerald: "#0B7A5E",
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Block = { html: string; text: string };

function p(text: string): Block {
  return {
    html: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${C.ink}">${esc(text)}</p>`,
    text: text,
  };
}

function button(label: string, href: string): Block {
  return {
    html: `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:${C.emerald};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:16px;padding:14px 22px;border-radius:2px">${esc(label)}</a></p>
<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${C.graphite}">Si le bouton ne marche pas, copie ce lien dans ton navigateur :<br><span style="word-break:break-all">${esc(href)}</span></p>`,
    text: `${label} : ${href}`,
  };
}

function facts(rows: [string, string][]): Block {
  const tr = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 16px 10px 0;border-top:1px solid ${C.mist};font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${C.graphite};white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-top:1px solid ${C.mist};font-size:16px;color:${C.ink};font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("");
  return {
    html: `<table role="presentation" style="border-collapse:collapse;width:100%;margin:8px 0 24px">${tr}</table>`,
    text: rows.map(([k, v]) => `${k} : ${v}`).join("\n"),
  };
}

function qrImage(): Block {
  return {
    html: `<p style="margin:8px 0 24px"><img src="cid:qr" width="200" height="200" alt="Ton QR code d'accueil" style="display:block;border:1px solid ${C.mist}"></p>`,
    text: "Ton QR code d'accueil est joint à cet email.",
  };
}

function layout(title: string, blocks: Block[]): { html: string; text: string } {
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:${C.paper};font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif">
<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="background:${C.jade};padding:20px 24px">
<span style="color:${C.mist};font-size:16px;font-weight:600">Hack'n'Heal 2026</span>
<span style="color:${C.mist};font-size:13px;padding-left:12px">5 et 6 décembre · INSAT, Tunis</span>
</td></tr><tr><td style="padding:32px 24px;max-width:560px">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:${C.jade};font-weight:600">${esc(title)}</h1>
${blocks.map((b) => b.html).join("\n")}
<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid ${C.mist};font-size:13px;line-height:1.5;color:${C.graphite}">Hack'n'Heal est organisé par Symbio INSAT et INSAT Android Club. Tu reçois cet email parce que tu t'es inscrit·e sur le site de l'événement.</p>
</td></tr></table></body></html>`;
  const text = `${title}\n\n${blocks.map((b) => b.text).join("\n\n")}\n\n—\nHack'n'Heal 2026 · 5 et 6 décembre · INSAT, Tunis`;
  return { html, text };
}

/** French labels for the outbox views. */
export const TEMPLATE_LABEL: Record<string, string> = {
  confirm: "Confirmation d'adresse",
  welcome: "Bienvenue et QR code",
  resend_link: "Nouveau lien personnel",
  reminder: "Rappel de confirmation",
  staff_login: "Connexion organisateur",
  teammate_joined: "Nouveau membre d'équipe",
};

export const MAIL_STATUS_LABEL: Record<string, string> = {
  queued: "En file",
  sent: "Envoyé",
  failed: "Échec",
  skipped: "Non envoyé",
};

export const link = {
  access: (token: string) => `${env.appUrl}/acces/${token}`,
  staffLogin: (token: string) => `${env.appUrl}/admin/acces/${token}`,
  resend: () => `${env.appUrl}/lien`,
};

// ------------------------------------------------------------------ templates

export function confirmEmail(firstName: string, token: string, competitions: Competition[]) {
  const list = competitions.map((c) => COMPETITIONS[c].label).join(" et ");
  return {
    subject: "Confirme ton inscription à Hack'n'Heal 2026",
    ...layout(`${firstName}, confirme ton adresse`, [
      p(`Tu t'es inscrit·e au ${list}. Clique sur le bouton pour confirmer ton adresse email et ouvrir ton espace.`),
      button("Confirmer mon inscription", link.access(token)),
      p("Sans confirmation sous 72 heures, l'inscription est supprimée automatiquement."),
    ]),
  };
}

export function welcomeEmail(
  firstName: string,
  token: string,
  teams: { competition: Competition; teamName: string | null; code: string | null; seeking: boolean }[],
) {
  const rows: [string, string][] = teams.map((t) => [
    COMPETITIONS[t.competition].short,
    t.teamName ? `${t.teamName} · code ${t.code}` : t.seeking ? "En recherche d'équipe" : "Sans équipe",
  ]);
  return {
    subject: "Inscription confirmée · ton QR code Hack'n'Heal",
    ...layout(`C'est confirmé, ${firstName}`, [
      facts(rows),
      p("Garde ce QR code : il sera scanné à l'accueil de l'INSAT les 5 et 6 décembre."),
      qrImage(),
      p("Ton lien personnel ouvre ton espace : équipe, profil, CV et dépôt du projet. Ne le partage pas, il remplace un mot de passe."),
      button("Ouvrir mon espace", link.access(token)),
    ]),
  };
}

export function resendLinkEmail(firstName: string, token: string) {
  return {
    subject: "Ton lien personnel Hack'n'Heal 2026",
    ...layout(`Voici ton lien, ${firstName}`, [
      p("Tu as demandé un nouveau lien personnel. Les anciens liens ne fonctionnent plus."),
      button("Ouvrir mon espace", link.access(token)),
      p("Si tu n'as rien demandé, ignore cet email : ton inscription reste inchangée."),
    ]),
  };
}

export function reminderEmail(firstName: string) {
  return {
    subject: "Ton inscription Hack'n'Heal n'est pas encore confirmée",
    ...layout(`${firstName}, il reste une étape`, [
      p("Ton inscription n'est pas encore confirmée. Ouvre l'email de confirmation que nous t'avons envoyé, ou demande un nouveau lien ci-dessous."),
      button("Recevoir un nouveau lien", link.resend()),
      p("Sans confirmation, l'inscription sera supprimée 72 heures après sa création."),
    ]),
  };
}

export function staffLoginEmail(name: string, token: string) {
  return {
    subject: "Connexion à l'espace organisateurs",
    ...layout(`Bonjour ${name}`, [
      p("Voici ton lien de connexion à l'espace organisateurs de Hack'n'Heal 2026. Il expire dans 20 minutes et ne sert qu'une fois."),
      button("Me connecter", link.staffLogin(token)),
    ]),
  };
}

export function teammateJoinedEmail(firstName: string, teamName: string, newcomer: string, missing: string) {
  return {
    subject: `${newcomer} a rejoint ${teamName}`,
    ...layout(`Nouvelle recrue dans ${teamName}`, [
      p(`${newcomer} vient de rejoindre ton équipe.`),
      p(missing ? `Il manque encore ${missing}.` : "Ton équipe est complète et équilibrée."),
      p(`Bonne préparation, ${firstName}.`),
    ]),
  };
}
