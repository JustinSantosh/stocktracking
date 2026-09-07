import { Star } from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import WatchlistDashboard from "@/components/WatchlistDashboard";
import WatchlistNews from "@/components/WatchlistNews";
import {
  getNews,
  getWatchlistMarketData,
  searchStocks,
} from "@/lib/actions/finnhub.actions";
import { getCurrentWatchlistItems } from "@/lib/actions/watchlist.actions";

const WatchlistPage = async () => {
  const [watchlist, initialStocks] = await Promise.all([
    getCurrentWatchlistItems(),
    searchStocks(),
  ]);

  if (watchlist.length === 0) {
    return (
      <section className="watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h1 className="empty-title">Your watchlist is empty</h1>
          <p className="empty-description">
            Star stocks from search or add them from a stock page to personalize news and email summaries.
          </p>
          <SearchCommand initialStocks={initialStocks} label="Find stocks" />
        </div>
      </section>
    );
  }

  const [stocksWithMarketData, news] = await Promise.all([
    getWatchlistMarketData(watchlist),
    getNews(watchlist.map((item) => item.symbol)).catch(() => []),
  ]);

  return (
    <section className="watchlist-page">
      <div className="watchlist-page-header">
        <div>
          <span className="watchlist-eyebrow">Your market</span>
          <h1 className="watchlist-title">Watchlist</h1>
          <p className="watchlist-subtitle">Live quotes, price alerts, and the stories moving your companies.</p>
        </div>
        <SearchCommand initialStocks={initialStocks} label="Add stock" />
      </div>

      <WatchlistDashboard watchlist={stocksWithMarketData} />
      <WatchlistNews news={news} />
    </section>
  );
};

export default WatchlistPage;
