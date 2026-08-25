# Running SABRE locally in VS Code (with ESP32 + Termux hardware)

## 0) The one idea that makes the hardware work
Your **laptop runs the backend**. The **ESP32** and **phone (Termux)** must reach that backend.
They can only do that if **all three devices are on the SAME Wi-Fi / hotspot**, and they must
use the **laptop's LAN IP address** (e.g. `http://192.168.43.10:8001`) — NOT `localhost` and NOT
the Emergent `*.preview.emergentagent.com` URL.

- `localhost` on the phone means the *phone itself*, not your laptop → won't work.
- The preview URL only works on the Emergent cloud, not for your local backend.

So: **same hotspot + laptop LAN IP + port 8001** everywhere.

---

## 1) Install prerequisites (once)
- Node.js 18+  →  https://nodejs.org
- Yarn         →  `npm install -g yarn`
- Python 3.11+ →  https://python.org
- MongoDB Community Server (local) → https://www.mongodb.com/try/download/community
  (or use a free MongoDB Atlas cluster and use its connection string)
- Git + VS Code

## 2) Get the code
Use the **"Save to GitHub"** button in the Emergent chat to push this project, then on your laptop:
```
git clone <your-repo-url> sabre
cd sabre
code .
```

---

## 3) Find your laptop's LAN IP (remember this value)
- Windows:  open Command Prompt →  `ipconfig`  → copy the **IPv4 Address** (e.g. 192.168.43.10)
- macOS:    `ipconfig getifaddr en0`   (Wi-Fi)
- Linux:    `hostname -I`  (first address)

Call this `<LAPTOP_IP>` below.

---

## 4) Backend (FastAPI + MongoDB)
Open a VS Code terminal:
```
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

Edit `backend/requirements.txt` and **delete the line** `emergentintegrations==...`
(it is not used by SABRE and needs a special package index). Then:
```
pip install -r requirements.txt
```

Create `backend/.env`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="sabre_database"
CORS_ORIGINS="*"
```

Start MongoDB (if installed locally it usually runs as a service; otherwise run `mongod`).

Run the backend (bind 0.0.0.0 so the phone/ESP32 can reach it):
```
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Quick check from the laptop browser: http://localhost:8001/api/  →  `{"message":"Hello World"}`

**Firewall:** allow inbound TCP **8001** (Windows will pop up "Allow access" the first time —
tick Private networks and allow). On macOS: System Settings → Network → Firewall → allow.

---

## 5) Frontend (React)
New VS Code terminal:
```
cd frontend
yarn install
```

Create `frontend/.env` (use the LAPTOP_IP so the phone can also open the UI if needed):
```
REACT_APP_BACKEND_URL=http://<LAPTOP_IP>:8001
WDS_SOCKET_PORT=3000
```

Start it:
```
yarn start
```
Opens http://localhost:3000 on your laptop.

> IMPORTANT: the frontend and the hardware must talk to the **same** backend URL.
> Keep `REACT_APP_BACKEND_URL` = `http://<LAPTOP_IP>:8001` and use that same value in the scripts.

---

## 6) Point the hardware at your laptop

### ESP32 (`scripts/esp32_rfid.ino`)
Edit the top of the file:
```
const char* WIFI_SSID  = "YOUR_HOTSPOT_NAME";
const char* WIFI_PASS  = "YOUR_HOTSPOT_PASSWORD";
const char* BACKEND_URL = "http://<LAPTOP_IP>:8001";   // http, with :8001
```
Flash it from Arduino IDE (install "MFRC522" + ESP32 board core). Open Serial Monitor @115200.

### Termux phone (`scripts/sabre_phone.py`)
In Termux:
```
pkg install python -y
pip install requests
```
Edit the file:
```
BACKEND_URL = "http://<LAPTOP_IP>:8001"
```
Run it:
```
python sabre_phone.py
```

---

## 7) Confirm the network path BEFORE the demo
On the **phone browser**, open:  `http://<LAPTOP_IP>:8001/api/`
- See `{"message":"Hello World"}`  →  phone can reach the backend (ESP32 will too).
- Times out  →  not on the same hotspot, wrong IP, or firewall blocking 8001.

---

## 8) Run the demo (order)
1. MongoDB running.
2. Backend running (`uvicorn ... :8001`).
3. Frontend running (`yarn start`) → laptop browser at http://localhost:3000.
4. Open **Network View**, set Auto-Defense OFF or ON as needed.
5. Tap RFID cards on the ESP32 → readers light up in the app.
6. In Termux: `ssh -i cloud_srvr.pem`  then  `show openconfig`.
7. Use **Reset attack path** in Network View to replay.

---

## Endpoint reference (what the hardware calls)
- `POST /api/demo/rfid`   body `{"uid":"BA:0D:A2:16"}`  (UID BA:0D:A2:16 → ARNAV, else VED)
- `POST /api/demo/ssh`    body `{"key":"cloud_srvr.pem"}`
- `POST /api/demo/openconfig`
- `POST /api/demo/reset`
- `GET  /api/demo/events`  (the Network View polls this every 1s)

## Common issues
- Phone/ESP32 can't connect → not same hotspot, used `localhost`/preview URL, or firewall on 8001.
- App shows nothing → `REACT_APP_BACKEND_URL` doesn't match the backend the hardware posts to.
- Some phone hotspots isolate clients ("AP isolation") — if the phone IS the hotspot, the laptop may
  not be reachable from the ESP32. Prefer a separate Wi-Fi router, or a laptop hotspot, so client
  isolation is off.
