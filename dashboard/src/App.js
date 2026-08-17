import React, { useEffect, useState } from 'react';
import { Activity, Users, ShieldAlert } from 'lucide-react';
import LiveMap from './components/LiveMap';
import AlertPanel from './components/AlertPanel';
import AnalyticsChart from './components/AnalyticsChart';

function App() {
  const [telemetry, setTelemetry] = useState({
    person_count: 0,
    density_per_m2: 0,
    flow_speed: 0,
    risk_level: 'NORMAL'
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws;
    let timer;

    // Dynamically choose between local IPv4 and live Render secure WebSocket (wss://)
    const BACKEND_WS_URL =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'ws://127.0.0.1:8000/ws/stream?stream_url=0'
        : 'wss://crowdshield-backend.onrender.com/ws/stream?stream_url=0';

    const connect = () => {
      ws = new WebSocket(BACKEND_WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.error) {
            setTelemetry(data);
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatically try reconnecting every 2 seconds if disconnected
        timer = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>CROWDSHIELD // Command Center</h2>
        <span style={{ padding: '6px 12px', borderRadius: '12px', backgroundColor: isConnected ? '#16a34a' : '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>
          {isConnected ? 'LIVE ENGINE CONNECTED' : 'ENGINE DISCONNECTED'}
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><Users size={18} /> Live People Count</div>
          <h1 style={{ fontSize: '32px', margin: '8px 0 0 0' }}>{telemetry.person_count}</h1>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><Activity size={18} /> Density (persons/m²)</div>
          <h1 style={{ fontSize: '32px', margin: '8px 0 0 0' }}>{telemetry.density_per_m2}</h1>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><Activity size={18} /> Dynamic Velocity</div>
          <h1 style={{ fontSize: '32px', margin: '8px 0 0 0' }}>{telemetry.flow_speed} m/s</h1>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><ShieldAlert size={18} /> Threat Index</div>
          <h1 style={{ fontSize: '24px', margin: '8px 0 0 0', color: telemetry.risk_level === 'CRITICAL' ? '#ef4444' : telemetry.risk_level === 'WARNING' ? '#f59e0b' : '#10b981' }}>
            {telemetry.risk_level}
          </h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <LiveMap telemetry={telemetry} />
        <AlertPanel telemetry={telemetry} />
      </div>

      <AnalyticsChart telemetry={telemetry} />
    </div>
  );
}

export default App;
