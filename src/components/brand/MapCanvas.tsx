import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { CARTO_LIGHT_STYLE, MARKER_COLOR, type MapPoint } from "@/lib/maps/carto";

type Props = {
  points: MapPoint[];
  /** Fallback centre when there is nothing to plot. */
  center?: [number, number];
  zoom?: number;
  className?: string;
  interactivePopups?: boolean;
};

function exactMarkerEl() {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <circle cx="11" cy="11" r="9" fill="${MARKER_COLOR}" fill-opacity="0.22" />
    <circle cx="11" cy="11" r="5" fill="${MARKER_COLOR}" />
  </svg>`;
  el.style.cursor = "pointer";
  return el;
}

function areaMarkerEl() {
  const el = document.createElement("div");
  el.style.width = "88px";
  el.style.height = "88px";
  el.style.borderRadius = "9999px";
  el.style.background = `${MARKER_COLOR}26`;
  el.style.border = `1px solid ${MARKER_COLOR}59`;
  el.style.cursor = "pointer";
  return el;
}

function popupHtml(p: MapPoint) {
  const title = p.title ?? "";
  const meta = p.meta ? `<div style="opacity:.7;margin-top:2px">${p.meta}</div>` : "";
  const body = `<div style="font-size:13px;line-height:1.35"><strong>${title}</strong>${meta}</div>`;
  return p.href
    ? `<a href="${p.href}" style="text-decoration:none;color:inherit">${body}</a>`
    : body;
}

/**
 * MapLibre canvas with CARTO raster tiles. Initialised lazily the first
 * time it scrolls into view so listing pages stay light.
 */
export default function MapCanvas({
  points,
  center,
  zoom = 12,
  className,
  interactivePopups = false,
}: Props) {
  const holder = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !holder.current) return;
    const first = points[0];
    const map = new maplibregl.Map({
      container: holder.current,
      style: CARTO_LIGHT_STYLE as any,
      center: center ?? (first ? [first.lng, first.lat] : [10.45, 51.16]),
      zoom: first?.precision === "approximate" ? Math.max(zoom - 2, 9) : zoom,
      scrollZoom: false,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    for (const p of points) {
      const el = p.precision === "exact" ? exactMarkerEl() : areaMarkerEl();
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]);
      if (interactivePopups && p.title) {
        marker.setPopup(
          new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(popupHtml(p)),
        );
      }
      marker.addTo(map);
    }

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 64, maxZoom: 13, duration: 0 });
    }

    return () => map.remove();
  }, [visible, points, center, zoom, interactivePopups]);

  return <div ref={holder} className={className} />;
}
