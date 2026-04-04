#include <Servo.h>

String inputString = "";
bool stringComplete = false;
bool streamingEnabled = false;

int pulseValue = 0;
long ultraDuration = 0;

Servo servos[20];
bool servoAttached[20] = {false};

void setup() {
  Serial.begin(115200);
}

void loop() {

  // 🔹 HANDLE INCOMING COMMANDS
  while (Serial.available()) {
    char inChar = (char)Serial.read();

    if (inChar == '\n') {
      stringComplete = true;
      break;
    } else {
      inputString += inChar;
    }
  }

  if (stringComplete) {

    // DIGITAL WRITE
    if (inputString.startsWith("DW")) {
      int pin, value;
      sscanf(inputString.c_str(), "DW %d %d", &pin, &value);
      pinMode(pin, OUTPUT);
      digitalWrite(pin, value);
    }

    // DIGITAL READ (still supported if needed)
    else if (inputString.startsWith("DR")) {
      int pin;
      sscanf(inputString.c_str(), "DR %d", &pin);
      Serial.print("D ");
      Serial.print(pin);
      Serial.print(" ");
      Serial.println(digitalRead(pin));
    }

    // PWM
    else if (inputString.startsWith("PW")) {
      int pin, value;
      sscanf(inputString.c_str(), "PW %d %d", &pin, &value);
      pinMode(pin, OUTPUT);
      analogWrite(pin, value);
    }

    // SERVO
    else if (inputString.startsWith("SW")) {
      int pin, angle;
      sscanf(inputString.c_str(), "SW %d %d", &pin, &angle);

    if (!servoAttached[pin]) {
      servos[pin].attach(pin);
      servoAttached[pin] = true;
    }

    servos[pin].write(angle);
}
    // PIN MODE
    else if (inputString.startsWith("PM")) {
      int pin;
      char mode[20];
      sscanf(inputString.c_str(), "PM %d %s", &pin, mode);

      if (strcmp(mode, "INPUT") == 0) pinMode(pin, INPUT);
      else if (strcmp(mode, "OUTPUT") == 0) pinMode(pin, OUTPUT);
      else if (strcmp(mode, "INPUT_PULLUP") == 0) pinMode(pin, INPUT_PULLUP);
    }

    // ANALOG READ
    else if (inputString.startsWith("AR")) {
      int pin;
      sscanf(inputString.c_str(), "AR %d", &pin);
      Serial.print("A ");
      Serial.print(pin);
      Serial.print(" ");
      Serial.println(analogRead(pin));
    }

    // PULSE IN
    else if (inputString.startsWith("PI")) {
      int pin;
      sscanf(inputString.c_str(), "PI %d", &pin);
      pulseValue = pulseIn(pin, HIGH);
      Serial.print("P ");
      Serial.println(pulseValue);
    }

    // SEND PULSE
    else if (inputString.startsWith("SP")) {
      int pin, time;
      sscanf(inputString.c_str(), "SP %d %d", &pin, &time);
      pinMode(pin, OUTPUT);
      digitalWrite(pin, HIGH);
      delayMicroseconds(time);
      digitalWrite(pin, LOW);
    }

    // ULTRASONIC
    else if (inputString.startsWith("US")) {
      int trig, echo;
      sscanf(inputString.c_str(), "US %d %d", &trig, &echo);

      pinMode(trig, OUTPUT);
      pinMode(echo, INPUT);

      digitalWrite(trig, LOW);
      delayMicroseconds(2);
      digitalWrite(trig, HIGH);
      delayMicroseconds(10);
      digitalWrite(trig, LOW);

      ultraDuration = pulseIn(echo, HIGH);

      Serial.print("U ");
      Serial.println(ultraDuration);
    }

    inputString = "";
    stringComplete = false;
  }

  else if (inputString.startsWith("ST")) {
  streamingEnabled = true;
  }

  // 🔥 STREAMING (THIS IS THE KEY PART)

  if (streamingEnabled) {

  // DIGITAL PINS
  for (int i = 2; i <= 6; i++) {
    Serial.print("D ");
    Serial.print(i);
    Serial.print(" ");
    Serial.println(digitalRead(i));
  }

  // ANALOG PINS
  for (int i = 0; i <= 5; i++) {
    Serial.print("A ");
    Serial.print(i);
    Serial.print(" ");
    Serial.println(analogRead(i));
  }

  delay(20); // VERY IMPORTANT (stability)
 }
}
