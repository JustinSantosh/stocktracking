import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getCurrentWatchlistSymbols } from "@/lib/actions/watchlist.actions";

const MarketNewsBar = async () => {
  const symbols = await getCurrentWatchlistSymbols();

  if (symbols.length === 0) {
    return (
      <div className="news-bar">
        <div className="container news-bar-wrapper">
          <Newspaper className="news-bar-icon" />
          <span className="news-bar-empty">Add stocks to your watchlist to see personalized market news.</span>
        </div>
      </div>
    );
  }

  try {
    const articles = await getNews(symbols);

    if (articles.length === 0) {
      return (
        <div className="news-bar">
          <div className="container news-bar-wrapper">
            <Newspaper className="news-bar-icon" />
            <span className="news-bar-empty">No watchlist news available right now.</span>
          </div>
        </div>
      );
    }

    return (
      <div className="news-bar">
        <div className="container news-bar-wrapper">
          <div className="news-bar-label">
            <Newspaper className="news-bar-icon" />
            <span>Watchlist News</span>
          </div>
          <div className="news-bar-viewport">
            <div className="news-bar-track">
              {[false, true].map((duplicate) => (
                <div
                  key={duplicate ? "duplicate" : "primary"}
                  className="news-bar-group"
                  aria-hidden={duplicate || undefined}
                >
                  {articles.slice(0, 6).map((article) => (
                    <Link
                      key={`${duplicate ? "copy" : "story"}-${article.id}-${article.url}`}
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="news-bar-link"
                      tabIndex={duplicate ? -1 : undefined}
                    >
                      <span className="news-bar-symbol">{article.related || article.category}</span>
                      <span className="news-bar-headline">{article.headline}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("MarketNewsBar error:", error);

    return (
      <div className="news-bar">
        <div className="container news-bar-wrapper">
          <Newspaper className="news-bar-icon" />
          <span className="news-bar-empty">Watchlist news is unavailable right now.</span>
        </div>
      </div>
    );
  }
};

export default MarketNewsBar;
