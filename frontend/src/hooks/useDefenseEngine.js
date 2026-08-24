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

/**
 * SABRE Auto-Defense engine. Watches the attack event log and produces the
 * live-panel state (safety score, telemetry, preempt line, alerts) plus the
 * attack-path reconstruction stage. Only active while `enabled` (Auto-Defense ON).
 */
export default function useDefenseEngine(attackLog, enabled) {
  const [score, setScore] = useState(96);
  const [scoreMode, setScoreMode] = useState('idle'); // idle | warn | crit
  const [telemetry, setTelemetry] = useState([]);
  const [preempt, setPreempt] = useState(null); // { text, level }
  const [alerts, setAlerts] = useState([]); // { id, text, level }
  const [reconStage, setReconStage] = useState(0); // 0 none · 1 loading · 2 circle · 3 ->dev · 4 ->backup
  const [analysis, setAnalysis] = useState(false);

  const processed = useRef(0);
  const timers = useRef([]);
  const preemptTimer = useRef(null);
  const scoreModeRef = useRef('idle');
  scoreModeRef.current = scoreMode;

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

  const showPreempt = useCallback((text, level = 'warn', ms = 5000) => {
    setPreempt({ text, level });
    if (preemptTimer.current) clearTimeout(preemptTimer.current);
    preemptTimer.current = setTimeout(() => { setPreempt(null); preemptTimer.current = null; }, ms);
  }, []);

  const addAlert = useCallback((text, level = 'warn') => {
    setAlerts((a) => [...a, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, level }]);
  }, []);

  const flashScore = useCallback((v) => {
    if (scoreModeRef.current === 'crit') return;
    setScore(v);
    setScoreMode('warn');
    addTimer(() => { if (scoreModeRef.current !== 'crit') setScoreMode('idle'); }, 2000);
  }, [addTimer]);

  // Reset when disabled or when the attack log is cleared (Reset button).
  useEffect(() => {
    if (!enabled || attackLog.length === 0) {
      clearTimers();
      processed.current = 0;
      setScoreMode('idle');
      setScore(rand(92, 98));
      setPreempt(null);
      setAlerts([]);
      setReconStage(0);
      setAnalysis(false);
    }
  }, [enabled, attackLog.length, clearTimers]);

  // Idle safety-score ticker (only while calm).
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      if (scoreModeRef.current === 'idle') setScore(rand(92, 98));
    }, 2000);
    return () => clearInterval(id);
  }, [enabled]);

  // Idle telemetry stream (paused during a preempt).
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      if (preemptTimer.current) return;
      setTelemetry((t) => {
        const line = IDLE_TELEMETRY[rand(0, IDLE_TELEMETRY.length - 1)];
        const stamped = `[${new Date().toTimeString().slice(0, 8)}] ${line}`;
        return [...t, stamped].slice(-4);
      });
    }, 1300);
    return () => clearInterval(id);
  }, [enabled]);

  // Process new attack events.
  useEffect(() => {
    if (!enabled) return;
    if (attackLog.length <= processed.current) return;

    const handle = (e) => {
      switch (e.step) {
        case 'ssh_kiosk':
          showPreempt('UNAUTHORIZED AUTH - Lobby Kiosk 10.0.1.10 (user: C4entrp)');
          addAlert('Unauthorized SSH auth on Lobby Kiosk (10.0.1.10)', 'warn');
          flashScore(82);
          break;
        case 'ip_neigh':
          break; // reconnaissance - no defensive reaction
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
          addTimer(() => {
            setScore(24);
            setScoreMode('crit');
            addAlert('SPREAD STOPPED', 'crit');
          }, 2000);
          addTimer(() => setReconStage(1), 2200);
          addTimer(() => setReconStage(2), 3900);
          addTimer(() => setReconStage(3), 5300);
          addTimer(() => { setReconStage(4); setAnalysis(true); }, 6700);
          break;
        default:
          break;
      }
    };

    for (let i = processed.current; i < attackLog.length; i += 1) handle(attackLog[i]);
    processed.current = attackLog.length;
  }, [attackLog, enabled, showPreempt, addAlert, flashScore, addTimer]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { score, scoreMode, telemetry, preempt, alerts, reconStage, analysis };
}
