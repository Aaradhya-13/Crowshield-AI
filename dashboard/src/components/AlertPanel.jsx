import React, { useEffect, useRef } from 'react';
import { ShieldAlert, Volume2 } from 'lucide-react';

const AlertPanel = ({ telemetry }) => {
  const isCritical = telemetry?.risk_level === 'CRITICAL';
  const isWarning = telemetry?.risk_level === 'WARNING';
  const lastAlertTimeRef = useRef(0);

  // AUTOMATED ALARM TRIGGER CONNECTED TO SOFTWARE
  useEffect(() => {
    const now = Date.now();
    // Cooldown of 5 seconds between automated voice alarms to prevent audio overlapping
    if (isCritical && now - lastAlertTimeRef.current > 5000) {
      lastAlertTimeRef.current = now;

      // 1. Web Audio API Emergency Beep
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch alarm
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6); // 0.6s beep
      } catch (e) {
        console.error("Audio error:", e);
      }

      // 2. Automated Text-To-Speech Emergency Announcement
      const speech = new SpeechSynthesisUtterance("Emergency Alert! Critical crowd density detected in Zone A. Evacuate through Gate 2 immediately.");
      speech.rate = 1.0;
      speech.pitch = 1.1;
      window.speechSynthesis.speak(speech);
    }
  }, [isCritical]);

  const triggerManualAnnouncement = () => {
    const speech = new SpeechSynthesisUtterance(`Attention: Current status is ${telemetry?.risk_level}. Please maintain steady movement.`);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: `2px solid ${isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color={isCritical ? '#ef4444' : '#10b981'} />
          Automated Intervention Panel
        </h3>
        <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981', color: '#000', fontWeight: 'bold', fontSize: '11px' }}>
          {telemetry?.risk_level || 'NORMAL'}
        </span>
      </div>

      <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: isCritical ? '#ef4444' : '#38bdf8' }}>
          {isCritical ? 'CRITICAL BOTTLENECK ACTION PLAN' : 'CROWD FLOW OPTIMAL'}
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
          {isCritical
            ? 'Software automated alert triggered. Diverting pedestrians to Exit Gate 2 & Gate 3.'
            : 'All sectors operating within normal capacity limits.'}
        </p>
      </div>

      <button
        onClick={triggerManualAnnouncement}
        style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Volume2 size={16} /> Broadcast Manual PA Announcement
      </button>
    </div>
  );
};

export default AlertPanel;