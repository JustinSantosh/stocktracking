"use client";
import React, { useMemo, useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = () => {
    startTransition(async () => {
      const next = !added;
      setAdded(next);
      onWatchlistChange?.(symbol, next);

      const result = next
        ? await addToWatchlist(symbol, company)
        : await removeFromWatchlist(symbol);

      if (!result.success) {
        setAdded(!next);
        onWatchlistChange?.(symbol, !next);
        toast.error(result.error || "Could not update watchlist.");
        return;
      }

      toast.success(next ? "Added to watchlist" : "Removed from watchlist");
    });
  };

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
        disabled={isPending}
      >
        <Star className="star-icon" fill={added ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <button className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} onClick={handleClick} disabled={isPending}>
      {showTrashIcon && added ? (
        <Trash2 className="w-5 h-5 mr-2" />
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
