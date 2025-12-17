#define PIN_SENSOR 13
#define PIN_LED 2
#include <WiFi.h>

#include <WiFiClientSecure.h>
#include <HTTPClient.h> // LIBRERÍA NUEVA PARA ENVIAR ALERTA DIRECTA
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>

const char* ssid = "Alfonso-fi";
const char* password = "NoseASDF123";
const char* botToken = "8460929934:AAFe-JCUYVURQ30nz_XJMpCv9bFqSPgHe4g";
const char* chatId = "918553937";
const char* chatId2 = "6146415470";

// --- CONFIGURACIÓN ALERTA DIRECTA A PC ---
// IMPORTANTE: CAMBIA ESTA IP POR LA DE TU PC (Ej: 192.168.1.15)
String serverName = "http://192.168.137.1:8000/alerta"; 

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

  Serial.println("IP del ESP32: " + WiFi.localIP().toString());
  Serial.println("Recuerda actualizar la variable 'serverName' con la IP de tu PC.");
}

void enviarAlertaPC() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    Serial.println("📡 Enviando alerta directa a PC: " + serverName);
    
    http.begin(serverName);
    int httpResponseCode = http.GET(); // Envia la petición GET
    
    if (httpResponseCode > 0) {
      Serial.print("Respuesta PC: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error enviando a PC: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Desconectado");
  }
}

void loop() {
  int movimiento = digitalRead(PIN_SENSOR);
  if (movimiento == HIGH) {
    Serial.println("🚨 ¡MOVIMIENTO DETECTADO! Enviando alertas...");

    // 1. Enviar alerta directa a la PC (Más rápido, toma la foto al instante)
    enviarAlertaPC();

    // 2. Enviar mensaje a Telegram (Respaldo en la nube)
    bot.sendMessage(chatId, "🚨 ALERTA: Intruso detectado", "");
    bot.sendMessage(chatId2, "🚨 ALERTA: Intruso detectado", "");

    // Esperar un poco para no saturar
    delay(1500); 

  } else {
    // Serial.println("Zona despejada...");
  }
  delay(1500);
}