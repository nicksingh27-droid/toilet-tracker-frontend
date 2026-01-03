import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ToiletMap = ({ toilets = [], center = [51.505, -0.09], onLogLocation }) => {
  return (
    <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {toilets.map(toilet => (
        <Marker key={toilet._id} position={[toilet.location.coordinates[1], toilet.location.coordinates[0]]}>
          <Popup>{toilet.name}<br />Visited: {new Date(toilet.visitedAt).toLocaleDateString()}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ToiletMap;