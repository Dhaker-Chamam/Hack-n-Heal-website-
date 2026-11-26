import { describe, expect, it } from "vitest";
import { TEMPLATE_LABEL, teamPlacedEmail, wallChangesEmail, wallConfirmEmail, wallPublishedEmail, wallWinnerEmail } from "../../lib/emails";

describe("teamPlacedEmail", () => {
  it("names the team, its code and the competition, and links to the team page", () => {
    const mail = teamPlacedEmail("Amira", "Alpha", "medical", "MED-7K3Q", false, "un profil tech");
    expect(mail.subject).toBe("Tu fais partie de l'équipe Alpha");
    expect(mail.text).toContain("placé·e dans l'équipe Alpha pour le hackathon médical");
    expect(mail.text).toContain("Alpha · code MED-7K3Q");
    expect(mail.text).toContain("Ton rôle : Membre");
    expect(mail.text).toContain("Il manque encore un profil tech.");
    expect(mail.text).toMatch(/Voir mon équipe : https?:\/\/\S+\/moi\/equipe\/medical/);
    expect(mail.html).toContain("/moi/equipe/medical");
  });

  it("tells the lead, and says when the team is complete", () => {
    const mail = teamPlacedEmail("Mehdi", "Kappa", "bioinfo", "BIO-4R9T", true, "");
    expect(mail.text).toContain("Ton rôle : Chef d'équipe");
    expect(mail.text).toContain("L'équipe est complète et équilibrée.");
    expect(mail.text).toContain("/moi/equipe/bioinfo");
  });

  it("escapes names in the HTML body", () => {
    const mail = teamPlacedEmail("<b>A</b>", "R&D", "medical", "MED-7K3Q", false, "");
    expect(mail.html).not.toContain("<b>A</b>");
    expect(mail.html).toContain("R&amp;D");
  });

  it("has a label for the outbox", () => {
    expect(TEMPLATE_LABEL.team_placed).toBeTruthy();
  });
});

describe("The Wall emails", () => {
  it("links the author to the published post and says until when people can vote", () => {
    const mail = wallPublishedEmail("Amira", "6a1301b9-831f-424c-a05a-e9763c179ea3", "jeudi 3 décembre à 20:00");
    expect(mail.subject).toBe("Ton message est en ligne sur The Wall");
    expect(mail.text).toContain("/the-wall/6a1301b9-831f-424c-a05a-e9763c179ea3");
    expect(mail.text).toContain("jusqu'au jeudi 3 décembre à 20:00");
  });

  it("gives the request of the moderator and the page where the post is corrected", () => {
    const mail = wallChangesEmail("Amira", "Cite ta source <b>svp</b>");
    expect(mail.text).toContain("« Cite ta source <b>svp</b> »");
    expect(mail.html).toContain("Cite ta source &lt;b&gt;svp&lt;/b&gt;");
    expect(mail.text).toContain("/the-wall/publier");
  });

  it("tells the winner what they won and how to confirm", () => {
    const mail = wallWinnerEmail("Bilel", "6a1301b9-831f-424c-a05a-e9763c179ea3");
    expect(mail.text).toContain("3 minutes sur scène le dimanche 6 décembre");
    expect(mail.text).toContain("avant le samedi 5 décembre à 12:00");
  });

  it("asks an author who takes part in no hackathon to confirm, without mentioning a registration or a QR code", () => {
    const mail = wallConfirmEmail("Nour", "tok_0123456789");
    expect(mail.subject).toBe("Confirme ton adresse pour publier sur The Wall");
    expect(mail.text).toMatch(/Confirmer et publier : https?:\/\/\S+\/acces\/tok_0123456789/);
    expect(mail.text).not.toMatch(/QR|inscrit/i);
  });

  it("has outbox labels", () => {
    for (const key of ["wall_published", "wall_changes", "wall_winner"]) expect(TEMPLATE_LABEL[key], key).toBeTruthy();
  });
});
