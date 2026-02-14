#include <Servo.h>

/*
  ===== SERIAL PROTOCOL =====

  PC → Arduino:
    DW pin value     (digital write)
    DR pin           (digital read)
    AR pin           (analog read)
    PW pin value     (PWM write)
    SW pin angle     (servo write)

  Arduino → PC:
    D pin value
    A pin value
*/

// ---------------- CONSTANTS ----------------
#define BAUD_RATE 115200
#define MAX_SERVOS 8

// ---------------- SERVO ----------------
Servo servos[MAX_SERVOS];
int servoPins[MAX_SERVOS];

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(BAUD_RATE);

  for (int i = 0; i < MAX_SERVOS; i++) {
    servoPins[i] = -1;
  }
}

// ---------------- MAIN LOOP ----------------
void loop() {
  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();

  // -------- DIGITAL WRITE --------
  if (cmd.startsWith("DW")) {
    int pin, value;
    sscanf(cmd.c_str(), "DW %d %d", &pin, &value);
    pinMode(pin, OUTPUT);
    digitalWrite(pin, value ? HIGH : LOW);
  }

  // -------- DIGITAL READ --------
  else if (cmd.startsWith("DR")) {
    int pin;
    sscanf(cmd.c_str(), "DR %d", &pin);
    pinMode(pin, INPUT);
    int value = digitalRead(pin);
    Serial.print("D ");
    Serial.print(pin);
    Serial.print(" ");
    Serial.println(value);
  }

  // -------- ANALOG READ --------
  else if (cmd.startsWith("AR")) {
    int pin;
    sscanf(cmd.c_str(), "AR %d", &pin);
    int value = analogRead(pin);
    Serial.print("A ");
    Serial.print(pin);
    Serial.print(" ");
    Serial.println(value);
  }

  // -------- PWM WRITE --------
  else if (cmd.startsWith("PW")) {
    int pin, value;
    sscanf(cmd.c_str(), "PW %d %d", &pin, &value);
    value = constrain(value, 0, 255);
    pinMode(pin, OUTPUT);
    analogWrite(pin, value);
  }

  // -------- SERVO WRITE --------
  else if (cmd.startsWith("SW")) {
    int pin, angle;
    sscanf(cmd.c_str(), "SW %d %d", &pin, &angle);
    angle = constrain(angle, 0, 180);

    int index = findServoIndex(pin);

    if (index == -1) {
      index = attachServo(pin);
    }

    if (index != -1) {
      servos[index].write(angle);
    }
  }
}

// ---------------- SERVO HELPERS ----------------
int findServoIndex(int pin) {
  for (int i = 0; i < MAX_SERVOS; i++) {
    if (servoPins[i] == pin) {
      return i;
    }
  }
  return -1;
}

int attachServo(int pin) {
  for (int i = 0; i < MAX_SERVOS; i++) {
    if (servoPins[i] == -1) {
      servos[i].attach(pin);   // IMPORTANT: stays attached
      servoPins[i] = pin;
      return i;
    }
  }
  return -1;
}
