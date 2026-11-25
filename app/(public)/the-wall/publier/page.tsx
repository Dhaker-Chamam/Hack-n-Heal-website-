import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/field";
import { PostForm } from "@/components/wall/post-form";
import { AGORA_CATEGORIES } from "@/lib/constants";
import { currentPerson } from "@/lib/session";
import { formatDeadline, formatShort } from "@/lib/time";
import { POST_STATUS_LABEL, WALL_MAX_POSTS, WALL_POST_INTERVAL } from "@/lib/wall";
import { myWallPosts } from "@/lib/wall-queries";
import { closedSince, getWindow, notYetOpen } from "@/lib/windows";
import { deleteMyPost, publishPost, updatePost } from "../actions";

export const metadata: Metadata = { title: "Publier sur The Wall" };

export default async function PublishPage() {
  const [person, posting] = await Promise.all([currentPerson(), getWindow("agora_post")]);
  const posts = person?.status === "confirmed" ? await myWallPosts(person.id) : [];
  const left = WALL_MAX_POSTS - posts.length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:py-14">
      <Link href="/the-wall" className="inline-flex items-center gap-1.5 text-small font-semibold text-emerald underline underline-offset-4">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} /> The Wall
      </Link>
      <h1 className="t-headline mt-6">Publier sur The Wall</h1>

      {!person || person.status === "rejected" ? (
        <div className="mt-6 grid gap-4">
          <p className="max-w-measure text-ink">
            Seuls les participants inscrits publient sur The Wall. Ouvre d&apos;abord ton espace avec le lien personnel reçu par
            email, puis reviens sur cette page.
          </p>
          <p>
            <Link href="/lien" className="font-semibold text-emerald underline">
              Recevoir mon lien personnel
            </Link>
            <span className="text-graphite"> · </span>
            <Link href="/inscription" className="font-semibold text-emerald underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      ) : person.status !== "confirmed" ? (
        <div className="mt-6">
          <Alert tone="info" title={person.status === "pending" ? "Confirme d'abord ton adresse email." : "Ton inscription a été annulée."}>
            {person.status === "pending"
              ? "Clique sur le lien de l'email de confirmation : tu pourras publier juste après."
              : "Écris aux organisateurs si tu penses qu'il s'agit d'une erreur."}
          </Alert>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid max-w-measure gap-2 text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_li]:marker:text-emerald">
            <li>
              Un projet, une idée ou une réflexion sur la santé et la tech. {WALL_MAX_POSTS} messages au maximum, {WALL_POST_INTERVAL}{" "}
              minutes entre deux.
            </li>
            <li>Chaque message est relu par un modérateur avant d&apos;être publié. Tu reçois un email quand il est en ligne.</li>
            <li>
              Sont refusés : données ou cas de patients reconnaissables, affirmations médicales sans source, promesses de guérison,
              publicité, harcèlement.
            </li>
            <li>
              Ton message est affiché avec ton prénom, l&apos;initiale de ton nom et ton établissement.{" "}
              <Link href="/reglement#the-wall" className="font-semibold text-emerald underline">
                Règlement de The Wall
              </Link>
            </li>
          </ul>

          <section aria-labelledby="new-title" className="mt-10 border-t border-jade/15 pt-8">
            <h2 id="new-title" className="t-subhead">
              Nouveau message
            </h2>
            <div className="mt-4">
              {person.agora_blocked ? (
                <Alert tone="error" title="Les modérateurs ont suspendu tes publications sur The Wall.">
                  Écris aux organisateurs si tu penses qu&apos;il s&apos;agit d&apos;une erreur.
                </Alert>
              ) : !posting.is_open ? (
                <Alert
                  tone="info"
                  title={
                    notYetOpen(posting)
                      ? "Les publications ne sont pas encore ouvertes."
                      : `Les publications sont closes${closedSince(posting)}.`
                  }
                />
              ) : left <= 0 ? (
                <Alert tone="info" title={`Tu as déjà ${WALL_MAX_POSTS} messages, le maximum.`}>
                  Supprime un message ci-dessous pour en écrire un autre.
                </Alert>
              ) : (
                <>
                  <p className="mb-6 text-small text-graphite">
                    {posting.closes_at && <>Publications ouvertes jusqu&apos;au {formatDeadline(posting.closes_at)}. </>}
                    Il te reste <span className="tabular font-semibold text-ink">{left}</span> message{left > 1 ? "s" : ""}.
                  </p>
                  <PostForm action={publishPost} consent submitLabel="Envoyer à la relecture" />
                </>
              )}
            </div>
          </section>

          <section aria-labelledby="mine-title" className="mt-12 border-t border-jade/15 pt-8">
            <h2 id="mine-title" className="t-subhead">
              Mes messages
            </h2>
            {posts.length === 0 ? (
              <p className="mt-2 text-graphite">Tu n&apos;as encore rien publié.</p>
            ) : (
              <ul className="mt-4 grid gap-6">
                {posts.map((post) => {
                  const editable = posting.is_open && !person.agora_blocked && (post.status === "pending" || post.status === "changes_requested");
                  return (
                    <li key={post.id} className="border border-jade/15 bg-white p-5">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className={`font-semibold ${post.status === "removed" ? "text-danger" : "text-jade"}`}>{POST_STATUS_LABEL[post.status]}</span>
                        <span className="tabular text-small text-graphite">
                          {AGORA_CATEGORIES[post.category]} · {formatShort(post.created_at)}
                        </span>
                      </p>
                      {post.moderation_reason && post.status !== "published" && (
                        <p className="mt-2 text-ink">
                          <span className="font-semibold">Message des modérateurs : </span>
                          {post.moderation_reason}
                        </p>
                      )}
                      <p className="mt-3 whitespace-pre-line break-words text-ink">{post.body}</p>
                      {post.link_url && <p className="mt-2 break-all text-small text-graphite">{post.link_url}</p>}
                      {post.status === "published" && (
                        <p className="mt-3 text-small">
                          <span className="tabular font-semibold text-ink">{post.counted_likes}</span>{" "}
                          <span className="text-graphite">j&apos;aime · </span>
                          <Link href={`/the-wall/${post.id}`} className="font-semibold text-emerald underline">
                            Ouvrir et partager
                          </Link>
                        </p>
                      )}
                      <div className="mt-4 grid gap-4 border-t border-jade/15 pt-4">
                        {editable && (
                          <details>
                            <summary className="cursor-pointer font-semibold text-emerald underline underline-offset-4">
                              {post.status === "changes_requested" ? "Corriger et renvoyer" : "Modifier"}
                            </summary>
                            <div className="mt-4">
                              <PostForm
                                action={updatePost.bind(null, post.id)}
                                defaults={{ category: post.category, body: post.body, link_url: post.link_url ?? "" }}
                                submitLabel="Renvoyer à la relecture"
                                idPrefix={`edit_${post.id}`}
                              />
                            </div>
                          </details>
                        )}
                        <details>
                          <summary className="cursor-pointer text-small font-semibold text-danger underline underline-offset-4">Supprimer ce message</summary>
                          <div className="mt-3">
                            <SimpleActionForm action={deleteMyPost.bind(null, post.id)} submitLabel="Supprimer" pendingLabel="Suppression…" variant="danger" size="sm">
                              <Checkbox name="confirm" id={`delete_${post.id}`}>
                                Supprimer ce message et les votes qu&apos;il a reçus. Cette action est définitive.
                              </Checkbox>
                            </SimpleActionForm>
                          </div>
                        </details>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
