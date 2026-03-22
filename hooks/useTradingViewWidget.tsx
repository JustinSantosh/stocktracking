'use client';
import { useEffect, useRef }     from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (container.dataset.loaded) return;

        const widget = document.createElement("div");
        widget.className = "tradingview-widget-container__widget";
        widget.style.width = "100%";
        widget.style.height = `${height}px`;

        container.innerHTML = "";
        container.appendChild(widget);

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        container.appendChild(script);
        container.dataset.loaded = 'true';

        return () => {
            container.innerHTML = '';
            delete container.dataset.loaded;
        }
    }, [scriptUrl, config, height])

    return containerRef;
}
export default useTradingViewWidget
