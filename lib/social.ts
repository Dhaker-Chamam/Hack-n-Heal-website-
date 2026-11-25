// Pure: imported by the registration form in the browser and by the server actions.

export type Facebook = { kind: "url" | "name"; value: string };

export const FACEBOOK_ERROR = "Lien Facebook ou nom de profil invalide";

const HOST = /^(?:https?:\/\/)?(?:(?:www\.|m\.|web\.)?facebook\.com|fb\.com)(?=[/?#]|$)/i;
const USERNAME = /^\/[A-Za-z0-9.-]{2,50}$/;
const PEOPLE = /^\/people\/[^/]+\/[A-Za-z0-9]+$/;
const NAME = /^(?=.*[\p{L}\p{N}])[\p{L}\p{N} .'’-]{2,80}$/u;

/**
 * Reads a Facebook profile link or a plain profile name. Links come back as
 * https://www.facebook.com/…, without tracking parameters or trailing slashes.
 * Returns null for anything else (show FACEBOOK_ERROR).
 */
export function normaliseFacebook(input: string): Facebook | null {
  const s = input.trim();
  if (s.length > 200) return null;

  const host = HOST.exec(s);
  if (!host) {
    const name = s.replace(/\s+/g, " ");
    return NAME.test(name) ? { kind: "name", value: name } : null;
  }

  let url: URL;
  try {
    url = new URL(`https://www.facebook.com${s.slice(host[0].length)}`);
  } catch {
    return null;
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path === "/profile.php") {
    const id = url.searchParams.get("id") ?? "";
    return /^\d{1,20}$/.test(id) ? { kind: "url", value: `https://www.facebook.com/profile.php?id=${id}` } : null;
  }
  // a single segment ending in .php is a Facebook page (home.php, login.php), not a username
  if (PEOPLE.test(path) || (USERNAME.test(path) && !path.endsWith(".php"))) {
    return { kind: "url", value: `https://www.facebook.com${path}` };
  }
  return null;
}
