// MITRE ATT&CK tactics (attack "types") and their techniques ("subtypes") used by
// the Sandbox View -> Threat Injector. Numbers/names mirror the operator's brief;
// tactic IDs (TAxxxx) and technique IDs (Txxxx) follow the public MITRE ATT&CK matrix.

export const TACTICS = [
  {
    id: 'TA0043',
    name: 'Reconnaissance',
    short: 'Recon',
    techniques: [
      { n: 1, name: 'Active Scanning', tid: 'T1595' },
      { n: 3, name: 'Gather Victim Identity Information', tid: 'T1589' },
      { n: 5, name: 'Gather Victim Org Information', tid: 'T1591' },
      { n: 6, name: 'Phishing for Information', tid: 'T1598' },
      { n: 7, name: 'Query Public AI Services', tid: 'T1593.004' },
      { n: 8, name: 'Search Closed Sources', tid: 'T1597' },
    ],
  },
  {
    id: 'TA0001',
    name: 'Initial Access',
    short: 'Initial Access',
    techniques: [
      { n: 1, name: 'Content Injection', tid: 'T1659' },
      { n: 2, name: 'Drive-by Compromise', tid: 'T1189' },
      { n: 3, name: 'Exploit Public-Facing Application', tid: 'T1190' },
      { n: 4, name: 'External Remote Services', tid: 'T1133' },
      { n: 5, name: 'Hardware Additions', tid: 'T1200' },
      { n: 6, name: 'Phishing', tid: 'T1566' },
      { n: 7, name: 'Replication Through Removable Media', tid: 'T1091' },
      { n: 8, name: 'Supply Chain Compromise', tid: 'T1195' },
      { n: 9, name: 'Trusted Relationship', tid: 'T1199' },
      { n: 10, name: 'Valid Accounts', tid: 'T1078' },
    ],
  },
  {
    id: 'TA0002',
    name: 'Execution',
    short: 'Execution',
    techniques: [
      { n: 1, name: 'BITS Jobs', tid: 'T1197' },
      { n: 2, name: 'Cloud Administration Command', tid: 'T1651' },
      { n: 3, name: 'Command and Scripting Interpreter', tid: 'T1059' },
      { n: 4, name: 'Container Administration Command', tid: 'T1609' },
      { n: 5, name: 'Deploy Container', tid: 'T1610' },
      { n: 6, name: 'ESXi Administration Command', tid: 'T1675' },
      { n: 7, name: 'Exploitation for Client Execution', tid: 'T1203' },
      { n: 8, name: 'Hijack Execution Flow', tid: 'T1574' },
      { n: 9, name: 'Input Injection', tid: 'T1674' },
    ],
  },
  {
    id: 'TA0003',
    name: 'Persistence',
    short: 'Persistence',
    techniques: [
      { n: 1, name: 'Account Manipulation', tid: 'T1098' },
      { n: 2, name: 'BITS Jobs', tid: 'T1197' },
      { n: 3, name: 'Boot or Logon Autostart Execution', tid: 'T1547' },
      { n: 4, name: 'Boot or Logon Initialization Scripts', tid: 'T1037' },
      { n: 5, name: 'Cloud Application Integration', tid: 'T1671' },
      { n: 6, name: 'Compromise Host Software Binary', tid: 'T1554' },
    ],
  },
  {
    id: 'TA0004',
    name: 'Privilege Escalation',
    short: 'Priv Esc',
    techniques: [
      { n: 1, name: 'Abuse Elevation Control Mechanism', tid: 'T1548' },
      { n: 2, name: 'Access Token Manipulation', tid: 'T1134' },
      { n: 3, name: 'Account Manipulation', tid: 'T1098' },
      { n: 4, name: 'Boot or Logon Autostart Execution', tid: 'T1547' },
      { n: 5, name: 'Boot or Logon Initialization Scripts', tid: 'T1037' },
      { n: 6, name: 'Create or Modify System Process', tid: 'T1543' },
      { n: 7, name: 'Domain or Tenant Policy Modification', tid: 'T1484' },
      { n: 8, name: 'Escape to Host', tid: 'T1611' },
    ],
  },
  {
    id: 'TA0005',
    name: 'Defense Impairment',
    short: 'Defense Evasion',
    techniques: [
      { n: 1, name: 'Disable or Modify System Firewall', tid: 'T1562.004' },
      { n: 2, name: 'Disable or Modify Tools', tid: 'T1562.001' },
      { n: 3, name: 'Domain or Tenant Policy Modification', tid: 'T1484' },
      { n: 4, name: 'Downgrade Attack', tid: 'T1562.010' },
      { n: 5, name: 'Exploitation for Defense Impairment', tid: 'T1211' },
      { n: 6, name: 'File and Directory Permissions Modification', tid: 'T1222' },
      { n: 7, name: 'Modify Authentication Process', tid: 'T1556' },
      { n: 8, name: 'Modify Cloud Compute Infrastructure', tid: 'T1578' },
    ],
  },
  {
    id: 'TA0006',
    name: 'Credential Access',
    short: 'Cred Access',
    techniques: [
      { n: 1, name: 'Adversary-in-the-Middle', tid: 'T1557' },
      { n: 2, name: 'Brute Force', tid: 'T1110' },
      { n: 3, name: 'Credentials from Password Stores', tid: 'T1555' },
      { n: 4, name: 'Exploitation for Credential Access', tid: 'T1212' },
      { n: 5, name: 'Forced Authentication', tid: 'T1187' },
      { n: 6, name: 'Forge Web Credentials', tid: 'T1606' },
      { n: 7, name: 'Input Capture', tid: 'T1056' },
      { n: 8, name: 'Modify Authentication Process', tid: 'T1556' },
      { n: 9, name: 'Multi-Factor Authentication Interception', tid: 'T1111' },
      { n: 10, name: 'Multi-Factor Authentication Request Generation', tid: 'T1621' },
    ],
  },
  {
    id: 'TA0007',
    name: 'Discovery',
    short: 'Discovery',
    techniques: [
      { n: 1, name: 'Account Discovery', tid: 'T1087' },
      { n: 2, name: 'Application Window Discovery', tid: 'T1010' },
      { n: 3, name: 'Browser Information Discovery', tid: 'T1217' },
      { n: 4, name: 'Cloud Infrastructure Discovery', tid: 'T1580' },
      { n: 5, name: 'Cloud Service Dashboard', tid: 'T1538' },
      { n: 6, name: 'Cloud Service Discovery', tid: 'T1526' },
    ],
  },
  {
    id: 'TA0008',
    name: 'Lateral Movement',
    short: 'Lateral Movement',
    techniques: [
      { n: 1, name: 'Exploitation of Remote Services', tid: 'T1210' },
      { n: 2, name: 'Internal Spearphishing', tid: 'T1534' },
      { n: 3, name: 'Lateral Tool Transfer', tid: 'T1570' },
      { n: 4, name: 'Remote Service Session Hijacking', tid: 'T1563' },
      { n: 5, name: 'Remote Services', tid: 'T1021' },
      { n: 6, name: 'Replication Through Removable Media', tid: 'T1091' },
      { n: 7, name: 'Software Deployment Tools', tid: 'T1072' },
      { n: 8, name: 'Taint Shared Content', tid: 'T1080' },
      { n: 9, name: 'Use Alternate Authentication Material', tid: 'T1550' },
    ],
  },
  {
    id: 'TA0011',
    name: 'Command and Control',
    short: 'C2',
    techniques: [
      { n: 1, name: 'Application Layer Protocol', tid: 'T1071' },
      { n: 2, name: 'Communication Through Removable Media', tid: 'T1092' },
      { n: 3, name: 'Content Injection', tid: 'T1659' },
      { n: 4, name: 'Data Encoding', tid: 'T1132' },
      { n: 5, name: 'Data Obfuscation', tid: 'T1001' },
      { n: 6, name: 'Dynamic Resolution', tid: 'T1568' },
      { n: 7, name: 'Encrypted Channel', tid: 'T1573' },
      { n: 8, name: 'Fallback Channels', tid: 'T1008' },
    ],
  },
  {
    id: 'TA0010',
    name: 'Exfiltration',
    short: 'Exfiltration',
    techniques: [
      { n: 1, name: 'Automated Exfiltration', tid: 'T1020' },
      { n: 2, name: 'Data Transfer Size Limits', tid: 'T1030' },
      { n: 3, name: 'Exfiltration Over Alternative Protocol', tid: 'T1048' },
      { n: 4, name: 'Exfiltration Over C2 Channel', tid: 'T1041' },
      { n: 5, name: 'Exfiltration Over Other Network Medium', tid: 'T1011' },
      { n: 6, name: 'Exfiltration Over Physical Medium', tid: 'T1052' },
      { n: 7, name: 'Exfiltration Over Web Service', tid: 'T1567' },
      { n: 8, name: 'Scheduled Transfer', tid: 'T1029' },
      { n: 9, name: 'Transfer Data to Cloud Account', tid: 'T1537' },
    ],
  },
];

export const TACTIC_COLOR = {
  TA0043: '#8be7f2', // Recon
  TA0001: '#ff7a5c', // Initial Access
  TA0002: '#ffb454', // Execution
  TA0003: '#c9a227', // Persistence
  TA0004: '#cf6bff', // Priv Esc
  TA0005: '#7d8bf0', // Defense Impairment
  TA0006: '#ff5a8a', // Cred Access
  TA0007: '#39d6c4', // Discovery
  TA0008: '#ff3b3b', // Lateral Movement
  TA0011: '#4aa8ff', // C2
  TA0010: '#53e0a0', // Exfiltration
};
