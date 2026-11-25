import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { PostCard } from "@/components/wall/post-card";
import { SharePost } from "@/components/wall/share-post";
import { env } from "@/lib/env";
import { voterId } from "@/lib/session";
import { REPORT_REASONS, authorLabel } from "@/lib/wall";
import { getWallPost } from "@/lib/wall-queries";
import { getWindow } from "@/lib/windows";
import { reportPost } from "../actions";

export const metadata: Metadata = { title: "Message sur The Wall" };

export default async function WallPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) notFound();
  const [voting, post] = await Promise.all([getWindow("agora_vote"), voterId().then((voter) => getWallPost(id, voter))]);
  if (!post) notFound();
  const author = authorLabel(post.first_name, post.last_name, post.institution).split(" · ")[0];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:py-14">
      <Link href="/the-wall" className="inline-flex items-center gap-1.5 text-small font-semibold text-emerald underline underline-offset-4">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} /> The Wall
      </Link>
      <h1 className="t-headline mt-6">Publié par {author}</h1>
      <div className="mt-6">
        <PostCard post={post} voteOpen={voting.is_open} full />
      </div>

      <section aria-labelledby="share-title" className="mt-10">
        <h2 id="share-title" className="t-subhead">
          Partager ce message
        </h2>
        <p className="mb-4 mt-1 text-small text-graphite">Tout le monde peut l&apos;aimer depuis ce lien, sans compte.</p>
        <SharePost url={`${env.appUrl}/the-wall/${post.id}`} text={`Un message à lire sur The Wall de Hack'n'Heal 2026 :`} />
      </section>

      <section aria-labelledby="signaler" className="mt-12 border-t border-jade/15 pt-8">
        <h2 id="signaler" className="t-subhead scroll-mt-6">
          Signaler ce message
        </h2>
        <p className="mb-4 mt-1 max-w-measure text-small text-graphite">
          Pour des données de patient, une affirmation médicale fausse, un contenu offensant ou de la publicité. Un modérateur
          relit chaque signalement.
        </p>
        <SimpleActionForm action={reportPost.bind(null, post.id)} submitLabel="Envoyer le signalement" pendingLabel="Envoi…" variant="secondary" size="sm">
          <div className="grid max-w-md gap-4">
            <div>
              <label htmlFor="reason" className="block font-semibold text-ink">
                Motif
              </label>
              <select id="reason" name="reason" defaultValue="" className="control mt-2">
                <option value="" disabled>
                  Choisir…
                </option>
                {Object.entries(REPORT_REASONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="details" className="block font-semibold text-ink">
                Précision <span className="ml-2 font-normal text-small text-graphite">facultatif</span>
              </label>
              <textarea id="details" name="details" rows={3} maxLength={300} className="control mt-2" />
            </div>
          </div>
        </SimpleActionForm>
      </section>
    </div>
  );
}
