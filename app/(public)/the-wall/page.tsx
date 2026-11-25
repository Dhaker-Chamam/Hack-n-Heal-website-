import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Upcoming } from "@/components/upcoming";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Facts } from "@/components/ui/facts";
import { PostCard } from "@/components/wall/post-card";
import { voterId } from "@/lib/session";
import { formatDeadline, formatMoment } from "@/lib/time";
import { WALL_MAX_POSTS } from "@/lib/wall";
import { WALL_PAGE, getWallPost, listWallPosts, wallWinner, type WallSort } from "@/lib/wall-queries";
import { closedSince, getWindows, hasClosed, notYetOpen, type TimeWindow } from "@/lib/windows";

export const metadata: Metadata = { title: "The Wall" };

const INTRO =
  "L'espace où les participants partagent leurs projets et leurs idées avant l'événement. Le message le plus aimé gagne 3 minutes sur scène, le dimanche.";

export default async function TheWallPage({ searchParams }: { searchParams: Promise<{ tri?: string; page?: string }> }) {
  const [sp, windows, voter] = await Promise.all([searchParams, getWindows(), voterId()]);
  const posting = windows.agora_post;
  const voting = windows.agora_vote;
  const until = (w: TimeWindow, open: string, closed: string) =>
    hasClosed(w) ? closed : w.closes_at ? `jusqu'au ${formatDeadline(w.closes_at)}` : open;
  const facts: [string, string][] = [
    ["Publications", until(posting, "ouvertes", "closes")],
    ["Votes", until(voting, "ouverts", "clos")],
    ["Qui publie", `les participants confirmés, ${WALL_MAX_POSTS} messages chacun`],
    ["Qui vote", "tout le monde, sans compte"],
  ];

  if (notYetOpen(posting) && notYetOpen(voting)) {
    return (
      <Upcoming title="The Wall" intro={INTRO} opens={`Ouverture le ${formatMoment(posting.opens_at!)}`} facts={facts}>
        <p>
          Chaque message est relu avant publication. Pas d&apos;image, pas de données de patient, pas d&apos;affirmation médicale
          sans source.
        </p>
        <p>Les votes sont vérifiés par les organisateurs avant l&apos;annonce du gagnant, le vendredi 4 décembre.</p>
      </Upcoming>
    );
  }

  // once the vote has closed, the page becomes the results: ranking order, numbered, no like button
  const results = hasClosed(voting);
  const sort: WallSort = results || sp.tri === "populaires" ? "populaires" : "recents";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const rows = await listWallPosts(sort, page, voter);
  const posts = rows.slice(0, WALL_PAGE);
  const winnerId = results ? await wallWinner() : null;
  const winner = winnerId ? await getWallPost(winnerId, voter) : null;
  const href = (tri: WallSort, p = 1) => {
    const q = new URLSearchParams();
    if (tri === "populaires" && !results) q.set("tri", "populaires");
    if (p > 1) q.set("page", String(p));
    return q.size ? `/the-wall?${q}` : "/the-wall";
  };

  return (
    <>
      <PageHero title="The Wall" intro={INTRO}>
        {posting.is_open && (
          <div className="mt-8">
            <ButtonLink href="/the-wall/publier" variant="on-dark">
              Publier un message
            </ButtonLink>
          </div>
        )}
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {results && (
            <div className="mb-8 grid gap-4">
              {winner ? (
                <section aria-labelledby="winner-title" className="border border-emerald bg-mist p-5">
                  <h2 id="winner-title" className="t-subhead">
                    Message gagnant
                  </h2>
                  <p className="mb-4 mt-1 text-ink">Son auteur·e prend la parole 3 minutes sur scène, le dimanche 6 décembre.</p>
                  <PostCard post={winner} voteOpen={false} />
                </section>
              ) : (
                <Alert tone="info" title={`Les votes sont clos${closedSince(voting)}.`}>
                  Les organisateurs vérifient les votes avant d&apos;annoncer le gagnant, le vendredi 4 décembre. Le classement
                  ci-dessous peut encore changer.
                </Alert>
              )}
            </div>
          )}

          {results ? (
            <h2 className="t-subhead">Classement</h2>
          ) : (
            <nav aria-label="Tri des messages" className="flex gap-6 border-b border-jade/15 text-small">
              {(
                [
                  ["recents", "Récents"],
                  ["populaires", "Populaires"],
                ] as const
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={href(key)}
                  aria-current={key === sort ? "page" : undefined}
                  className={`-mb-px border-b-2 px-1 py-2.5 font-semibold ${key === sort ? "border-emerald text-jade" : "border-transparent text-graphite hover:text-jade"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {posts.length === 0 ? (
            <div className="mt-8 border border-jade/15 bg-white p-8">
              {page > 1 ? (
                <p className="text-ink">Il n&apos;y a pas d&apos;autres messages.</p>
              ) : (
                <>
                  <p className="t-subhead text-jade">Sois le premier à publier.</p>
                  <p className="mt-2 max-w-measure text-graphite">
                    Aucun message n&apos;est encore en ligne. Chaque message est relu par un modérateur avant d&apos;apparaître ici.
                  </p>
                </>
              )}
            </div>
          ) : (
            <ol className="mt-6 grid gap-4">
              {posts.map((post, i) => (
                <li key={post.id}>
                  <PostCard post={post} voteOpen={voting.is_open} rank={results ? (page - 1) * WALL_PAGE + i + 1 : undefined} />
                </li>
              ))}
            </ol>
          )}

          {(page > 1 || rows.length > WALL_PAGE) && (
            <nav aria-label="Pages" className="mt-8 flex flex-wrap gap-4 text-small font-semibold">
              {page > 1 && (
                <Link href={href(sort, page - 1)} className="text-emerald underline underline-offset-4">
                  Messages précédents
                </Link>
              )}
              {rows.length > WALL_PAGE && (
                <Link href={href(sort, page + 1)} className="text-emerald underline underline-offset-4">
                  Messages suivants
                </Link>
              )}
            </nav>
          )}
        </div>

        <aside>
          <Facts items={facts} />
          <div className="mt-6 grid gap-3 border-t border-jade/15 pt-4 text-small text-graphite">
            <p>
              Chaque message est relu avant publication. Pas d&apos;image, pas de données de patient, pas d&apos;affirmation
              médicale sans source.
            </p>
            <p>
              Un vote par message et par navigateur. Les votes sont vérifiés par les organisateurs avant l&apos;annonce du gagnant,
              le vendredi 4 décembre.
            </p>
            <p>
              <Link href="/reglement#the-wall" className="font-semibold text-emerald underline">
                Règlement de The Wall
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
