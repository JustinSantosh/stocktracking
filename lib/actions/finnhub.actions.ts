'use server';

import {
  formatArticle,
  formatChangePercent,
  formatMarketCapValue,
  formatPrice,
  getDateRange,
  validateArticle,
} from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { getCurrentWatchlistSymbols } from '@/lib/actions/watchlist.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';
const ALPHA_VANTAGE_BASE_URL = process.env.ALPHA_VANTAGE_BASE_URL ?? 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? '';

type FinnhubProfile = {
  name?: string;
  ticker?: string;
  exchange?: string;
  marketCapitalization?: number;
};

type FinnhubQuote = {
  c?: number;
  dp?: number;
};

type FinnhubMetrics = {
  metric?: {
    peBasicExclExtraTTM?: number;
    peTTM?: number;
  };
};

type FinnhubSearchResultWithExchange = FinnhubSearchResult & {
  exchange?: string;
};

const INDIAN_EXCHANGES = new Set(['BSE', 'NSE']);

function isIndianMarketStock(stock: StockWithWatchlistStatus) {
  const exchange = stock.exchange.toUpperCase();
  const symbol = stock.symbol.toUpperCase();

  return (
    INDIAN_EXCHANGES.has(exchange) ||
    symbol.endsWith('.BSE') ||
    symbol.endsWith('.NSE') ||
    symbol.endsWith('.NS') ||
    symbol.endsWith('.BO')
  );
}

function normalizeAlphaVantageExchange(symbol: string, region: string) {
  const upperSymbol = symbol.toUpperCase();
  const upperRegion = region.toUpperCase();

  if (upperSymbol.endsWith('.BSE') || upperSymbol.endsWith('.BO')) return 'BSE';
  if (upperSymbol.endsWith('.NSE') || upperSymbol.endsWith('.NS')) return 'NSE';
  if (upperRegion.includes('INDIA')) return 'India';

  return region || 'Global';
}

function toAlphaVantageTicker(symbol: string) {
  const upperSymbol = symbol.toUpperCase();

  if (upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.NSE')) {
    return `NSE:${upperSymbol.replace(/\.(NS|NSE)$/, '')}`;
  }

  if (upperSymbol.endsWith('.BO') || upperSymbol.endsWith('.BSE')) {
    return `BSE:${upperSymbol.replace(/\.(BO|BSE)$/, '')}`;
  }

  return upperSymbol;
}

function parseAlphaVantageTime(value?: string) {
  if (!value || value.length < 8) return Math.floor(Date.now() / 1000);

  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(9, 11) || '00';
  const minute = value.slice(11, 13) || '00';
  const second = value.slice(13, 15) || '00';

  return Math.floor(new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).getTime() / 1000);
}

async function getAlphaVantageNews(symbol: string): Promise<RawNewsArticle[]> {
  if (!ALPHA_VANTAGE_API_KEY) return [];

  try {
    const ticker = toAlphaVantageTicker(symbol);
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(ticker)}&limit=6&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const data = await fetchJSON<AlphaVantageNewsResponse>(url, 900);

    if (data.Note || data.Information || data.Error) {
      console.warn('Alpha Vantage news notice:', data.Note || data.Information || data.Error);
      return [];
    }

    return (data.feed || []).map((article, index) => ({
      id: parseAlphaVantageTime(article.time_published) + index,
      headline: article.title,
      summary: article.summary,
      source: article.source,
      url: article.url,
      datetime: parseAlphaVantageTime(article.time_published),
      image: article.banner_image,
      category: article.overall_sentiment_label || 'company',
      related: symbol,
    }));
  } catch (err) {
    console.warn('Alpha Vantage news fallback failed:', symbol, err);
    return [];
  }
}

async function searchAlphaVantageStocks(query: string): Promise<StockWithWatchlistStatus[]> {
  if (!ALPHA_VANTAGE_API_KEY) return [];

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const data = await fetchJSON<AlphaVantageSearchResponse>(url, 3600);
    const matches = data.bestMatches || [];

    if (data.Note || data.Information || data.Error) {
      console.error('Alpha Vantage search notice:', data.Note || data.Information || data.Error);
    }

    return matches
      .map((match) => ({
        symbol: match['1. symbol'].toUpperCase(),
        name: match['2. name'],
        exchange: normalizeAlphaVantageExchange(match['1. symbol'], match['4. region']),
        type: match['3. type'] || 'Stock',
        isInWatchlist: false,
      }))
      .filter(isIndianMarketStock)
      .slice(0, 15);
  } catch (err) {
    console.error('Alpha Vantage fallback search failed:', err);
    return [];
  }
}

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export async function getWatchlistMarketData(
  watchlist: StockWithData[]
): Promise<StockWithData[]> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token || watchlist.length === 0) return watchlist;

  return Promise.all(
    watchlist.map(async (item) => {
      const symbol = item.symbol.toUpperCase();

      try {
        const [quoteResult, profileResult, metricsResult] = await Promise.allSettled([
          fetchJSON<FinnhubQuote>(
            `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
            60
          ),
          fetchJSON<FinnhubProfile>(
            `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`,
            3600
          ),
          fetchJSON<FinnhubMetrics>(
            `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`,
            3600
          ),
        ]);

        const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : {};
        const profile = profileResult.status === 'fulfilled' ? profileResult.value : {};
        const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : {};
        const currentPrice = Number(quote.c) || undefined;
        const changePercent = Number.isFinite(quote.dp) ? quote.dp : undefined;
        const marketCapMillions = Number(profile.marketCapitalization);
        const peRatio = metrics.metric?.peBasicExclExtraTTM ?? metrics.metric?.peTTM;

        return {
          ...item,
          company: profile.name || item.company,
          currentPrice,
          changePercent,
          priceFormatted: currentPrice ? formatPrice(currentPrice) : '—',
          changeFormatted:
            changePercent === undefined ? '—' : formatChangePercent(changePercent) || '0.00%',
          marketCap:
            Number.isFinite(marketCapMillions) && marketCapMillions > 0
              ? formatMarketCapValue(marketCapMillions * 1_000_000)
              : '—',
          peRatio:
            Number.isFinite(peRatio) && Number(peRatio) > 0 ? Number(peRatio).toFixed(1) : '—',
        };
      } catch (error) {
        console.warn('Watchlist market data unavailable for', symbol, error);
        return item;
      }
    })
  );
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            const validArticles = (articles || []).filter(validateArticle);
            perSymbolArticles[sym] = validArticles.length > 0 ? validArticles : await getAlphaVantageNews(sym);
          } catch (e) {
            console.warn('Finnhub company news unavailable, using fallback for', sym, e);
            perSymbolArticles[sym] = await getAlphaVantageNews(sym);
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const watchlistSymbols = new Set(await getCurrentWatchlistSymbols());
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResultWithExchange[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<FinnhubProfile>(url, 3600);
            return { sym, profile };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResultWithExchange = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
            exchange,
          };
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = r.exchange;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
        isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    const mappedWithWatchlist = mapped.map((stock) => ({
      ...stock,
      isInWatchlist: watchlistSymbols.has(stock.symbol.toUpperCase()),
    }));

    if (trimmed) {
      const indianResults = mappedWithWatchlist.filter(isIndianMarketStock);
      if (indianResults.length > 0) return indianResults;

      if (!indianResults.length) {
        const alphaVantageResults = await searchAlphaVantageStocks(trimmed);
        if (alphaVantageResults.length > 0) {
          return alphaVantageResults.map((stock) => ({
            ...stock,
            isInWatchlist: watchlistSymbols.has(stock.symbol.toUpperCase()),
          }));
        }
      }
    }

    return mappedWithWatchlist;
  } catch (err) {
    console.error('Error in stock search:', err);
    if (query?.trim()) return searchAlphaVantageStocks(query.trim());
    return [];
  }
};

