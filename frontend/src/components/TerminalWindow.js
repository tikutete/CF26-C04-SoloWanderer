import React, { useEffect, useRef, useState } from 'react';
import { getFloorDevices } from '../data/floorDevices';

// Build a lookup of every device across floors (for ssh targets + ip neigh).
const ALL = [1, 2, 3, 4, 5].flatMap((f) => getFloorDevices(f, 1).devices);
const byIp = {};
ALL.forEach((d) => { byIp[d.ip] = d; });
const floorOf = (ip) => {
  const p = String(ip).split('.');
  return p.length === 4 ? parseInt(p[2], 10) : null;
};

// Scripted host credentials (everything else falls back to admin/admin).
const HOSTS = {
  '10.0.1.10': { user: 'C4entrp', pass: 'root', promptUser: 'C4entrp', promptIp: '10.0.1.10' },
  '10.0.1.12': { user: 'recep2', pass: 'lobby2', promptUser: 'recep2', promptIp: '10.0.1.12' },
};

const NMAP_OUTPUT = [
  'Samba version 4.19.5-Ubuntu',
  'PID     Username     Group        Machine                               Protocol Version  Encryption           Signing',
  '--------------------------------------------------------------------------------------------------------------------------------------',
  '12345   arnav        arnav        192.168.1.50 (ipv4:192.168.1.50:54321) SMB3_11           -                    partial(AES-128-CMAC)',
  '',
  'Service      pid     Machine       Connected at                     Encryption           Signing',
  '--------------------------------------------------------------------------------------------------------------',
  'SharedFiles  12345   10.0.2.13   Mon Aug 24 21:00:12 2026 IST     -                    -',
  '',
  'Locked files:',
  'Pid          User(UID)   DenyMode   Access      R/W        Oplock           SharePath   Name   Time',
  '--------------------------------------------------------------------------------------------------',
  '12345        1000        DENY_NONE  0x120089    RDWR       EXCLUSIVE        /srv/samba  memo.txt Mon Aug 24 21:01:05 2026',
];

const MEMO = [
  'Arnav, push the code to GitHub.',
  'Taking out the buggy web sockets.',
  'Fixing the Python environmental variables.',
  'Handling the web exceptions in the latest Firebase server.',
  'Ved, use the shared backup and quickly fix the dev server as possible. (dsvr_backup).',
];

const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const mac = (seed) => {
  let h = 0;
  for (let i = 0; i < String(seed).length; i += 1) h = (h * 31 + String(seed).charCodeAt(i)) & 0xffffff;
  const oct = [];
  for (let i = 0; i < 6; i += 1) { oct.push(((h >> (i * 3)) & 0xff).toString(16).padStart(2, '0')); }
  return oct.join(':');
};

function banner(ip) {
  const now = new Date();
  const dt = `${now.toDateString()} ${now.toTimeString().slice(0, 8)}`;
  return [
    'Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-40-generic x86_64)',
    '',
    ' * Documentation:  https://help.ubuntu.com',
    ' * Management:     https://landscape.canonical.com',
    ' * Support:        https://ubuntu.com/pro',
    '',
    ` System information as of ${dt} IST 2026`,
    '',
    `  System load:  ${(Math.random() * 0.9).toFixed(2)}              Processes:               ${r(180, 320)}`,
    `  Usage of /:   ${r(15, 55)}.${r(0, 9)}% of 468.21GB   Users logged in:         1`,
    `  Memory usage: ${r(10, 45)}%               IPv4 address for eth0:   ${ip}`,
    '  Swap usage:   0%',
    '',
    `Last login: ${dt} from 192.168.1.20`,
  ];
}

function ipNeigh(floor, selfIp) {
  if (!floor) return [`192.168.1.1 dev eth0 lladdr ${mac('gw')} router REACHABLE`];
  const state = (t) =>
    (['computer', 'kiosk', 'server', 'devserver', 'filestore', 'cloud', 'domain'].includes(t) ? 'REACHABLE'
      : ['printer', 'badge', 'camera', 'firewall'].includes(t) ? 'FAILED' : 'STALE');
  const lines = ALL.filter((d) => floorOf(d.ip) === floor && d.ip !== selfIp).map((d) => {
    const s = state(d.type);
    return s === 'FAILED'
      ? `${d.ip} dev eth0  FAILED`
      : `${d.ip} dev eth0 lladdr ${mac(d.ip)} ${s}`;
  });
  lines.push(`fe80::1 dev eth0 lladdr ${mac(`r${floor}`)} router STALE`);
  return lines;
}

export default function TerminalWindow({ device, onClose }) {
  const [lines, setLines] = useState([
    `# SABRE console — target: ${device?.name || 'unknown'} (${device?.ip || 'n/a'})`,
    "# type 'help' for commands. Start with: ssh " + (device?.ip || ''),
    '',
  ]);
  const [sessions, setSessions] = useState([{ u: 'analyst', ip: 'sabre-soc', floor: null }]);
  const [mode, setMode] = useState('command'); // command | login | password | confirm
  const [pending, setPending] = useState(null);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [hIdx, setHIdx] = useState(-1);
  const [pos, setPos] = useState({ x: Math.max(120, window.innerWidth / 2 - 380), y: 90 });
  const dragRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // dragging
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      setPos({ x: e.clientX - dragRef.current.dx, y: Math.max(0, e.clientY - dragRef.current.dy) });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const cur = sessions[sessions.length - 1];
  const promptStr = mode === 'login' ? 'login: ' : mode === 'password' ? 'Password: ' : mode === 'confirm' ? '' : `${cur.u}@${cur.ip}:~$ `;

  const submit = () => {
    const raw = input;
    setInput('');
    const out = [mode === 'password' ? promptStr : `${promptStr}${raw}`];

    if (mode === 'login') {
      setPending((p) => ({ ...(p || {}), user: raw }));
      setMode('password');
      setLines((l) => [...l, ...out]);
      return;
    }
    if (mode === 'password') {
      const host = pending?.host;
      const u = (pending?.user || '').trim().toLowerCase();
      const okUser = host && (u === host.user.toLowerCase() || u === 'root');
      if (okUser && raw.trim() === host.pass) {
        out.push(...banner(host.promptIp));
        setSessions((s) => [...s, { u: host.promptUser, ip: host.promptIp, floor: floorOf(host.promptIp) }]);
      } else {
        out.push('Permission denied, please try again.');
      }
      setPending(null); setMode('command');
      setLines((l) => [...l, ...out]);
      return;
    }
    if (mode === 'confirm') {
      if (/^y(es)?$/i.test(raw.trim())) out.push('Purging backups...', 'all backups purged successfully');
      else out.push('Abort.');
      setMode('command');
      setLines((l) => [...l, ...out]);
      return;
    }

    // command mode
    const trimmed = raw.trim();
    if (trimmed) { setHistory((h) => [trimmed, ...h].slice(0, 50)); }
    setHIdx(-1);
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0] || '';

    if (cmd === 'clear') { setLines([]); return; }

    if (cmd === '') { /* noop */ }
    else if (cmd === 'ssh') {
      const target = parts[1];
      if (!target) out.push('usage: ssh [user@]hostname');
      else if (target === 'back_serv_01') setSessions((s) => [...s, { u: 'Arnav', ip: '10.0.5.19', floor: 5 }]);
      else {
        const host = HOSTS[target] || (byIp[target] ? { user: 'admin', pass: 'admin', promptUser: 'admin', promptIp: target } : null);
        if (!host) out.push(`ssh: connect to host ${target} port 22: No route to host`);
        else { setPending({ host }); setMode('login'); }
      }
    } else if (cmd === 'login') {
      if (parts[1] === 'exec_2') setSessions((s) => [...s, { u: 'Arnav', ip: '10.0.4.18', floor: 4 }]);
      else out.push(`login: unknown service '${parts[1] || ''}'`);
    } else if (cmd === 'ip' && parts[1] === 'neigh') {
      out.push(...ipNeigh(cur.floor, cur.ip));
    } else if (cmd === 'nmap') {
      out.push(...NMAP_OUTPUT);
    } else if (trimmed.startsWith('smb://')) {
      out.push(...MEMO);
    } else if (cmd === 'sudo' && parts[1] === 'apt' && parts[2] === 'purge') {
      out.push('Reading package lists... Done', 'Building dependency tree... Done', 'Are you sure want to clear all backup? [Y/N]');
      setMode('confirm');
    } else if (cmd === 'whoami') { out.push(cur.u); }
    else if (cmd === 'pwd') { out.push(`/home/${cur.u}`); }
    else if (cmd === 'ls') { out.push('Desktop  Documents  Downloads  memo.txt'); }
    else if (cmd === 'exit' || cmd === 'logout') {
      if (sessions.length > 1) { setSessions((s) => s.slice(0, -1)); out.push('logout'); }
      else { onClose(); return; }
    } else if (cmd === 'help') {
      out.push('Available commands:', '  ssh <ip>            connect to a host', '  ip neigh            list network neighbours', '  nmap                scan shares', '  smb://<ip>/<share>  read a share', '  login / sudo apt    scripted ops', '  whoami  pwd  ls  clear  exit');
    } else { out.push(`bash: ${cmd}: command not found`); }

    setLines((l) => [...l, ...out]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'ArrowUp' && mode === 'command') {
      e.preventDefault();
      const ni = Math.min(hIdx + 1, history.length - 1);
      if (ni >= 0) { setHIdx(ni); setInput(history[ni]); }
    } else if (e.key === 'ArrowDown' && mode === 'command') {
      e.preventDefault();
      const ni = hIdx - 1;
      setHIdx(ni); setInput(ni >= 0 ? history[ni] : '');
    }
  };

  const lineColor = (t) => {
    if (/denied|not found|No route|Abort|FAILED/i.test(t)) return '#ff6b6b';
    if (/successfully|REACHABLE|Welcome to Ubuntu/i.test(t)) return '#7CFC00';
    if (t.startsWith('#')) return '#5b7183';
    return '#c7d3da';
  };

  return (
    <div
      className="absolute z-50 flex flex-col overflow-hidden rounded-lg border border-slate-700 shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: 760, height: 470, background: '#0b0f12' }}
      data-testid="terminal-window"
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between bg-[#1c2530] px-3 py-2 cursor-move select-none"
        onMouseDown={(e) => { dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; }}
        data-testid="terminal-titlebar"
      >
        <div className="flex items-center gap-2">
          <button onClick={onClose} data-testid="terminal-close" className="h-3 w-3 rounded-full bg-[#ff5f56]" aria-label="close" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-xs text-slate-300">{cur.u}@{cur.ip} — {device?.name}</span>
        <span className="w-12" />
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-relaxed"
        onClick={() => inputRef.current?.focus()}
        data-testid="terminal-output"
      >
        {lines.map((t, i) => (
          <div key={i} style={{ color: lineColor(t), whiteSpace: 'pre-wrap' }}>{t || '\u00A0'}</div>
        ))}
        <div className="flex items-center" style={{ color: '#c7d3da' }}>
          <span style={{ whiteSpace: 'pre' }}>{promptStr}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            type={mode === 'password' ? 'password' : 'text'}
            data-testid="terminal-input"
            autoComplete="off"
            spellCheck="false"
            className="flex-1 bg-transparent outline-none border-none"
            style={{ color: '#7CFC00', caretColor: '#7CFC00' }}
          />
        </div>
      </div>
    </div>
  );
}
