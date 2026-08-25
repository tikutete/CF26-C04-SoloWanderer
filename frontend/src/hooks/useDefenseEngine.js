import { useEffect, useRef, useState, useCallback } from 'react';

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const IDLE_TELEMETRY = [
  'F5 CORE-SW    uplink stable',
  'F2 F2-PC-03   FLOW NORMAL -> gateway',
  'F3 F3-PRN-01  print queue idle',
  'F1 LOBBY-WIFI clients: 6 associated',
  'F4 DEV-SRV-01 heartbeat ok',
  'F5 DC-01      auth cache synced',
  'F3 F3-PC-05   FLOW NORMAL',
  'F2 BADGE-RDR  scan accepted',
  'F5 FIREWALL   egress ruleset ok',
];

// Hardware-demo lateral path (ordered): F1 badge -> F2 badge -> F3 switch -> F3 cloud gw -> Domain -> Mail
export const HW_PATH = ['10.0.1.13', '10.0.2.24', '10.0.3.1', '10.0.3.21', '10.0.5.2', '10.0.5.13'];
const BADGE_BY_FLOOR = { 1: '10.0.1.13', 2: '10.0.2.24' };
const F3_SWITCH = '10.0.3.1';
const DOMAIN = '10.0.5.2';

let TID = 0;
const tid = () => `t${(TID += 1)}-${Math.random().toString(36).slice(2)}`;

/**
 * SABRE engine. Merges the in-app Terminal attack chain (attackLog) and the
 * external hardware demo (demoEvents: ESP32 RFID + Termux phone) into the
 * live-panel state, plus lit devices + reconstruction stages for the topology.
 */
export default function useDefenseEngine(attackLog, demoEvents, autoDefense) {
  const [score, setScore] = useState(96);
  const [scoreMode, setScoreMode] = useState('idle'); // idle | warn | crit
  const [telemetry, setTelemetry] = useState([]); // { id, text, kind }
  const [preempt, setPreempt] = useState(null); // { text, level }
  const [alerts, setAlerts] = useState([]); // { id, text, level }
  const [reconStage, setReconStage] = useState(0); // terminal reconstruction 0..4
  const [analysisKind, setAnalysisKind] = useState(null); // null | 'terminal' | 'hardware'
  const [reconstructing, setReconstructing] = useState(false);
  const [litIps, setLitIps] = useState(() => new Set());
  const [hwRevealed, setHwRevealed] = useState(0); // hardware path nodes revealed 0..6

  const procTerm = useRef(0);
  const procDemo = useRef(0);
  const timers = useRef([]);
  const preemptTimer = useRef(null);
  const scoreModeRef = useRef('idle');
  scoreModeRef.current = scoreMode;
  const defenseRef = useRef(autoDefense);
  defenseRef.current = autoDefense;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (preemptTimer.current) { clearTimeout(preemptTimer.current); preemptTimer.current = null; }
  }, []);

  const addTimer = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const pushTelemetry = useCallback((text, kind = 'info') => {
    setTelemetry((t) => [...t, { id: tid(), text, kind }].slice(-8));
  }, []);

  const showPreempt = useCallback((text, level = 'warn', ms = 5000) => {
    setPreempt({ text, level });
    if (preemptTimer.current) clearTimeout(preemptTimer.current);
    preemptTimer.current = setTimeout(() => { setPreempt(null); preemptTimer.current = null; }, ms);
  }, []);

  const addAlert = useCallback((text, level = 'warn') => {
    setAlerts((a) => [...a, { id: tid(), text, level }]);
  }, []);

  const litAdd = useCallback((ip) => {
    if (!ip) return;
    setLitIps((s) => { const n = new Set(s); n.add(ip); return n; });
  }, []);

  const flashScore = useCallback((v) => {
    if (scoreModeRef.current === 'crit') return;
    setScore(v);
    setScoreMode('warn');
    addTimer(() => { if (scoreModeRef.current !== 'crit') setScoreMode('idle'); }, 2000);
  }, [addTimer]);

  // Full reset when nothing is active (Reset button clears both logs).
  useEffect(() => {
    if (attackLog.length === 0 && demoEvents.length === 0) {
      clearTimers();
      procTerm.current = 0;
      procDemo.current = 0;
      setScoreMode('idle');
      setScore(rand(92, 98));
      setPreempt(null);
      setAlerts([]);
      setReconStage(0);
      setAnalysisKind(null);
      setReconstructing(false);
      setLitIps(new Set());
      setHwRevealed(0);
    }
  }, [attackLog.length, demoEvents.length, clearTimers]);

  // Idle safety-score ticker.
  useEffect(() => {
    const id = setInterval(() => {
      if (scoreModeRef.current === 'idle') setScore(rand(92, 98));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Idle telemetry stream (paused during a terminal preempt).
  useEffect(() => {
    const id = setInterval(() => {
      if (preemptTimer.current) return;
      const line = IDLE_TELEMETRY[rand(0, IDLE_TELEMETRY.length - 1)];
      pushTelemetry(`[${new Date().toTimeString().slice(0, 8)}] ${line}`, 'info');
    }, 2200);
    return () => clearInterval(id);
  }, [pushTelemetry]);

  // Process in-app Terminal attack steps (Auto-Defense ON only).
  useEffect(() => {
    if (!autoDefense) { procTerm.current = attackLog.length; return; }
    if (attackLog.length <= procTerm.current) return;

    const handle = (e) => {
      switch (e.step) {
        case 'ssh_kiosk':
          showPreempt('UNAUTHORIZED AUTH - Lobby Kiosk 10.0.1.10 (user: C4entrp)');
          addAlert('Unauthorized SSH auth on Lobby Kiosk (10.0.1.10)', 'warn');
          flashScore(82);
          break;
        case 'ip_neigh':
          break;
        case 'ssh_recep':
          showPreempt('LATERAL AUTH - Reception PC 2 accessed from Kiosk');
          addAlert('Reception PC 2 is accessed by Kiosk', 'warn');
          flashScore(72);
          break;
        case 'nmap':
          showPreempt('NET SCAN - service enumeration launched from recep2');
          addAlert('Suspicious activity detected - recep2 never initiated a network scan', 'warn');
          flashScore(58);
          break;
        case 'smb':
          showPreempt('POTENTIAL LATERAL ENTRY detected');
          addAlert('POTENTIAL LATERAL ENTRY detected', 'warn');
          setReconstructing(true);
          addTimer(() => { setScore(24); setScoreMode('crit'); addAlert('SPREAD STOPPED', 'crit'); }, 2000);
          addTimer(() => setReconStage(1), 2200);
          addTimer(() => setReconStage(2), 3900);
          addTimer(() => setReconStage(3), 5300);
          addTimer(() => { setReconStage(4); setAnalysisKind('terminal'); setReconstructing(false); }, 6700);
          break;
        default:
          break;
      }
    };

    for (let i = procTerm.current; i < attackLog.length; i += 1) handle(attackLog[i]);
    procTerm.current = attackLog.length;
  }, [attackLog, autoDefense, showPreempt, addAlert, flashScore, addTimer]);

  // Process external hardware-demo events (both modes; behaviour branches on Auto-Defense).
  useEffect(() => {
    if (demoEvents.length <= procDemo.current) return;

    const handle = (e) => {
      const on = defenseRef.current;
      if (e.type === 'rfid') {
        if (e.floor !== 1 && e.floor !== 2) return; // 3rd+ scan ignored
        litAdd(BADGE_BY_FLOOR[e.floor]);
        const where = e.floor === 1 ? 'Lobby (F1)' : 'Floor 2';
        if (on) pushTelemetry(`AUTH - Badge ${e.name} granted @ ${where}`, 'auth');
        else pushTelemetry(`Card Read - ID: ${e.name} @ ${where}`, 'event');
      } else if (e.type === 'ssh') {
        if (on) {
          addAlert('POTENTIAL LATERAL ENTRY detected', 'warn');
          pushTelemetry('SSH -i cloud_srvr.pem -> cloud-server-instance (10.0.0.4)', 'auth');
          setScore(30); setScoreMode('crit');
          setReconstructing(true);
          // After 5s, trace the propagation path node-by-node.
          HW_PATH.forEach((ip, i) => {
            addTimer(() => { litAdd(ip); setHwRevealed((n) => Math.max(n, i + 1)); }, 5000 + i * 900);
          });
          addTimer(() => { setAnalysisKind('hardware'); setReconstructing(false); }, 5000 + HW_PATH.length * 900);
        } else {
          pushTelemetry('SSH session opened -> cloud-server-instance (10.0.0.4)', 'event');
        }
      } else if (e.type === 'openconfig') {
        if (!on) {
          litAdd(F3_SWITCH);
          pushTelemetry('openconfig <- cloud-server-instance (Floor-3 access)', 'event');
          addTimer(() => { litAdd(DOMAIN); pushTelemetry('Domain Controller responded (10.0.5.2)', 'event'); }, 1200);
        }
      }
    };

    for (let i = procDemo.current; i < demoEvents.length; i += 1) handle(demoEvents[i]);
    procDemo.current = demoEvents.length;
  }, [demoEvents, litAdd, pushTelemetry, addAlert, addTimer]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { score, scoreMode, telemetry, preempt, alerts, reconStage, analysisKind, reconstructing, litIps, hwRevealed };
}
