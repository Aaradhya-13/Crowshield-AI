import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AnalyticsChart = ({ telemetry }) => {
  const [dataHistory, setDataHistory] = useState([]);

  useEffect(() => {
    if (!telemetry) return;

    const timeString = new Date().toLocaleTimeString().split(' ')[0];
    const newPoint = {
      time: timeString,
      density: Number(telemetry.density_per_m2) || 0,
      count: Number(telemetry.person_count) || 0,
      speed: Number(telemetry.flow_speed) || 0,
    };

    setDataHistory((prevHistory) => {
      const updated = [...prevHistory, newPoint];
      return updated.slice(-20);
    });
  }, [telemetry]);

  return (
    <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>
          Real-Time Spatial Density Trend (persons/m²)
        </h3>
        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
          Live Rate: {telemetry?.density_per_m2 || 0} persons/m²
        </span>
      </div>

      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataHistory}>
            <defs>
              <linearGradient id="densityColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 'auto']} stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
              itemStyle={{ color: '#ef4444' }}
            />
            <Area
              type="monotone"
              dataKey="density"
              stroke="#ef4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#densityColor)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;