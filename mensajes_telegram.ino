#define PIN_SENSOR 13
#define PIN_LED 2
#include <WiFi.h>

#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>

const char* ssid = "Alfonso-fi";
const char* password = "12345678";
const char* botToken = "8460929934:AAFe-JCUYVURQ30nz_XJMpCv9bFqSPgHe4g";
const char* chatId = "918553937";
const char* chatId2 = "6146415470";

// --- OBJETOS DE TELEGRAM ---
WiFiClientSecure client;
UniversalTelegramBot bot(botToken, client);

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SENSOR, INPUT);
  pinMode(PIN_LED, OUTPUT);
  WiFi.begin(ssid, password);

  Serial.print("Conectando");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("¡Conectado al Wi-Fi!");

// 2. Configuración de Seguridad
  // Esto es vital: le dice al ESP32 que confíe en Telegram sin certificados complejos
  client.setInsecure(); 

  // 3. Mensaje de prueba al iniciar
  bot.sendMessage(chatId, "🟢 Sistema de Alarma Iniciado", "");
  bot.sendMessage(chatId2, "🟢 Sistema de Alarma Iniciado", "");

  Serial.println(WiFi.localIP());
}

void loop() {
  int movimiento = digitalRead(PIN_SENSOR);
  if (movimiento == HIGH) {


bot.sendMessage(chatId, "🚨 ALERTA: Intruso detectado", "");
bot.sendMessage(chatId2, "🚨 ALERTA: Intruso detectado", "");

  } else {
    Serial.println("Zona despejada...");
  }
  delay(500);
}