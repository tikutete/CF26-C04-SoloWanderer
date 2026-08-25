/*
 * SABRE demo - ESP32 + MFRC522 RFID reader.
 * On each card scan, POSTs the UID to the SABRE backend so the Network View
 * lights the Floor-1 (1st scan) then Floor-2 (2nd scan) card reader.
 *
 * Libraries (Arduino Library Manager):
 *   - MFRC522 by GithubCommunity
 *   - (WiFi.h + HTTPClient.h ship with the ESP32 core)
 *
 * Wiring (MFRC522 -> ESP32):
 *   SDA/SS -> GPIO5 | SCK -> GPIO18 | MOSI -> GPIO23 | MISO -> GPIO19
 *   RST -> GPIO22   | 3.3V -> 3V3    | GND -> GND
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// ---- EDIT THESE ----
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "https://f693d573-8753-4110-9a2b-ce497b53f8c7.preview.emergentagent.com";

#define SS_PIN  5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println(" connected: " + WiFi.localIP().toString());
}

String uidToString() {
  String s = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) s += "0";
    s += String(rfid.uid.uidByte[i], HEX);
    if (i + 1 < rfid.uid.size) s += ":";
  }
  s.toUpperCase();
  return s;   // e.g. "BA:0D:A2:16"
}

void postScan(const String& uid) {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/demo/rfid");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"uid\":\"" + uid + "\"}";
  int code = http.POST(body);
  Serial.printf("POST /api/demo/rfid uid=%s -> %d\n", uid.c_str(), code);
  http.end();
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  connectWifi();
  Serial.println("Ready. Tap a card...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) { delay(50); return; }
  String uid = uidToString();
  Serial.println("Card: " + uid);
  postScan(uid);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);   // debounce between taps
}
