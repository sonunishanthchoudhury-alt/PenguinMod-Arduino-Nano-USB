#include <Servo.h>

String inputString = "";

void setup() {
  Serial.begin(115200);
}

void loop() {
  if (Serial.available()) {
    inputString = Serial.readStringUntil('\n');
    inputString.trim();

    if (inputString.startsWith("DW")) {
      int pin = inputString.substring(3, inputString.indexOf(' ', 3)).toInt();
      int value = inputString.substring(inputString.lastIndexOf(' ') + 1).toInt();
      pinMode(pin, OUTPUT);
      digitalWrite(pin, value);
    }

    else if (inputString.startsWith("DR")) {
      int pin = inputString.substring(3).toInt();
      pinMode(pin, INPUT);
      int value = digitalRead(pin);
      Serial.print("D ");
      Serial.print(pin);
      Serial.print(" ");
      Serial.println(value);
    }

    else if (inputString.startsWith("PW")) {
      int pin = inputString.substring(3, inputString.indexOf(' ', 3)).toInt();
      int value = inputString.substring(inputString.lastIndexOf(' ') + 1).toInt();
      pinMode(pin, OUTPUT);
      analogWrite(pin, value);
    }

    else if (inputString.startsWith("SW")) {
      int pin = inputString.substring(3, inputString.indexOf(' ', 3)).toInt();
      int angle = inputString.substring(inputString.lastIndexOf(' ') + 1).toInt();
      Servo s;
      s.attach(pin);
      s.write(angle);
    }

    else if (inputString.startsWith("AR")) {
      int pin = inputString.substring(3).toInt();
      int value = analogRead(pin);
      Serial.print("A ");
      Serial.print(pin);
      Serial.print(" ");
      Serial.println(value);
    }

    // NEW PULSEIN COMMAND
    else if (inputString.startsWith("PI")) {
      int pin = inputString.substring(3).toInt();
      pinMode(pin, INPUT);
      unsigned long duration = pulseIn(pin, HIGH, 1000000); // 1 sec timeout
      Serial.print("P ");
      Serial.println(duration);
    }
  }
}
