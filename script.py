import cv2
import telebot
import http.server
import socketserver
import threading

# TUS DATOS (Los mismos que usaste en el ESP32)
API_TOKEN = '8460929934:AAFe-JCUYVURQ30nz_XJMpCv9bFqSPgHe4g'
CHAT_ID = '918553937'
CHAT_ID2 = "6146415470"

# CONFIGURACIÓN DEL SERVIDOR HTTP
PUERTO_HTTP = 8000

bot = telebot.TeleBot(API_TOKEN)
camara = cv2.VideoCapture(0) # 0 suele ser la webcam integrada

# --- FUNCIÓN COMPARTIDA PARA TOMAR FOTO ---
def procesar_alerta(origen):
    print(f"🚨 ¡ALERTA RECIBIDA desde {origen}! Tomando foto...")
    
    # 1. Tomar la foto
    ret, frame = camara.read()
    if ret:
        foto_nombre = "captura_intruso.jpg"
        cv2.imwrite(foto_nombre, frame)
        
        # 2. Enviar la foto al chat
        try:
            foto = open(foto_nombre, 'rb')
            # Enviar a ambos chats
            bot.send_photo(CHAT_ID, foto, caption=f"🚨 Alerta de {origen}")
            
            # Rebobinar archivo para leerlo de nuevo o abrirlo de nuevo es más seguro
            foto.seek(0) 
            bot.send_photo(CHAT_ID2, foto, caption=f"🚨 Alerta de {origen}")
            
            foto.close()
            print("✅ Foto enviada a Telegram.")
        except Exception as e:
            print(f"❌ Error enviando foto: {e}")
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
    # Allow_reuse_address para evitar error de puerto ocupado al reiniciar rápido
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PUERTO_HTTP), HandlerAlerta) as httpd:
        print(f"📡 Servidor de Alerta escuchando en puerto {PUERTO_HTTP} (http://IP_PC:{PUERTO_HTTP}/alerta)")
        httpd.serve_forever()

# Verificar conexión e imprimir datos del bot
try:
    bot_info = bot.get_me()
    print(f"✅ Conectado exitosamente como: {bot_info.first_name} (@{bot_info.username})")
    print("🤖 El Bot en la PC está escuchando...")
    
    # Iniciar servidor HTTP en un hilo aparte
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
    # Detectar variantes de alerta
    texto = message.text
    if "Intruso" in texto or "ALERTA" in texto: 
        procesar_alerta(f"Telegram ({message.from_user.first_name})")
    else:
        # Responder a otros mensajes para confirmar vida
        print(f"Mensaje recibido: {texto}")
        bot.reply_to(message, f"Recibido: {texto}. (Envía 'Intruso' para la foto)")

bot.polling()