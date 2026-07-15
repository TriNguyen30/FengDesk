import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

// Google Maps-style red pin icon
const createGooglePin = () =>
  L.divIcon({
    className: "",
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    html: `
      <div style="position:relative;width:30px;height:42px;">
        <div style="
          position:absolute;top:0;left:0;right:0;bottom:0;
          animation:pulse 1.8s ease-out infinite;
          border-radius:50%;
          background:rgba(234,67,53,0.25);
          width:44px;height:44px;
          top:-7px;left:-7px;
        "></div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42"
          style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));position:relative;z-index:1;">
          <path d="M15 0C7.27 0 1 6.27 1 14c0 10.5 14 28 14 28S29 24.5 29 14C29 6.27 22.73 0 15 0z" fill="#ea4335"/>
          <circle cx="15" cy="14" r="6" fill="white"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0%   { transform:scale(0.5); opacity:0.8; }
          100% { transform:scale(2.2); opacity:0; }
        }
      </style>
    `,
  });

const MAP_TILES = {
  street: {
    label: "Bản đồ",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    label: "Vệ tinh",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  terrain: {
    label: "Địa hình",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};

type TileKey = keyof typeof MAP_TILES;

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  zoomToLocation?: { lat: number; lng: number; zoom: number } | null;
}

// Zoom control buttons (replaces Leaflet's default)
function CustomZoomControls({
  isFullscreen,
  toggleFullscreen,
}: {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}) {
  const map = useMap();
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      L.DomEvent.disableClickPropagation(divRef.current);
      L.DomEvent.disableScrollPropagation(divRef.current);
    }
  }, []);

  return (
    <div
      ref={divRef}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        style={{ ...locateBtnStyle, marginBottom: 8 }}
        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5f6368"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5f6368"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>

      <div
        style={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          overflow: "hidden",
          border: "0.5px solid rgba(0,0,0,0.1)",
        }}
      >
        <button
          type="button"
          onClick={() => map.zoomIn()}
          style={zoomBtnStyle}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <div style={{ height: "0.5px", background: "#e0e0e0" }} />
        <button
          type="button"
          onClick={() => map.zoomOut()}
          style={{ ...zoomBtnStyle, fontSize: 24 }}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
      <button
        type="button"
        onClick={() => map.locate({ setView: true, maxZoom: 15 })}
        style={locateBtnStyle}
        title="My location"
        aria-label="My location"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4285F4"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 20,
  color: "#3c4043",
  fontWeight: 300,
  lineHeight: 1,
};

const locateBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  background: "white",
  borderRadius: 2,
  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  border: "0.5px solid rgba(0,0,0,0.1)",
  cursor: "pointer",
  marginTop: 4,
};

// Handles click-to-place marker
function LocationMarker({ latitude, longitude, onChange }: LocationPickerMapProps) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom(), { animate: true, duration: 0.4 });
    },
    locationfound(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
    locationerror(e) {
      console.warn("Could not find location:", e.message);
    },
  });

  useEffect(() => {
    if (latitude !== 0 && longitude !== 0) {
      map.flyTo([latitude, longitude], map.getZoom(), { animate: true, duration: 0.4 });
    }
  }, [latitude, longitude, map]);

  if (latitude === 0 && longitude === 0) return null;

  return <Marker position={[latitude, longitude]} icon={createGooglePin()} />;
}

// Coordinate info chip shown at the bottom
function CoordinateChip({ latitude, longitude }: { latitude: number; longitude: number }) {
  if (latitude === 0 && longitude === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "white",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#3c4043",
        whiteSpace: "nowrap",
        border: "0.5px solid rgba(0,0,0,0.08)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#ea4335">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
      {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
    </div>
  );
}

function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Delay slightly to let the CSS transition/DOM update finish
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreen, map]);
  return null;
}

function SearchControl({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    // @ts-ignore
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Tìm kiếm địa điểm...",
    });

    map.addControl(searchControl);

    const handleShowLocation = (e: any) => {
      if (e.location) {
        onChange(e.location.y, e.location.x);
      }
    };

    map.on("geosearch/showlocation", handleShowLocation);

    return () => {
      map.removeControl(searchControl);
      map.off("geosearch/showlocation", handleShowLocation);
    };
  }, [map, onChange]);

  return null;
}

// Handles external zoom-to-location requests from parent
function MapZoomToLocation({
  zoomToLocation,
}: {
  zoomToLocation?: { lat: number; lng: number; zoom: number } | null;
}) {
  const map = useMap();
  const lastZoomRef = useRef<string>("");

  useEffect(() => {
    if (!zoomToLocation) return;
    const key = `${zoomToLocation.lat},${zoomToLocation.lng},${zoomToLocation.zoom}`;
    if (key === lastZoomRef.current) return;
    lastZoomRef.current = key;
    map.flyTo([zoomToLocation.lat, zoomToLocation.lng], zoomToLocation.zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [zoomToLocation, map]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  zoomToLocation,
}: LocationPickerMapProps) {
  const [tileKey, setTileKey] = useState<TileKey>("street");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (switcherRef.current) {
      L.DomEvent.disableClickPropagation(switcherRef.current);
      L.DomEvent.disableScrollPropagation(switcherRef.current);
    }
  }, []);

  const defaultCenter: [number, number] = [10.8231, 106.6297];
  const center: [number, number] =
    latitude !== 0 && longitude !== 0 ? [latitude, longitude] : defaultCenter;

  const tile = MAP_TILES[tileKey];

  return (
    <div
      style={
        isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: "white",
              display: "flex",
              flexDirection: "column",
            }
          : {
              position: "relative",
              height: 300,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #e0e0e0",
            }
      }
    >
      {/* Map type switcher */}
      <div
        ref={switcherRef}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 72,
          left: 12,
          zIndex: 1000,
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          overflow: "hidden",
          display: "flex",
          border: "0.5px solid rgba(0,0,0,0.1)",
        }}
      >
        {(Object.keys(MAP_TILES) as TileKey[]).map((key, i, arr) => (
          <button
            type="button"
            key={key}
            onClick={() => setTileKey(key)}
            style={{
              background: tileKey === key ? "#f8f9fa" : "white",
              border: "none",
              borderRight: i < arr.length - 1 ? "0.5px solid #e0e0e0" : "none",
              padding: "0 12px",
              height: 36,
              fontSize: 13,
              fontFamily: "inherit",
              color: tileKey === key ? "#1a73e8" : "#3c4043",
              cursor: "pointer",
              fontWeight: tileKey === key ? 500 : 400,
            }}
          >
            {MAP_TILES[key].label}
          </button>
        ))}
      </div>

      {/* Coordinate chip */}
      <CoordinateChip latitude={latitude} longitude={longitude} />

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false} // hide default, we use custom
        style={{ flex: 1, height: "100%", width: "100%", cursor: "crosshair" }}
      >
        <MapResizer isFullscreen={isFullscreen} />
        <TileLayer key={tileKey} attribution={tile.attribution} url={tile.url} />
        <LocationMarker latitude={latitude} longitude={longitude} onChange={onChange} />
        <SearchControl onChange={onChange} />
        <MapZoomToLocation zoomToLocation={zoomToLocation} />
        <CustomZoomControls
          isFullscreen={isFullscreen}
          toggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      </MapContainer>

      {/* Attribution */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 8,
          zIndex: 999,
          fontSize: 10,
          color: "#70757a",
          background: "rgba(255,255,255,0.7)",
          padding: "1px 4px",
          borderRadius: 2,
        }}
      >
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
