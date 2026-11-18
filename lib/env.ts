import "server-only";

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

function required(name: string): string {
  const v = read(name);
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get appSecret() {
    return required("APP_SECRET");
  },
  get hashSalt() {
    return read("HASH_SALT") ?? required("APP_SECRET");
  },
  appUrl: (read("APP_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: read("SUPABASE_URL"),
  supabaseServiceKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  smtp: {
    host: read("SMTP_HOST"),
    port: Number(read("SMTP_PORT") ?? 465),
    user: read("SMTP_USER"),
    pass: read("SMTP_PASS"),
  },
  mailFrom: read("MAIL_FROM") ?? "Hack'n'Heal 2026 <no-reply@localhost>",
  adminEmails: (read("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  controllerName: read("DATA_CONTROLLER_NAME") ?? "Symbio INSAT",
  controllerContact: read("DATA_CONTROLLER_CONTACT"),
  turnstileSiteKey: read("TURNSTILE_SITE_KEY"),
  turnstileSecret: read("TURNSTILE_SECRET_KEY"),
  isProd: process.env.NODE_ENV === "production",
};

export const cvUploadEnabled = () => Boolean(env.supabaseUrl && env.supabaseServiceKey);
