export type Competition = "medical" | "bioinfo";
export type ProfileKind = "health" | "tech" | "both" | "other";

export const COMPETITIONS: Record<
  Competition,
  { label: string; short: string; rhythm: string; min: number; max: number; codePrefix: string; regWindow: string; teamWindow: string; profiles: string }
> = {
  medical: {
    label: "Hackathon médical",
    short: "Médical",
    rhythm: "1 semaine",
    min: 4,
    max: 7,
    codePrefix: "MED",
    regWindow: "reg_medical",
    teamWindow: "teams_medical",
    profiles: "Médecine, informatique, data et IA",
  },
  bioinfo: {
    label: "Hackathon bioinformatique",
    short: "Bioinformatique",
    rhythm: "12 heures",
    min: 2,
    max: 4,
    codePrefix: "BIO",
    regWindow: "reg_bioinfo",
    teamWindow: "reg_bioinfo",
    profiles: "Pharmacie, bioinformatique, informatique, data",
  },
};

/**
 * Speciality tags and the side each one counts for when balancing a team ("other" is neutral).
 * This list is the only place to edit them. The database repeats it twice: the check on
 * person.specialities and the profile_kind statement in supabase/migrations/0002, to re-run after a change.
 */
export const SPECIALITIES = [
  { value: "medecine", label: "Médecine", side: "health" },
  { value: "pharmacie", label: "Pharmacie", side: "health" },
  { value: "biologie", label: "Biologie", side: "health" },
  { value: "chimie", label: "Chimie", side: "health" },
  { value: "bioinformatique", label: "Bioinformatique", side: "both" },
  { value: "dev", label: "Développement", side: "tech" },
  { value: "ai_data", label: "IA & Data", side: "tech" },
  { value: "autre", label: "Autre", side: "other" },
] as const satisfies readonly { value: string; label: string; side: ProfileKind }[];

export type Speciality = (typeof SPECIALITIES)[number]["value"];
export const SPECIALITY_VALUES: readonly string[] = SPECIALITIES.map((s) => s.value);
export const MAX_SPECIALITIES = 4;

export const specialityLabel = (value: string): string => SPECIALITIES.find((s) => s.value === value)?.label ?? value;

export const PROFILE_KIND_LABEL: Record<ProfileKind, string> = {
  health: "Santé",
  tech: "Tech",
  both: "Santé et tech",
  other: "À classer",
};

export const STUDY_LEVELS = [
  "1re année",
  "2e année",
  "3e année",
  "4e année",
  "5e année",
  "6e année et plus",
  "Master",
  "Cycle ingénieur",
  "Internat / résidanat",
  "Doctorat",
  "Autre",
] as const;

export const INSTITUTIONS = [
  "INSAT",
  "Faculté de Médecine de Tunis (FMT)",
  "Faculté de Médecine de Sousse",
  "Faculté de Médecine de Sfax",
  "Faculté de Médecine de Monastir",
  "Faculté de Pharmacie de Monastir",
  "Faculté des Sciences de Tunis (FST)",
  "ISBST",
  "ENIT",
  "ENSI",
  "SUP'COM",
  "ISI",
  "ESPRIT",
  "Autre établissement",
] as const;

export const SKILLS = [
  "Python",
  "R",
  "Machine learning",
  "Deep learning",
  "Vision par ordinateur",
  "Traitement du langage",
  "Statistiques",
  "Web",
  "Mobile",
  "UI/UX",
  "Génomique",
  "Biologie moléculaire",
  "Pratique clinique",
  "Pharmacologie",
  "Santé publique",
  "Pitch",
] as const;

/** Axes of the "Compétences" radar in /admin/equipes: 16 skills are unreadable as 16 axes. */
export const SKILL_GROUPS = [
  { label: "Code & stats", skills: ["Python", "R", "Statistiques"] },
  { label: "IA", skills: ["Machine learning", "Deep learning", "Vision par ordinateur", "Traitement du langage"] },
  { label: "Web & design", skills: ["Web", "Mobile", "UI/UX"] },
  { label: "Biologie", skills: ["Génomique", "Biologie moléculaire"] },
  { label: "Santé", skills: ["Pratique clinique", "Pharmacologie", "Santé publique"] },
  { label: "Pitch", skills: ["Pitch"] },
] as const satisfies readonly { label: string; skills: readonly (typeof SKILLS)[number][] }[];

// The date shown on /confidentialite: change both together.
export const CONSENT_VERSION = "2026-11-25";

export const AGORA_CATEGORIES = {
  projet: "Projet",
  idee: "Idée",
  reflexion: "Réflexion",
} as const;

export const SUBMISSION_AXES = {
  cancer: "Cancer",
  diabete: "Diabète",
  autre_auto_immune: "Autre maladie auto-immune",
} as const;
