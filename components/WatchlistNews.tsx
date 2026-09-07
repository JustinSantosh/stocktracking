import Link from "next/link";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export default function WatchlistNews({ news = [] }: WatchlistNewsProps) {
  return (
    <section className="watchlist-news-section">
      <div className="watchlist-section-heading">
        <div>
          <span className="watchlist-eyebrow">Latest coverage</span>
          <h2>News from your watchlist</h2>
        </div>
        <Newspaper className="h-5 w-5" />
      </div>

      {news.length === 0 ? (
        <div className="watchlist-news-empty">No watchlist news is available right now.</div>
      ) : (
        <div className="watchlist-news-grid">
          {news.slice(0, 4).map((article) => (
            <Link
              key={`${article.id}-${article.url}`}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="watchlist-news-card"
            >
              <div className="watchlist-news-card-top">
                <span>{article.related || article.category || "Market"}</span>
                <ArrowUpRight />
              </div>
              <h3>{article.headline}</h3>
              <div className="watchlist-news-meta">
                <span>{article.source}</span>
                <span aria-hidden="true">•</span>
                <span>{formatTimeAgo(article.datetime)}</span>
              </div>
              <p>{article.summary}</p>
              <span className="watchlist-news-read">Read story</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
