import { describe, expect, it } from "vitest";
import { TEMPLATE_LABEL, teamPlacedEmail } from "../../lib/emails";

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
