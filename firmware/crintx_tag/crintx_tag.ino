/*
 * Crintx tag firmware: ESP32 BLE peripheral with a vibration motor + buzzer.
 *
 * The phone connects over Bluetooth and writes to one of two characteristics:
 *   COMMAND  -> buzz, or play a test waveform on the buzzer
 *   NAME     -> rename the tag (saved to flash, survives power loss)
 * Every setting lives in config.h. Wiring and the full protocol: firmware/README.md.
 *
 * You can also drive it from the Serial Monitor (115200 baud, newline). Type
 * `help` for the command list, including the buzzer sound tests.
 *
 * Needs the "esp32" boards package v3.x (Arduino IDE -> Boards Manager). The
 * BLE and Preferences libraries ship with it; nothing else to install.
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <Preferences.h>
#include <esp_bt.h>
#include "config.h"

// ---- Work queue -------------------------------------------------------------
// BLE callbacks run on the Bluetooth task. Buzzing there would stall the radio,
// so callbacks only queue a job and loop() runs it.
enum JobKind : uint8_t { JOB_BUZZ, JOB_WAVE };
struct Job { JobKind kind; uint32_t onUs; uint32_t offUs; uint32_t ms; };

static volatile bool jobPending = false;
static Job job;

static void queueJob(JobKind kind, uint32_t onUs, uint32_t offUs, uint32_t ms) {
  if (jobPending) return;  // already buzzing; drop rather than pile up
  job = {kind, onUs, offUs, ms};
  jobPending = true;
}

// ---- Name (persisted) -------------------------------------------------------
static Preferences prefs;
static String tagName;
static uint32_t restartAt = 0;  // millis() to restart at after a rename; 0 = none

static String defaultName() {
  uint64_t mac = ESP.getEfuseMac();
  char suffix[5];
  snprintf(suffix, sizeof suffix, "%02X%02X", (uint8_t)(mac >> 32), (uint8_t)(mac >> 40));
  return String(DEFAULT_NAME_PREFIX) + suffix;
}

static bool validName(const String &n) {
  if (n.length() == 0 || n.length() > NAME_MAX_LEN) return false;
  for (size_t i = 0; i < n.length(); i++) {
    if (n[i] < 0x20 || n[i] > 0x7E) return false;  // printable ASCII only
  }
  return true;
}

static void scheduleRestart() {
  // Short delay so the BLE write response / Serial message goes out first.
  restartAt = millis() + 500;
  if (restartAt == 0) restartAt = 1;
}

/** Save a new name and restart so the tag advertises under it. */
static bool renameTag(String n) {
  n.trim();
  if (!validName(n)) return false;
  prefs.putString("name", n);
  scheduleRestart();
  return true;
}

// ---- Output -----------------------------------------------------------------
static void waitUs(uint32_t us) {
  if (us >= 1000) delay(us / 1000);  // delay() also lets the idle task run
  delayMicroseconds(us % 1000);
}

/** The real alert: motor + buzzer, steady on. */
static void runBuzz(uint32_t ms) {
  ms = min(ms, (uint32_t)MAX_BURST_MS);
  digitalWrite(MOTOR_PIN, HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(MOTOR_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
}

/** Buzzer steady HIGH, no switching: the baseline the wave tests compare against. */
static void runHold(uint32_t ms) {
  ms = min(ms, (uint32_t)MAX_BURST_MS);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

/**
 * Bit-banged square wave on the buzzer only: HIGH for onUs, LOW for offUs,
 * repeated for ms. Same supply voltage the whole time; only the timing changes.
 *   Passive buzzer: pitch = 1,000,000 / (onUs + offUs) Hz -> longer delays, lower pitch.
 *   Active buzzer:  it makes its own fixed tone; delays just chop it into beeps/clicks.
 */
static void runWave(uint32_t onUs, uint32_t offUs, uint32_t ms) {
  ms = min(ms, (uint32_t)MAX_BURST_MS);
  uint32_t end = millis() + ms;
  while ((int32_t)(millis() - end) < 0) {
    digitalWrite(BUZZER_PIN, HIGH);
    waitUs(onUs);
    digitalWrite(BUZZER_PIN, LOW);
    waitUs(offUs);
  }
}

/** Steps the delay from short to long so you can hear the pitch drop (or not). */
static void runSweep() {
  static const uint16_t halfPeriodsUs[] = {125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500};
  Serial.println("Sweep: same voltage, longer delay each step.");
  for (uint16_t h : halfPeriodsUs) {
    Serial.printf("  %4u us on / %4u us off  ->  %4lu Hz\n", h, h, 500000UL / h);
    runWave(h, h, 400);
    delay(150);
  }
  Serial.println("Sweep done.");
}

// ---- BLE --------------------------------------------------------------------
class ServerCallbacks : public BLEServerCallbacks {
  // Without this, a tag goes invisible after the first phone disconnects.
  void onDisconnect(BLEServer *) override { BLEDevice::startAdvertising(); }
};

/**
 * COMMAND characteristic:
 *   [0x01]                         buzz for BUZZ_MS
 *   [0x01, t]                      buzz for t * 100 ms
 *   [0x02, onLo, onHi, offLo, offHi, t]   buzzer wave: on/off in us (uint16, little-endian), t * 100 ms
 */
class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    const uint8_t *b = c->getData();
    size_t len = c->getLength();
    if (len == 0) return;
    switch (b[0]) {
      case 0x01:
        queueJob(JOB_BUZZ, 0, 0, len >= 2 ? b[1] * 100u : BUZZ_MS);
        break;
      case 0x02:
        if (len >= 6) {
          uint32_t on = b[1] | (b[2] << 8);
          uint32_t off = b[3] | (b[4] << 8);
          if (on + off > 0) queueJob(JOB_WAVE, on, off, b[5] * 100u);
        }
        break;
    }
  }
};

/** NAME characteristic: read the current name, or write a new one (1-20 printable ASCII). */
class NameCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String n;
    for (size_t i = 0; i < c->getLength(); i++) n += (char)c->getData()[i];
    if (!renameTag(n)) c->setValue(tagName);  // rejected: show the real name again
  }
};

static void startBle() {
  BLEDevice::init(tagName);
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_DEFAULT, TX_POWER);
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_ADV, TX_POWER);

  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
  BLEService *service = server->createService(SERVICE_UUID);

  BLECharacteristic *cmd = service->createCharacteristic(
      COMMAND_CHAR_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  cmd->setCallbacks(new CommandCallbacks());

  BLECharacteristic *name = service->createCharacteristic(
      NAME_CHAR_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  name->setValue(tagName);
  name->setCallbacks(new NameCallbacks());

  service->start();

  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);  // the app finds tags by this, not by name
  adv->setScanResponse(true);         // name goes in the scan response
  adv->setMinInterval(ADV_INTERVAL_MIN);
  adv->setMaxInterval(ADV_INTERVAL_MAX);
  BLEDevice::startAdvertising();
}

// ---- Serial console ---------------------------------------------------------
static void printHelp() {
  Serial.println(
      "Commands:\n"
      "  name                 show this tag's name\n"
      "  name <new name>      rename (1-20 chars), saves and restarts\n"
      "  name reset           back to the default Crintx-XXXX name\n"
      "  buzz [ms]            motor + buzzer\n"
      "  hold [ms]            buzzer steady HIGH (the baseline to compare against)\n"
      "  wave <on_us> <off_us> [ms]   buzzer square wave with those delays\n"
      "  sweep                step through delays 125us..2500us\n"
      "  help");
}

static void handleLine(String line) {
  line.trim();
  int sp = line.indexOf(' ');
  String cmd = sp < 0 ? line : line.substring(0, sp);
  String arg = sp < 0 ? String() : line.substring(sp + 1);
  arg.trim();
  cmd.toLowerCase();

  if (cmd == "name") {
    if (arg.length() == 0) {
      Serial.printf("Name: %s\n", tagName.c_str());
    } else if (arg == "reset") {
      prefs.remove("name");
      Serial.println("Name reset. Restarting...");
      scheduleRestart();
    } else if (renameTag(arg)) {
      Serial.printf("Renamed to \"%s\". Restarting...\n", arg.c_str());
    } else {
      Serial.printf("Name must be 1-%d printable characters.\n", NAME_MAX_LEN);
    }
  } else if (cmd == "buzz") {
    runBuzz(arg.length() ? arg.toInt() : BUZZ_MS);
  } else if (cmd == "hold") {
    Serial.println("Buzzer steady HIGH.");
    runHold(arg.length() ? arg.toInt() : 1000);
  } else if (cmd == "wave") {
    unsigned on = 0, off = 0, ms = 1000;
    if (sscanf(arg.c_str(), "%u %u %u", &on, &off, &ms) < 2 || on + off == 0) {
      Serial.println("Usage: wave <on_us> <off_us> [ms]   e.g. wave 500 500 1000");
      return;
    }
    Serial.printf("Wave %u us on / %u us off (%lu Hz) for %u ms\n", on, off, 1000000UL / (on + off), ms);
    runWave(on, off, ms);
  } else if (cmd == "sweep") {
    runSweep();
  } else {
    printHelp();
  }
}

// ---- Main -------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  prefs.begin("crintx", false);
  tagName = prefs.getString("name", defaultName());

  startBle();

  Serial.printf("\n%s advertising. Type `help` for commands.\n", tagName.c_str());
}

void loop() {
  static String line;
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (line.length()) handleLine(line);
      line = "";
    } else if (line.length() < 64) {
      line += c;
    }
  }

  if (jobPending) {
    if (job.kind == JOB_BUZZ) runBuzz(job.ms);
    else runWave(job.onUs, job.offUs, job.ms);
    jobPending = false;
  }

  if (restartAt && (int32_t)(millis() - restartAt) >= 0) ESP.restart();

  delay(5);
}
