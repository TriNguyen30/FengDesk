import { useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl.js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { VIETMAP_TILEMAP_KEY } from "@/config/env";
import {
  vietmapAutocomplete,
  getPlaceCoordinates,
  type VietMapSearchResult,
} from "../api/geocoding";
import { Search } from "lucide-react";

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  zoomToLocation?: { lat: number; lng: number; zoom: number } | null;
}

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231]; // Mapbox GL uses [lng, lat]

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  zoomToLocation,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markerRef = useRef<vietmapgl.Marker | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VietMapSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] =
      latitude !== 0 && longitude !== 0 ? [longitude, latitude] : DEFAULT_CENTER;

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${VIETMAP_TILEMAP_KEY}`,
      center: initialCenter,
      zoom: 13,
      pitch: 0,
      hash: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (latitude !== 0 && longitude !== 0) {
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = getPinHtml();

        markerRef.current = new vietmapgl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
      }
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      onChange(lat, lng);

      if (!markerRef.current) {
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = getPinHtml();

        markerRef.current = new vietmapgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }

      map.flyTo({ center: [lng, lat], speed: 1.5 });
    });

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // Update marker when props change (externally)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (latitude !== 0 && longitude !== 0) {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  // Handle zoomToLocation requests
  useEffect(() => {
    if (!mapRef.current || !zoomToLocation) return;
    mapRef.current.flyTo({
      center: [zoomToLocation.lng, zoomToLocation.lat],
      zoom: zoomToLocation.zoom,
      speed: 1.5,
    });
  }, [zoomToLocation]);

  // Resize map when entering/exiting fullscreen
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
        onChange(lat, lng);

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Prioritize results near the current map center
        const center = mapRef.current?.getCenter();
        const focus = center ? { lat: center.lat, lng: center.lng } : undefined;
        const data = await vietmapAutocomplete(val, focus);
        setSearchResults(data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = async (result: VietMapSearchResult) => {
    const coords = await getPlaceCoordinates(result.ref_id);
    if (!coords) return;
    const { lat, lng } = coords;

    onChange(lat, lng);
    setSearchQuery(result.display);
    setSearchResults([]);

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });

      if (!markerRef.current) {
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = getPinHtml();

        markerRef.current = new vietmapgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
    }
  };

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
      <div ref={mapContainerRef} style={{ flex: 1, height: "100%", width: "100%", cursor: "crosshair" }} />

      {/* Custom Search Bar */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 60,
          maxWidth: 320,
          zIndex: 1000,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Search size={16} className="text-gray-400" />
            )}
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
            placeholder="Tìm kiếm địa điểm..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-100 divide-y divide-gray-100">
            {searchResults.map((result, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 truncate"
                onClick={() => handleSelectResult(result)}
                title={result.display}
                type="button"
              >
                {result.display}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordinate Chip */}
      {(latitude !== 0 || longitude !== 0) && (
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
      )}

      {/* Controls */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
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
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{ ...locateBtnStyle, marginBottom: 8 }}
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <button type="button" onClick={handleZoomIn} style={zoomBtnStyle} title="Zoom in">+</button>
          <div style={{ height: "0.5px", background: "#e0e0e0" }} />
          <button type="button" onClick={handleZoomOut} style={{ ...zoomBtnStyle, fontSize: 24 }} title="Zoom out">−</button>
        </div>

        <button type="button" onClick={handleLocate} style={locateBtnStyle} title="My location">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>

      <style>{`
        .custom-marker {
          width: 30px;
          height: 42px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -21px; /* Half height to anchor at bottom */
        }
        @keyframes pulse {
          0%   { transform:scale(0.5); opacity:0.8; }
          100% { transform:scale(2.2); opacity:0; }
        }
      `}</style>
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

function getPinHtml() {
  return `
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
  `;
}
