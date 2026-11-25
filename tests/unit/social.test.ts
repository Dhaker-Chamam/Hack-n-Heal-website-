import { describe, expect, it } from "vitest";
import { normaliseFacebook } from "../../lib/social";

const url = (value: string) => ({ kind: "url", value });
const name = (value: string) => ({ kind: "name", value });

describe("normaliseFacebook: links", () => {
  it("accepts every host, with or without the scheme", () => {
    const expected = url("https://www.facebook.com/amira.benali");
    for (const input of [
      "https://www.facebook.com/amira.benali",
      "https://facebook.com/amira.benali",
      "https://m.facebook.com/amira.benali",
      "https://web.facebook.com/amira.benali",
      "https://fb.com/amira.benali",
      "http://www.facebook.com/amira.benali",
      "www.facebook.com/amira.benali",
      "facebook.com/amira.benali",
      "m.facebook.com/amira.benali",
      "web.facebook.com/amira.benali",
      "fb.com/amira.benali",
      "  FACEBOOK.COM/amira.benali  ",
    ]) {
      expect(normaliseFacebook(input), input).toEqual(expected);
    }
  });

  it("accepts profile.php with a numeric id and keeps only the id", () => {
    const expected = url("https://www.facebook.com/profile.php?id=100012345678901");
    expect(normaliseFacebook("https://www.facebook.com/profile.php?id=100012345678901")).toEqual(expected);
    expect(normaliseFacebook("m.facebook.com/profile.php?id=100012345678901&mibextid=ZbWKwL")).toEqual(expected);
    expect(normaliseFacebook("fb.com/profile.php?sk=about&id=100012345678901#top")).toEqual(expected);
  });

  it("accepts /people/<name>/<id>", () => {
    expect(normaliseFacebook("https://www.facebook.com/people/Amira-Ben-Ali/100012345678901/")).toEqual(
      url("https://www.facebook.com/people/Amira-Ben-Ali/100012345678901"),
    );
    expect(normaliseFacebook("facebook.com/people/Élodie-Martin/100012345678901?locale=fr_FR")).toEqual(
      url("https://www.facebook.com/people/%C3%89lodie-Martin/100012345678901"),
    );
  });

  it("strips tracking parameters, fragments and trailing slashes", () => {
    const expected = url("https://www.facebook.com/amira.benali");
    expect(normaliseFacebook("https://www.facebook.com/amira.benali/")).toEqual(expected);
    expect(normaliseFacebook("https://www.facebook.com/amira.benali///")).toEqual(expected);
    expect(normaliseFacebook("https://www.facebook.com/amira.benali?mibextid=LQQJ4d&fbclid=IwAR0abc")).toEqual(expected);
    expect(normaliseFacebook("https://www.facebook.com/amira.benali/?locale=fr_FR#about")).toEqual(expected);
  });

  it("gives the same result when run on its own output", () => {
    for (const input of [
      "fb.com/amira.benali/?fbclid=x",
      "m.facebook.com/profile.php?id=42&x=1",
      "facebook.com/people/Élodie-Martin/100012345678901/",
    ]) {
      const once = normaliseFacebook(input)!;
      expect(normaliseFacebook(once.value)).toEqual(once);
    }
  });

  it("rejects other hosts and look-alikes", () => {
    for (const input of [
      "https://www.instagram.com/amira.benali",
      "https://facebook.com.evil.example/amira.benali",
      "https://evil.example/facebook.com/amira.benali",
      "https://facebook.com@evil.example/amira.benali",
      "https://www.fb.com/amira.benali",
      "https://fr-fr.facebook.com/amira.benali",
      "facebook.com:8080/amira.benali",
      "ftp://facebook.com/amira.benali",
      "javascript:alert(1)",
    ]) {
      expect(normaliseFacebook(input), input).toBeNull();
    }
  });

  it("rejects Facebook links that are not one of the three profile forms", () => {
    for (const input of [
      "facebook.com",
      "https://www.facebook.com/",
      "https://www.facebook.com/?id=100012345678901",
      "https://www.facebook.com/profile.php",
      "https://www.facebook.com/profile.php?id=",
      "https://www.facebook.com/profile.php?id=abc",
      "https://www.facebook.com/profile.php?id=12%2034",
      "https://www.facebook.com/home.php",
      "https://www.facebook.com/groups/123456789",
      "https://www.facebook.com/share/1AbCdEfGh/",
      "https://www.facebook.com/people/Amira-Ben-Ali",
      "https://www.facebook.com/people/Amira-Ben-Ali/1000/photos",
      "https://www.facebook.com/people//1000",
      "https://www.facebook.com/a",
      "https://www.facebook.com/amira_benali",
      "https://www.facebook.com/amira benali",
      `https://www.facebook.com/${"a".repeat(51)}`,
    ]) {
      expect(normaliseFacebook(input), input).toBeNull();
    }
  });
});

describe("normaliseFacebook: profile names", () => {
  it("accepts letters, accents, digits, spaces, dots, hyphens and apostrophes", () => {
    for (const input of ["Amira Ben Ali", "Élodie Martin-Dupré", "Jean-François D'Arc", "Chloé O’Neil", "Dr. Yassine 2", "Zo", "محمد علي"]) {
      expect(normaliseFacebook(input), input).toEqual(name(input));
    }
  });

  it("trims and collapses spaces", () => {
    expect(normaliseFacebook("  Amira   Ben  Ali ")).toEqual(name("Amira Ben Ali"));
  });

  it("accepts 2 to 80 characters", () => {
    expect(normaliseFacebook("A")).toBeNull();
    expect(normaliseFacebook("a".repeat(80))).toEqual(name("a".repeat(80)));
    expect(normaliseFacebook("a".repeat(81))).toBeNull();
  });

  it("rejects empty input, punctuation alone and other characters", () => {
    for (const input of ["", "   ", "..", "- -", "amira@benali", "amira_benali", "Amira/Ben Ali", "Amira (INSAT)", "amira.benali?x=1", "<b>Amira</b>", "Amira 😀"]) {
      expect(normaliseFacebook(input), JSON.stringify(input)).toBeNull();
    }
  });
});
