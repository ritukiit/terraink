import { useEffect, useRef, useState } from "react";
import { ADSENSE_AD_CLIENT } from "@/core/config";

interface AdUnitProps {
  slot: string;
  /** Whether this ad type is enabled (driven by its VITE_ADS_*_ENABLED flag). */
  enabled?: boolean;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export default function AdUnit({
  slot,
  enabled = true,
  format = "auto",
  label = "Ads keep Terraink free",
  className,
}: AdUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled || !slot || !ADSENSE_AD_CLIENT) return;
    const ins = insRef.current;
    if (!ins) return;

    let statusObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // AdSense rejects a slot pushed at width 0 ("availableWidth=0") and never
    // retries it. Only push once the slot has a real width, then watch the
    // data-ad-status AdSense writes and hide only on an explicit "unfilled".
    const pushWhenSized = () => {
      if (pushed.current || ins.offsetWidth === 0) return;
      pushed.current = true;
      resizeObserver?.disconnect();

      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // ignore — ad blocker or script not yet loaded
      }

      statusObserver = new MutationObserver(() => {
        if (ins.getAttribute("data-ad-status") === "unfilled") setHidden(true);
      });
      statusObserver.observe(ins, {
        attributes: true,
        attributeFilter: ["data-ad-status"],
      });
    };

    // Push now if already visible; otherwise wait for the panel to gain width
    // (e.g. a collapsed/off-screen section becoming visible).
    pushWhenSized();
    if (!pushed.current) {
      resizeObserver = new ResizeObserver(pushWhenSized);
      resizeObserver.observe(ins);
    }

    return () => {
      resizeObserver?.disconnect();
      statusObserver?.disconnect();
    };
  }, [enabled, slot]);

  if (!enabled || !ADSENSE_AD_CLIENT || !slot || hidden) return null;

  return (
    <div className={`ad-unit-slot${className ? ` ${className}` : ""}`}>
      <p className="panel-ad-label">{label}</p>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
