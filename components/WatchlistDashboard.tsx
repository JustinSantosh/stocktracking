"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, BellRing, Trash2 } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SavedAlert = {
  id: string;
  symbol: string;
  company: string;
  condition: "above" | "below";
  threshold: number;
};

const ALERTS_STORAGE_KEY = "signalist-watchlist-alerts";

export default function WatchlistDashboard({ watchlist }: WatchlistTableProps) {
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockWithData | null>(null);
  const [condition, setCondition] = useState<SavedAlert["condition"]>("above");
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ALERTS_STORAGE_KEY);
      if (saved) setAlerts(JSON.parse(saved) as SavedAlert[]);
    } catch {
      window.localStorage.removeItem(ALERTS_STORAGE_KEY);
    }
  }, []);

  const stocksBySymbol = useMemo(
    () => new Map(watchlist.map((stock) => [stock.symbol, stock])),
    [watchlist]
  );

  const openAlertDialog = (stock?: StockWithData) => {
    const nextStock = stock || watchlist[0];
    if (!nextStock) return;
    setSelectedStock(nextStock);
    setCondition("above");
    setThreshold(nextStock.currentPrice ? nextStock.currentPrice.toFixed(2) : "");
  };

  const saveAlerts = (nextAlerts: SavedAlert[]) => {
    setAlerts(nextAlerts);
    window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(nextAlerts));
  };

  const createAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Number(threshold);
    if (!selectedStock || !Number.isFinite(target) || target <= 0) return;

    saveAlerts([
      {
        id: crypto.randomUUID(),
        symbol: selectedStock.symbol,
        company: selectedStock.company,
        condition,
        threshold: target,
      },
      ...alerts,
    ]);
    setSelectedStock(null);
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter((alert) => alert.id !== id));
  };

  return (
    <div className="watchlist-dashboard">
      <div className="watchlist-table-shell">
        <div className="watchlist-table-scroll scrollbar-hide-default">
          <table className="watchlist-data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Symbol</th>
                <th>Price</th>
                <th>Change</th>
                <th>Market cap</th>
                <th>P/E ratio</th>
                <th className="text-right">Alert</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((stock) => (
                <tr key={stock.symbol}>
                  <td>
                    <div className="watchlist-company-cell">
                      <span className="watchlist-star-cell">
                        <WatchlistButton
                          symbol={stock.symbol}
                          company={stock.company}
                          isInWatchlist
                          type="icon"
                        />
                      </span>
                      <Link href={`/stocks/${stock.symbol}`} className="watchlist-company-link">
                        {stock.company}
                      </Link>
                    </div>
                  </td>
                  <td className="watchlist-symbol-cell">{stock.symbol}</td>
                  <td>{stock.priceFormatted || "—"}</td>
                  <td>
                    <span
                      className={
                        stock.changePercent === undefined
                          ? "watchlist-change-neutral"
                          : stock.changePercent >= 0
                            ? "watchlist-change-up"
                            : "watchlist-change-down"
                      }
                    >
                      {stock.changeFormatted || "—"}
                    </span>
                  </td>
                  <td>{stock.marketCap || "—"}</td>
                  <td>{stock.peRatio || "—"}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="watchlist-alert-button"
                      onClick={() => openAlertDialog(stock)}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Add alert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside id="watchlist-alerts" className="watchlist-alert-panel">
        <div className="watchlist-alert-header">
          <div>
            <span className="watchlist-eyebrow">Monitoring</span>
            <h2>Price alerts</h2>
          </div>
          <button type="button" className="watchlist-create-alert" onClick={() => openAlertDialog()}>
            <Bell className="h-4 w-4" />
            Create
          </button>
        </div>

        <div className="watchlist-alert-items scrollbar-hide-default">
          {alerts.length === 0 ? (
            <div className="watchlist-alert-empty">
              <span className="watchlist-alert-empty-icon"><BellRing /></span>
              <h3>No price alerts yet</h3>
              <p>Create an alert from any stock in your watchlist.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const stock = stocksBySymbol.get(alert.symbol);
              return (
                <article key={alert.id} className="watchlist-alert-card">
                  <div className="watchlist-alert-card-top">
                    <div>
                      <span>{alert.company}</span>
                      <strong>{alert.symbol}</strong>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${alert.symbol} alert`}
                      onClick={() => removeAlert(alert.id)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <div className="watchlist-alert-current">
                    <span>Current price</span>
                    <strong>{stock?.priceFormatted || "—"}</strong>
                  </div>
                  <div className="watchlist-alert-rule">
                    Price {alert.condition} <strong>${alert.threshold.toFixed(2)}</strong>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>

      <Dialog open={Boolean(selectedStock)} onOpenChange={(open) => !open && setSelectedStock(null)}>
        <DialogContent className="watchlist-alert-dialog">
          <DialogHeader>
            <DialogTitle>Create a price alert</DialogTitle>
            <DialogDescription>
              Monitor {selectedStock?.company} ({selectedStock?.symbol}) against a target price.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createAlert} className="watchlist-alert-form">
            <label>
              Condition
              <select value={condition} onChange={(event) => setCondition(event.target.value as SavedAlert["condition"])}>
                <option value="above">Price moves above</option>
                <option value="below">Price moves below</option>
              </select>
            </label>
            <label>
              Target price (USD)
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <p>Alerts created here are saved in this browser.</p>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSelectedStock(null)}>Cancel</Button>
              <Button type="submit" className="watchlist-dialog-submit">Create alert</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
