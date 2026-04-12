import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;

// Generate unique color from userId
const getUserColor = (userId) => {
  if (!userId) return '#00d4ff'; // Default cyan
  
  // Simple hash function to generate consistent color from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hue (0-360)
  const hue = Math.abs(hash % 360);
  
  // Return HSL color with high saturation and medium lightness
  return `hsl(${hue}, 80%, 50%)`;
};

// Create custom icon for each user
const createUserIcon = (color, isGolden = false) => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Pin shadow -->
      <ellipse cx="16" cy="39" rx="8" ry="3" fill="rgba(0,0,0,0.3)"/>
      <!-- Pin body -->
      <path d="M16 0 C7 0, 0 7, 0 16 C0 24, 16 42, 16 42 S32 24, 32 16 C32 7, 25 0, 16 0 Z" 
            fill="${isGolden ? '#FFD700' : color}" 
            stroke="${isGolden ? '#FFA500' : '#fff'}" 
            stroke-width="2" 
            filter="url(#shadow)"/>
      <!-- Toilet emoji or crown -->
      <text x="16" y="${isGolden ? '19' : '20'}" 
            text-anchor="middle" 
            font-size="${isGolden ? '16' : '18'}" 
            fill="#fff">
        ${isGolden ? '👑' : '🚽'}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-toilet-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

const ToiletMap = ({ toilets = [], center = [51.505, -0.09], currentUserId }) => {
  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ 
        height: '500px', 
        width: '100%',
        borderRadius: '15px',
        border: '2px solid #00d4ff',
        boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)'
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {toilets.map(toilet => {
        const userColor = getUserColor(toilet.userId);
        const isCurrentUser = toilet.userId === currentUserId;
        const icon = createUserIcon(userColor, toilet.isGoldenBowl);
        
        return (
          <Marker 
            key={toilet._id} 
            position={[toilet.location.coordinates[1], toilet.location.coordinates[0]]}
            icon={icon}
          >
            <Popup>
              <div style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                <strong style={{ 
                  fontSize: '1.2em', 
                  color: toilet.isGoldenBowl ? '#FFD700' : '#00d4ff',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  {toilet.isGoldenBowl && '👑 '}{toilet.name}
                </strong>
                <div style={{ marginBottom: '5px', color: '#666' }}>
                  👤 <strong style={{ color: userColor }}>{toilet.userName}</strong>
                  {isCurrentUser && ' (You)'}
                </div>
                <div style={{ marginBottom: '5px', fontSize: '0.9em', color: '#888' }}>
                  📍 {toilet.address || 'GPS Location'}
                </div>
                <div style={{ fontSize: '0.85em', color: '#aaa' }}>
                  🕐 {new Date(toilet.visitedAt).toLocaleDateString()}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default ToiletMap;
