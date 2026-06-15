import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in leaflet with React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ latitude, longitude, onChange }: LocationPickerMapProps) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (latitude !== 0 && longitude !== 0) {
      // We don't flyTo here immediately on load to prevent jumping if user just opens modal
      // but we could if we wanted to center it.
    }
  }, [latitude, longitude, map]);

  return latitude === 0 && longitude === 0 ? null : (
    <Marker position={[latitude, longitude]}></Marker>
  );
}

export default function LocationPickerMap({ latitude, longitude, onChange }: LocationPickerMapProps) {
  // Default center: Ho Chi Minh City
  const defaultCenter: [number, number] = [10.8231, 106.6297];

  const center: [number, number] = latitude !== 0 && longitude !== 0 
    ? [latitude, longitude] 
    : defaultCenter;

  return (
    <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker latitude={latitude} longitude={longitude} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
