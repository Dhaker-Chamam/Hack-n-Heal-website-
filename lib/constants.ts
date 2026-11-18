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

export const DISCIPLINES = [
  { value: "medecine", label: "Médecine", kind: "health" },
  { value: "pharmacie", label: "Pharmacie", kind: "health" },
  { value: "biologie", label: "Biologie", kind: "health" },
  { value: "bioinformatique", label: "Bioinformatique", kind: "both" },
  { value: "informatique", label: "Informatique", kind: "tech" },
  { value: "data_ia", label: "Data et IA", kind: "tech" },
  { value: "autre", label: "Autre", kind: "other" },
] as const satisfies readonly { value: string; label: string; kind: ProfileKind }[];

export type Discipline = (typeof DISCIPLINES)[number]["value"];

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

export const CONSENT_VERSION = "2026-11-16";

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
