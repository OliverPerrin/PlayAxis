import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { safeURL } from "../ui";
export const hasCoordinates = (p) =>
  p?.latitude != null &&
  p.latitude !== "" &&
  p.longitude !== "" &&
  p?.longitude != null &&
  Number.isFinite(Number(p.latitude)) &&
  Number.isFinite(Number(p.longitude)) &&
  Math.abs(Number(p.latitude)) <= 85 &&
  Math.abs(Number(p.longitude)) <= 180;
function Controller({ center, selected, fitKey, points, onMove, onPointPick }) {
  const map = useMap();
  const firstFit = useRef(fitKey);
  useEffect(() => {
    map.setView(center, 13, { animate: false });
  }, [map, center]);
  useEffect(() => {
    if (hasCoordinates(selected))
      map.flyTo(
        [Number(selected.latitude), Number(selected.longitude)],
        Math.max(map.getZoom(), 16),
        {
          duration: 0.6,
          animate: !window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
        },
      );
  }, [map, selected]);
  useEffect(() => {
    if (firstFit.current !== fitKey && points.length) {
      firstFit.current = fitKey;
      map.fitBounds(
        points.map((p) => [Number(p.latitude), Number(p.longitude)]),
        { padding: [50, 50], maxZoom: 16 },
      );
    }
  }, [map, points, fitKey]);
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useMapEvents({
    click: (e) =>
      onPointPick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
    moveend: () => onMove?.(map.getCenter()),
    zoomend: () => onMove?.(map.getCenter()),
  });
  return null;
}
function Pins({ points, selectedId, onSelect }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups = useMemo(() => {
    const grid = new Map();
    for (const point of points) {
      const pixel = map.project(
        [Number(point.latitude), Number(point.longitude)],
        zoom,
      );
      const key =
        zoom >= 17
          ? point.id
          : `${Math.floor(pixel.x / 52)}:${Math.floor(pixel.y / 52)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(point);
    }
    return [...grid.values()];
  }, [points, zoom, map]);
  return groups.map((group) => {
    const first = group[0];
    const multiple = group.length > 1;
    const lat =
      group.reduce((v, p) => v + Number(p.latitude), 0) / group.length;
    const lon =
      group.reduce((v, p) => v + Number(p.longitude), 0) / group.length;
    const selected = group.some((p) => p.id === selectedId);
    const icon = L.divIcon({
      className: "map-cluster",
      html: multiple
        ? String(group.length)
        : '<span aria-hidden="true">•</span>',
      iconSize: multiple ? [38, 38] : selected ? [30, 30] : [23, 23],
    });
    return (
      <Marker
        key={`${first.id}:${multiple ? zoom : "one"}`}
        position={[lat, lon]}
        icon={icon}
        title={
          multiple
            ? `${group.length} places. Zoom to explore.`
            : first.name || first.title
        }
        alt={first.name || first.title}
        eventHandlers={{
          click: () => {
            if (multiple)
              map.fitBounds(
                group.map((p) => [Number(p.latitude), Number(p.longitude)]),
                { padding: [40, 40], maxZoom: Math.min(18, zoom + 3) },
              );
            else onSelect?.(first);
          },
        }}
      >
        <Popup>
          <h3>
            {multiple ? `${group.length} places` : first.name || first.title}
          </h3>
          {!multiple && (
            <>
              <p>{first.kind || first.sport || first.venue}</p>
              {first.opening_hours && <p>Hours: {first.opening_hours}</p>}
              {first.fee && <p>Entry fee: {first.fee}</p>}
              {safeURL(first.url) && (
                <a href={safeURL(first.url)} target="_blank" rel="noreferrer">
                  View place details
                </a>
              )}
            </>
          )}
        </Popup>
      </Marker>
    );
  });
}
export default function EventMap({
  points = [],
  events,
  center = [51.5072, -0.1276],
  selected,
  onSelect,
  fitKey = 0,
  onMove,
  onPointPick,
}) {
  const valid = useMemo(
    () => (events || points).filter(hasCoordinates),
    [events, points],
  );
  return (
    <MapContainer
      center={center}
      zoom={13}
      minZoom={3}
      maxZoom={19}
      preferCanvas
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url={
          process.env.REACT_APP_MAP_TILE_URL ||
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        attribution={
          process.env.REACT_APP_MAP_ATTRIBUTION ||
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
        maxZoom={19}
        detectRetina
      />
      <Controller
        center={center}
        selected={selected}
        fitKey={fitKey}
        points={valid}
        onMove={onMove}
        onPointPick={onPointPick}
      />
      <Pins points={valid} selectedId={selected?.id} onSelect={onSelect} />
    </MapContainer>
  );
}
