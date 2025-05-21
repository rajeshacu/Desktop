#define BUZZER_PIN 4  // GPIO pin connected to the buzzer

int melody[] = {
  262, 262, 294, 262, 349, 330, 0,
  262, 262, 294, 262, 392, 349, 0,
  262, 262, 523, 440, 349, 330, 294, 0,
  466, 466, 440, 349, 392, 349
};

int noteDurations[] = {
  4, 4, 2, 2, 2, 1, 4,
  4, 4, 2, 2, 2, 1, 4,
  4, 4, 2, 2, 2, 2, 1, 4,
  4, 4, 2, 2, 2, 1
};

void setup() {
  for (int i = 0; i < sizeof(melody) / sizeof(int); i++) {
    int noteDuration = 1000 / noteDurations[i];
    if (melody[i] == 0) {
      delay(noteDuration);
    } else {
      tone(BUZZER_PIN, melody[i], noteDuration);
    }
    delay(noteDuration * 1.3);
    noTone(BUZZER_PIN);
  }
}

void loop() {
  // Nothing in loop
}
