from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ---------------------------------------------------------------------------
# SABRE live-demo event bridge (ESP32 RFID reader + Termux phone -> Network View)
# External hardware POSTs events here; the frontend Network View polls /demo/events.
# ---------------------------------------------------------------------------
import time

KNOWN_CARDS = {"BA:0D:A2:16": "ARNAV"}


class RfidScan(BaseModel):
    uid: str


class SshEvent(BaseModel):
    key: str = "cloud_srvr.pem"


async def _insert_event(doc: dict) -> dict:
    doc.setdefault("id", str(uuid.uuid4()))
    doc.setdefault("ts", time.time())
    await db.demo_events.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api_router.post("/demo/rfid")
async def demo_rfid(scan: RfidScan):
    uid = scan.uid.strip().upper()
    name = KNOWN_CARDS.get(uid, "VED")
    # 1st scan -> Floor 1 badge reader, 2nd scan -> Floor 2 badge reader, 3rd+ -> ignored.
    count = await db.demo_events.count_documents({"type": "rfid"})
    floor = 1 if count == 0 else 2 if count == 1 else None
    event = await _insert_event({"type": "rfid", "uid": uid, "name": name, "floor": floor})
    return {"ok": True, "event": event}


@api_router.post("/demo/ssh")
async def demo_ssh(evt: SshEvent):
    event = await _insert_event({"type": "ssh", "key": evt.key})
    return {"ok": True, "event": event}


@api_router.post("/demo/openconfig")
async def demo_openconfig():
    event = await _insert_event({"type": "openconfig"})
    return {"ok": True, "event": event}


@api_router.post("/demo/reset")
async def demo_reset():
    await db.demo_events.delete_many({})
    return {"ok": True}


@api_router.get("/demo/events")
async def demo_events():
    events = await db.demo_events.find({}, {"_id": 0}).to_list(1000)
    events.sort(key=lambda e: e.get("ts", 0))
    return {"events": events}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()