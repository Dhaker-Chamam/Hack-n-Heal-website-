import type { Metadata } from "next";
import Link from "next/link";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/field";
import { requireStaff } from "@/lib/admin";
import { AGORA_CATEGORIES } from "@/lib/constants";
import { formatDeadline, formatShort } from "@/lib/time";
import { POST_STATUS_LABEL, REPORT_REASONS, WALL_REPORTS_TO_HIDE, authorLabel, wallWarnings } from "@/lib/wall";
import {
  likeAudit,
  likeGroups,
  moderationPosts,
  wallQueue,
  wallWinner,
  type LikeAudit,
  type ModerationPost,
  type ModerationView,
} from "@/lib/wall-queries";
import { closedSince, getWindows, hasClosed } from "@/lib/windows";
import { confirmWinner, moderatePost, reviewLikes, setAuthorBlocked } from "./actions";

export const metadata: Metadata = { title: "The Wall" };

type View = ModerationView | "votes";
const VIEWS: View[] = ["attente", "signalements", "publies", "tous", "votes"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TH = "py-2 pr-3 font-semibold";
const NUM = "tabular py-2.5 pr-3 text-right";
const REASON = "control mt-1 min-h-10! py-2!";

/** Why a post's votes deserve a look before the result is trusted. */
function voteFlags(a: LikeAudit): string[] {
  const live = a.total - a.voided;
  const flags: string[] = [];
  if (a.held > 0) flags.push(`${a.held} retenu${a.held > 1 ? "s" : ""}`);
  if (a.last10 >= 30) flags.push(`${a.last10} en 10 minutes`);
  if (live >= 10 && a.top_ip * 2 > live) flags.push(`${Math.round((a.top_ip / live) * 100)} % d'un même réseau`);
  return flags;
}

export default async function WallAdminPage({ searchParams }: { searchParams: Promise<{ vue?: string; post?: string }> }) {
  const staff = await requireStaff("admin", "moderator");
  const sp = await searchParams;
  const view: View = VIEWS.includes(sp.vue as View) ? (sp.vue as View) : "attente";
  const [queue, windows] = await Promise.all([wallQueue(), getWindows()]);
  const voting = windows.agora_vote;
  const voteClosed = hasClosed(voting);
  const tabs: [View, string, number | null][] = [
    ["attente", "À relire", queue.pending],
    ["signalements", "Signalés", queue.reported],
    ["publies", "En ligne", queue.published],
    ["tous", "Tous", queue.total],
    ["votes", "Votes", null],
  ];

  return (
    <div>
      <h1 className="t-headline">The Wall</h1>
      <p className="mt-2 max-w-measure text-graphite">
        Chaque message attend ici avant d&apos;être publié. Refuse les données de patients, les affirmations médicales sans
        source, les promesses de guérison, la publicité et le harcèlement.
        {voteClosed ? <> Votes clos{closedSince(voting)}.</> : voting.closes_at && <> Votes ouverts jusqu&apos;au {formatDeadline(voting.closes_at)}.</>}
      </p>

      <nav aria-label="Vue" className="mt-6 flex gap-6 overflow-x-auto border-b border-jade/15 text-small">
        {tabs.map(([key, label, count]) => (
          <Link
            key={key}
            href={`/admin/the-wall?vue=${key}`}
            aria-current={key === view ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-1 py-2.5 font-semibold ${key === view ? "border-emerald text-jade" : "border-transparent text-graphite hover:text-jade"}`}
          >
            {label}
            {count !== null && <span className="tabular font-normal"> ({count})</span>}
          </Link>
        ))}
      </nav>

      {view === "votes" ? (
        <Votes postId={sp.post && UUID.test(sp.post) ? sp.post : null} voteClosed={voteClosed} isAdmin={staff.role === "admin"} />
      ) : (
        <Posts view={view} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ moderation

async function Posts({ view }: { view: ModerationView }) {
  const posts = await moderationPosts(view);
  if (posts.length === 0) {
    return (
      <p className="mt-8 text-graphite">
        {view === "attente" ? "Aucun message à relire." : view === "signalements" ? "Aucun message signalé." : "Aucun message."}
      </p>
    );
  }
  return (
    <ul className="mt-6 grid gap-6">
      {posts.map((post) => (
        <li key={post.id}>
          <ModerationCard post={post} />
        </li>
      ))}
    </ul>
  );
}

function ModerationCard({ post }: { post: ModerationPost }) {
  const warnings = wallWarnings(post.body);
  const online = post.status === "published";
  return (
    <article className="border border-jade/15 bg-white p-5">
      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={`font-semibold ${post.status === "removed" ? "text-danger" : "text-jade"}`}>{POST_STATUS_LABEL[post.status]}</span>
        <span className="tabular text-small text-graphite">
          {AGORA_CATEGORIES[post.category]} · reçu le {formatShort(post.created_at)}
          {online && ` · ${post.counted_likes} j'aime`}
        </span>
      </p>
      <p className="mt-1 text-small text-graphite">
        <span className="font-semibold text-ink">
          {post.first_name} {post.last_name}
        </span>{" "}
        · {post.email} · {post.institution}
        <span className="block">Affiché comme : {authorLabel(post.first_name, post.last_name, post.institution)}</span>
        {post.coauthors.length > 0 && <span className="block">Co-auteur·e·s affichés : {post.coauthors.join(", ")}</span>}
        {post.agora_blocked && <span className="block font-semibold text-danger">Auteur suspendu</span>}
      </p>

      {warnings.length > 0 && (
        <div className="mt-3">
          <Alert tone="info" title={`À vérifier : le message semble contenir ${warnings.join(", ")}.`} />
        </div>
      )}
      <p className="mt-3 whitespace-pre-line break-words text-ink">{post.body}</p>
      {post.link_url && (
        <p className="mt-2 break-all text-small">
          <span className="text-graphite">Lien : </span>
          <a href={post.link_url} target="_blank" rel="nofollow noopener noreferrer" className="font-semibold text-emerald underline">
            {post.link_url}
          </a>
        </p>
      )}
      {post.reports.length > 0 && (
        <div className="mt-3 border-l-4 border-jade bg-mist px-4 py-3 text-small text-ink">
          <p className="font-semibold">
            {post.reports.length} signalement{post.reports.length > 1 ? "s" : ""} à traiter
          </p>
          <ul className="mt-1 grid gap-0.5">
            {post.reports.map((r, i) => (
              <li key={i}>
                {REPORT_REASONS[r.reason] ?? r.reason}
                {r.details && <span className="text-graphite"> : « {r.details} »</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {post.moderation_reason && !online && (
        <p className="mt-3 text-small text-ink">
          <span className="font-semibold">Motif enregistré : </span>
          {post.moderation_reason}
        </p>
      )}

      <div className="mt-4 grid gap-4 border-t border-jade/15 pt-4 md:grid-cols-2">
        <div className="grid content-start gap-4">
          {!online && (
            <SimpleActionForm action={moderatePost.bind(null, post.id)} submitLabel={post.published_at ? "Remettre en ligne" : "Publier"} size="sm">
              <input type="hidden" name="op" value="approve" />
            </SimpleActionForm>
          )}
          {online && (
            <SimpleActionForm action={moderatePost.bind(null, post.id)} submitLabel="Masquer le temps de vérifier" variant="secondary" size="sm">
              <input type="hidden" name="op" value="hide" />
            </SimpleActionForm>
          )}
          {online && post.reports.length > 0 && (
            <SimpleActionForm action={moderatePost.bind(null, post.id)} submitLabel="Garder en ligne et clore les signalements" variant="secondary" size="sm">
              <input type="hidden" name="op" value="approve" />
            </SimpleActionForm>
          )}
          <SimpleActionForm
            action={setAuthorBlocked.bind(null, post.author_person_id, !post.agora_blocked)}
            submitLabel={post.agora_blocked ? "Rétablir l'auteur" : "Suspendre l'auteur"}
            variant="ghost"
            size="sm"
          />
        </div>
        <div className="grid content-start gap-4">
          {post.status !== "changes_requested" && post.status !== "removed" && (
            <details>
              <summary className="cursor-pointer text-small font-semibold text-emerald underline underline-offset-4">Demander des modifications</summary>
              <div className="mt-3">
                <SimpleActionForm action={moderatePost.bind(null, post.id)} submitLabel="Envoyer la demande" variant="secondary" size="sm">
                  <input type="hidden" name="op" value="changes" />
                  <div>
                    <label htmlFor={`changes_${post.id}`} className="block text-small font-semibold text-ink">
                      Ce que l&apos;auteur doit corriger <span className="font-normal text-graphite">(envoyé par email)</span>
                    </label>
                    <textarea id={`changes_${post.id}`} name="reason" rows={2} maxLength={500} className={REASON} />
                  </div>
                </SimpleActionForm>
              </div>
            </details>
          )}
          {post.status !== "removed" && (
            <details>
              <summary className="cursor-pointer text-small font-semibold text-danger underline underline-offset-4">Retirer</summary>
              <div className="mt-3">
                <SimpleActionForm action={moderatePost.bind(null, post.id)} submitLabel="Retirer le message" variant="danger" size="sm">
                  <input type="hidden" name="op" value="remove" />
                  <div>
                    <label htmlFor={`remove_${post.id}`} className="block text-small font-semibold text-ink">
                      Motif <span className="font-normal text-graphite">(conservé, visible par l&apos;auteur)</span>
                    </label>
                    <input id={`remove_${post.id}`} name="reason" maxLength={500} className={REASON} />
                  </div>
                </SimpleActionForm>
              </div>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

// ------------------------------------------------------------------ votes

async function Votes({ postId, voteClosed, isAdmin }: { postId: string | null; voteClosed: boolean; isAdmin: boolean }) {
  const [audit, winnerId] = await Promise.all([likeAudit(), wallWinner()]);
  const selected = postId ? audit.find((a) => a.id === postId) : undefined;
  const groups = selected ? await likeGroups(selected.id) : [];

  return (
    <div className="mt-6">
      <p className="max-w-measure text-small text-graphite">
        Seuls les votes comptés sont publics. Un vote est retenu, sans être compté, au-delà de 5 votes par heure d&apos;un même
        réseau sur un message, ou de 3 par jour d&apos;un même appareil. Un réseau peut être celui d&apos;un campus entier : regarde
        le nombre d&apos;appareils avant d&apos;annuler.
      </p>

      {selected && (
        <section aria-labelledby="detail-title" className="mt-6 border border-jade/15 bg-white p-5">
          <h2 id="detail-title" className="t-subhead">
            Votes du message de {authorLabel(selected.first_name, selected.last_name, selected.institution)}
          </h2>
          <p className="mt-2 text-ink">« {selected.excerpt}{selected.excerpt.length >= 140 ? "…" : ""} »</p>
          <p className="tabular mt-2 text-small text-graphite">
            {selected.counted} compté{selected.counted > 1 ? "s" : ""} · {selected.held} retenu{selected.held > 1 ? "s" : ""} · {selected.voided} annulé
            {selected.voided > 1 ? "s" : ""} · {selected.total} au total
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-small">
              <thead>
                <tr className="border-b border-jade/30 text-graphite">
                  <th scope="col" className={TH}>Réseau (anonymisé)</th>
                  <th scope="col" className={`${TH} text-right`}>Comptés</th>
                  <th scope="col" className={`${TH} text-right`}>Retenus</th>
                  <th scope="col" className={`${TH} text-right`}>Annulés</th>
                  <th scope="col" className={`${TH} text-right`}>Appareils</th>
                  <th scope="col" className={TH}>Du… au…</th>
                  <th scope="col" className="py-2 font-semibold">Annuler ces votes</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.ip_hash} className="border-b border-jade/10 align-top even:bg-mist/60">
                    <td className="tabular py-2.5 pr-3 text-ink">{g.ip_hash.slice(0, 8)}</td>
                    <td className={NUM}>{g.counted}</td>
                    <td className={NUM}>{g.held}</td>
                    <td className={NUM}>{g.voided}</td>
                    <td className={NUM}>{g.devices}</td>
                    <td className="tabular py-2.5 pr-3 text-graphite">
                      {formatShort(g.first_at)} → {formatShort(g.last_at)}
                    </td>
                    <td className="py-2.5">
                      {g.counted + g.held > 0 && (
                        <SimpleActionForm action={reviewLikes.bind(null, selected.id)} submitLabel="Annuler" variant="danger" size="sm" inline>
                          <input type="hidden" name="op" value="void_ip" />
                          <input type="hidden" name="ip" value={g.ip_hash} />
                          <div>
                            <label htmlFor={`void_${g.ip_hash}`} className="sr-only">
                              Motif de l&apos;annulation des votes du réseau {g.ip_hash.slice(0, 8)}
                            </label>
                            <input id={`void_${g.ip_hash}`} name="reason" placeholder="Motif" maxLength={300} className="control min-h-10! w-44! py-2!" />
                          </div>
                        </SimpleActionForm>
                      )}
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-graphite">
                      Aucun vote sur ce message.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-8 border-t border-jade/15 pt-5 md:grid-cols-2">
            {selected.held > 0 && (
              <div className="grid content-start gap-4">
                <h3 className="font-semibold">
                  {selected.held} vote{selected.held > 1 ? "s" : ""} retenu{selected.held > 1 ? "s" : ""}
                </h3>
                <SimpleActionForm action={reviewLikes.bind(null, selected.id)} submitLabel="Les compter : ils sont légitimes" variant="secondary" size="sm">
                  <input type="hidden" name="op" value="count_held" />
                </SimpleActionForm>
                <SimpleActionForm action={reviewLikes.bind(null, selected.id)} submitLabel="Les annuler" variant="danger" size="sm">
                  <input type="hidden" name="op" value="void_held" />
                  <div>
                    <label htmlFor="void_held_reason" className="block text-small font-semibold text-ink">
                      Motif de l&apos;annulation
                    </label>
                    <input id="void_held_reason" name="reason" maxLength={300} className={REASON} />
                  </div>
                </SimpleActionForm>
              </div>
            )}
            {isAdmin && selected.status === "published" && (
              <div className="grid content-start gap-3">
                <h3 className="font-semibold">Gagnant</h3>
                {winnerId === selected.id ? (
                  <p className="text-small font-semibold text-emerald">Ce message est le gagnant annoncé.</p>
                ) : voteClosed ? (
                  <SimpleActionForm action={confirmWinner.bind(null, selected.id)} submitLabel="Confirmer ce message comme gagnant" size="sm">
                    <Checkbox name="confirm" id="winner_confirm">
                      Les votes sont vérifiés. Annoncer ce message sur The Wall et prévenir son auteur par email
                      {winnerId ? ", à la place du gagnant actuel" : ""}.
                    </Checkbox>
                  </SimpleActionForm>
                ) : (
                  <p className="text-small text-graphite">Le gagnant se confirme ici une fois les votes clos.</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-jade/30 text-graphite">
              <th scope="col" className={`${TH} text-right`}>Rang</th>
              <th scope="col" className={TH}>Message</th>
              <th scope="col" className={`${TH} text-right`}>Comptés</th>
              <th scope="col" className={`${TH} text-right`}>Retenus</th>
              <th scope="col" className={`${TH} text-right`}>Annulés</th>
              <th scope="col" className={`${TH} text-right`}>Total</th>
              <th scope="col" className="py-2 font-semibold">À vérifier</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((a, i) => {
              const flags = voteFlags(a);
              return (
                <tr key={a.id} className="border-b border-jade/10 align-top even:bg-mist/60">
                  <td className={NUM}>{i + 1}</td>
                  <td className="max-w-md py-2.5 pr-3">
                    <Link href={`/admin/the-wall?vue=votes&post=${a.id}`} className="font-semibold text-emerald underline underline-offset-2">
                      {authorLabel(a.first_name, a.last_name, a.institution)}
                    </Link>
                    {a.id === winnerId && <span className="ml-2 font-semibold text-jade">Gagnant annoncé</span>}
                    {a.status === "hidden" && <span className="ml-2 text-graphite">(masqué)</span>}
                    <span className="block truncate text-graphite">{a.excerpt}</span>
                  </td>
                  <td className={`${NUM} font-semibold text-ink`}>{a.counted}</td>
                  <td className={NUM}>{a.held}</td>
                  <td className={NUM}>{a.voided}</td>
                  <td className={NUM}>{a.total}</td>
                  <td className="py-2.5 text-ink">{flags.length ? flags.join(" · ") : <span className="text-graphite">—</span>}</td>
                </tr>
              );
            })}
            {audit.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-graphite">
                  Aucun message en ligne.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-small text-graphite">
        Classement : le plus de votes comptés ; à égalité, le message qui a atteint son total en premier. {WALL_REPORTS_TO_HIDE}{" "}
        signalements masquent un message jusqu&apos;à sa relecture.
      </p>
    </div>
  );
}
