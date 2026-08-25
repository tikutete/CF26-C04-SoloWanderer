#!/usr/bin/env python3
"""
SABRE demo - Termux phone client.

Fakes an `ssh -i cloud_srvr.pem` session locally on the phone AND notifies the
SABRE backend so the Network View reacts live.

Setup in Termux:
    pkg install python -y
    pip install requests
    python sabre_phone.py

Then type:  ssh -i cloud_srvr.pem   (Enter)
Then type:  show openconfig         (Enter)
"""
import sys
import time
import datetime
import requests

# ---- EDIT THIS to your SABRE backend URL (no trailing slash) ----
BACKEND_URL = "https://inspect-deploy-6.preview.emergentagent.com"

WELCOME = """Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of {now}:

  System load:  0.05               Processes:             112
  Usage of /:   14.2% of 28.90GB   Users logged in:       0
  Memory usage: 18%                IPv4 address for eth0: 10.0.0.4

ubuntu@cloud-server-instance:~$ """

OPENCONFIG = """interfaces {
    interface eth0 {
        config { name eth0; type ethernetCsmacd; enabled true; }
        state  { admin-status UP; oper-status UP; ifindex 2; }
        ipv4 { address 10.0.0.4/24; }
    }
}
network-instances {
    routes: default -> 10.0.0.1 (Floor-3 access switch 10.0.3.1)
    reachable: 10.0.3.21 (cloud-gw), 10.0.5.2 (domain-controller), 10.0.5.13 (mail)
}
system { hostname cloud-server-instance; domain corp.sabre.local; }"""


def notify(path, payload=None):
    try:
        requests.post(f"{BACKEND_URL}/api/demo/{path}", json=payload or {}, timeout=5)
    except Exception as exc:  # noqa: BLE001
        print(f"[sabre] backend notify failed ({exc})", file=sys.stderr)


def main():
    print("SABRE phone client. Commands: 'ssh -i cloud_srvr.pem', 'show openconfig', 'exit'.\n")
    prompt = "phone:~$ "
    logged_in = False
    while True:
        try:
            cmd = input(prompt).strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if cmd in ("exit", "quit"):
            break
        if cmd.startswith("ssh") and "cloud_srvr.pem" in cmd:
            notify("ssh", {"key": "cloud_srvr.pem"})
            time.sleep(0.4)
            print(WELCOME.format(now=datetime.datetime.now().strftime("%a %b %d %H:%M:%S IST %Y")), end="")
            logged_in = True
            prompt = "ubuntu@cloud-server-instance:~$ "
            print()
        elif cmd == "show openconfig":
            if not logged_in:
                print("show: not connected. Run: ssh -i cloud_srvr.pem")
                continue
            notify("openconfig")
            time.sleep(0.3)
            print(OPENCONFIG)
        elif cmd == "":
            continue
        else:
            print(f"{cmd}: command not found")


if __name__ == "__main__":
    main()
