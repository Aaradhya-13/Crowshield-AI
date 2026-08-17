import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const LiveMap = ({ telemetry }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState({
    lat: 20.3010,
    lng: 85.8236
  });

  const isCritical = telemetry?.risk_level === 'CRITICAL';
  const isWarning = telemetry?.risk_level === 'WARNING';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedLocation.lat, selectedLocation.lng],
        zoom: 16
      });

      // Detailed OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Add Additional Camera Nodes to the Map
      const cameraNodes = [
        { name: "Camera 01 - Main Gate", lat: 20.3020, lng: 85.8240 },
        { name: "Camera 02 - North Flyover", lat: 20.3000, lng: 85.8220 },
        { name: "Emergency Exit Gate 02", lat: 20.2990, lng: 85.8250 }
      ];

      cameraNodes.forEach(node => {
        L.marker([node.lat, node.lng])
          .addTo(map)
          .bindPopup(`<b>${node.name}</b><br>Status: ACTIVE ONLINE`);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) });
      });

      mapInstanceRef.current = map;
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const circleColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
    const radiusMeters = Math.max(40, (telemetry?.person_count || 1) * 15);

    if (markerRef.current) markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
    else markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);

    if (circleRef.current) {
      circleRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      circleRef.current.setRadius(radiusMeters);
      circleRef.current.setStyle({ color: circleColor, fillColor: circleColor });
    } else {
      circleRef.current = L.circle([selectedLocation.lat, selectedLocation.lng], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.3,
        radius: radiusMeters
      }).addTo(map);
    }
  }, [selectedLocation, telemetry, isCritical, isWarning]);

  return (
    <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>
          Multi-Camera & GIS Zone Control
        </h3>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Click anywhere to place AI Sensor Node ({selectedLocation.lat}, {selectedLocation.lng})
        </span>
      </div>
      <div ref={mapContainerRef} style={{ height: '340px', width: '100%', borderRadius: '6px' }} />
    </div>
  );
};

export default LiveMap;