import { describe, expect, it } from "vitest";
import {
  COUNTED_PER_DEVICE_POST_DAY,
  COUNTED_PER_IP_POST_HOUR,
  authorLabel,
  likeStatus,
  linkDomain,
  textLength,
  wallWarnings,
} from "../../lib/wall";

describe("authorLabel", () => {
  it("shows the first name, the initial of the last name and the school", () => {
    expect(authorLabel("Amira", "Ben Ali", "INSAT")).toBe("Amira B. · INSAT");
    expect(authorLabel(" Élodie ", "élouan", "Faculté de Médecine de Tunis (FMT)")).toBe("Élodie É. · Faculté de Médecine de Tunis (FMT)");
  });

  it("never shows more of the last name than its initial", () => {
    expect(authorLabel("Amira", "Ben Ali", "INSAT")).not.toContain("Ben");
    expect(authorLabel("Amira", "", "INSAT")).toBe("Amira · INSAT");
  });
});

describe("linkDomain", () => {
  it("keeps only the domain", () => {
    expect(linkDomain("https://www.github.com/amira/projet?tab=readme")).toBe("github.com");
    expect(linkDomain("https://docs.google.com/document/d/abc")).toBe("docs.google.com");
    expect(linkDomain("pas une url")).toBe("lien");
  });
});

describe("textLength", () => {
  it("counts characters like the database, emoji included", () => {
    expect(textLength("abc")).toBe(3);
    expect(textLength("😀😀")).toBe(2);
    expect("😀😀".length).toBe(4);
  });
});

describe("wallWarnings", () => {
  it("finds nothing in an ordinary message", () => {
    expect(wallWarnings("Un modèle qui prédit la glycémie à 2 heures à partir de 14 jours de données ouvertes.")).toEqual([]);
    expect(wallWarnings("Le patient diabétique de type 1 mesure sa glycémie 6 fois par jour, en 2026.")).toEqual([]);
    expect(wallWarnings("Patients et soignants gagneraient 30 minutes.")).toEqual([]);
  });

  it("spots an email address", () => {
    expect(wallWarnings("Écris-moi : amira.benali@example.org")).toEqual(["une adresse email"]);
  });

  it("spots phone numbers, spaced or with the country code", () => {
    for (const text of ["Appelle le 20 123 456.", "WhatsApp +216 20 123 456", "tel 0021620123456", "20.123.456", "20-123-456"]) {
      expect(wallWarnings(text), text).toEqual(["un numéro de téléphone"]);
    }
  });

  it("spots an 8-digit number that could be a phone or an identity card", () => {
    expect(wallWarnings("CIN 09876543")).toEqual(["un numéro à 8 chiffres (téléphone ou carte d'identité)"]);
    expect(wallWarnings("Référence 123456789012")).toEqual([]);
    expect(wallWarnings("En 2026, 1 200 000 personnes")).toEqual([]);
  });

  it("spots a patient named in the text", () => {
    expect(wallWarnings("Nous avons suivi le patient Mohamed pendant un an.")).toEqual(["le nom d'un patient"]);
    expect(wallWarnings("La patiente Mme Trabelsi a accepté.")).toEqual(["le nom d'un patient"]);
    expect(wallWarnings("Patient Karim, 54 ans")).toEqual(["le nom d'un patient"]);
  });

  it("lists everything it finds", () => {
    expect(wallWarnings("Le patient Karim, joignable au 20 123 456 ou karim@example.org")).toEqual([
      "une adresse email",
      "un numéro de téléphone",
      "le nom d'un patient",
    ]);
  });
});

describe("likeStatus", () => {
  it("counts a like while the network and the device stay under their limits on that post", () => {
    expect(likeStatus(0, 0)).toBe("counted");
    expect(likeStatus(COUNTED_PER_IP_POST_HOUR - 1, COUNTED_PER_DEVICE_POST_DAY - 1)).toBe("counted");
  });

  it("holds the like once either limit is reached", () => {
    expect(likeStatus(COUNTED_PER_IP_POST_HOUR, 0)).toBe("held");
    expect(likeStatus(0, COUNTED_PER_DEVICE_POST_DAY)).toBe("held");
    expect(likeStatus(40, 12)).toBe("held");
  });
});
