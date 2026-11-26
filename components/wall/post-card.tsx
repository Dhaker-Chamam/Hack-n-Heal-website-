import Link from "next/link";
import { AGORA_CATEGORIES } from "@/lib/constants";
import { formatShort } from "@/lib/time";
import { authorLabel, linkDomain } from "@/lib/wall";
import type { WallPost } from "@/lib/wall-queries";
import { LikeButton } from "./like-button";

/**
 * A published post. `rank` numbers the results once votes are closed;
 * `full` is the post's own page, where the links to it are dropped.
 */
export function PostCard({ post, voteOpen, rank, full = false }: { post: WallPost; voteOpen: boolean; rank?: number; full?: boolean }) {
  return (
    <article className="border border-jade/15 bg-white p-5">
      <p className="t-label text-emerald">
        {rank !== undefined && <span className="tabular mr-3 font-semibold text-jade">n° {rank}</span>}
        {AGORA_CATEGORIES[post.category]}
      </p>
      <p className="mt-2 whitespace-pre-line break-words text-ink">{post.body}</p>
      {post.link_url && (
        <p className="mt-3 text-small">
          <a href={post.link_url} target="_blank" rel="nofollow noopener noreferrer" className="font-semibold text-emerald underline">
            {linkDomain(post.link_url)}
          </a>
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-jade/15 pt-3">
        <p className="text-small text-graphite">
          <span className="font-semibold text-ink">{authorLabel(post.first_name, post.last_name, post.institution)}</span>
          {post.coauthors.length > 0 && <span> · avec {post.coauthors.join(", ")}</span>}
          <span className="tabular"> · {formatShort(post.published_at)}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {!full && (
            <>
              <Link href={`/the-wall/${post.id}`} className="text-small font-semibold text-emerald underline underline-offset-4">
                Ouvrir et partager
              </Link>
              <Link href={`/the-wall/${post.id}#signaler`} className="text-small text-graphite underline underline-offset-4 hover:text-jade">
                Signaler
              </Link>
            </>
          )}
          <LikeButton postId={post.id} count={post.counted_likes} liked={post.liked} open={voteOpen} />
        </div>
      </div>
    </article>
  );
}
