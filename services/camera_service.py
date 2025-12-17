import cv2
import telebot
import http.server
import socketserver
import threading
import os
import time
import json
from datetime import datetime

# --- CONFIGURACIÓN ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
PUBLIC_UPLOADS_DIR = os.path.join(BASE_DIR, '..', 'public', 'uploads')
SUBSCRIBERS_FILE = os.path.join(DATA_DIR, 'subscribers.json')

# Assegurar que el directorio de uploads existe
if not os.path.exists(PUBLIC_UPLOADS_DIR):
    os.makedirs(PUBLIC_UPLOADS_DIR)

# API TELEGRAM
API_TOKEN = '8460929934:AAFe-JCUYVURQ30nz_XJMpCv9bFqSPgHe4g'
bot = telebot.TeleBot(API_TOKEN)

# CONFIGURACIÓN DEL SERVIDOR HTTP
PUERTO_HTTP = 8000
camara = cv2.VideoCapture(0) # 0 suele ser la webcam integrada

def cargar_suscriptores():
    """Lee la lista de Chat IDs desde el archivo JSON."""
    try:
        with open(SUBSCRIBERS_FILE, 'r') as f:
            data = json.load(f)
            # Retorna una lista de solo los IDs
            return [sub['id'] for sub in data]
    except FileNotFoundError:
        print("⚠️ Archivo de suscriptores no encontrado. Creando uno vacío.")
        return []
    except Exception as e:
        print(f"❌ Error leyendo suscriptores: {e}")
        return []

# --- FUNCIÓN COMPARTIDA PARA TOMAR FOTO ---
def procesar_alerta(origen):
    print(f"🚨 ¡ALERTA RECIBIDA desde {origen}! Tomando foto...")
    
    # 1. Tomar la foto
    ret, frame = camara.read()
    if ret:
        # Generar nombre único con fecha y hora
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        foto_nombre = f"captura_{timestamp}.jpg"
        foto_path = os.path.join(PUBLIC_UPLOADS_DIR, foto_nombre)
        
        # Guardar en la carpeta pública de Next.js
        cv2.imwrite(foto_path, frame)
        print(f"📸 Foto guardada en: {foto_path}")
        
        # 2. Enviar a todos los suscriptores
        chat_ids = cargar_suscriptores()
        if not chat_ids:
            print("⚠️ No hay suscriptores para notificar.")
            return

        try:
            # Abrir archivo una vez para leer bytes
            with open(foto_path, 'rb') as foto_obj:
                foto_bytes = foto_obj.read()

            for chat_id in chat_ids:
                try:
                    bot.send_photo(chat_id, foto_bytes, caption=f"🚨 Alerta de {origen}\n📅 {timestamp}")
                    print(f"✅ Enviado a {chat_id}")
                except Exception as ex:
                    print(f"❌ Error enviando a {chat_id}: {ex}")

        except Exception as e:
            print(f"❌ Error procesando foto para Telegram: {e}")
    else:
        print("❌ Error al acceder a la cámara")

# --- SERVIDOR HTTP (Para escuchar al ESP32 directamente) ---
class HandlerAlerta(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/alerta':
            # Responder OK al ESP32 rápido
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Alerta recibida")
            
            # Procesar la alerta
            procesar_alerta("ESP32 (WiFi)")
        else:
            self.send_response(404)
            self.end_headers()

def iniciar_servidor():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PUERTO_HTTP), HandlerAlerta) as httpd:
        print(f"📡 Servidor de Alerta escuchando en puerto {PUERTO_HTTP}")
        httpd.serve_forever()

# --- ARRANQUE ---
try:
    bot_info = bot.get_me()
    print(f"✅ Conectado exitosamente como: {bot_info.first_name} (@{bot_info.username})")
    print("🤖 El Bot en la PC está escuchando...")
    
    hilo_server = threading.Thread(target=iniciar_servidor, daemon=True)
    hilo_server.start()
    
except Exception as e:
    print(f"❌ Error al conectar con Telegram: {e}")
    exit()

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "👋 ¡Hola! Estoy conectado. Envíame 'Intruso' o usa el ESP32.")

@bot.message_handler(func=lambda message: True)
def manejar_mensajes(message):
    texto = message.text
    if "Intruso" in texto or "ALERTA" in texto: 
        procesar_alerta(f"Telegram ({message.from_user.first_name})")
    else:
        print(f"Mensaje recibido: {texto}")
        bot.reply_to(message, f"Recibido: {texto}. (Envía 'Intruso' para la foto)")

bot.polling()