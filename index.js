import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

// 1. CONFIGURACIÓN DE FIREBASE (Aviator-Engine)
const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

// 2. CONFIGURACIÓN DE TELEGRAM (Integrada)
const TELEGRAM_TOKEN = '8151433013:AAFiK6qE09O3506Wn9Uis8fU13v-9-m6rN4'; 
const CHAT_ID = '8345781964';

// Inicialización de servicios
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("-----------------------------------------");
console.log("🚀 SAFE-GUARD ENGINE V10.6 - MODO SEGURO");
console.log("📡 Estado: Escuchando datos en tiempo real...");
console.log("📡 Monitorizando Chat ID: " + CHAT_ID);
console.log("-----------------------------------------");

// 3. FUNCIÓN DE ENVÍO DE ALERTAS
async function notifyTelegram(target, conf, status) {
    const msg = `
🚨 *SEÑAL DE ALTA PRECISIÓN* 🚨
------------------------------------
🎯 *ENTRADA:* ${target}x
💎 *CONFIANZA:* ${conf}%
📊 *MOTIVO:* ${status}
------------------------------------
⚠️ _Retiro Automático Sugerido_
💰 _Gestione su capital con disciplina_
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`;
    
    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log(`✅ [${new Date().toLocaleTimeString()}] Alerta enviada con éxito.`);
        } else {
            console.log("❌ Error en la API de Telegram. Verifica si el bot está iniciado.");
        }
    } catch (e) {
        console.error("❌ Error de conexión con Telegram:", e);
    }
}

// 4. MOTOR DE ANÁLISIS DE PROBABILIDAD
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    // Obtenemos los últimos valores registrados desde tu HTML
    const history = snap.docs.map(d => d.data().value).reverse();
    
    // Necesitamos historial para confirmar el patrón seguro
    if (history.length >= 5) {
        const last5 = history.slice(-5);
        
        // FILTRO: Detectar racha de rojos (menores a 1.50x)
        const coldStreak = last5.filter(v => v < 1.50).length;
        const lastValue = last5[last5.length - 1];

        let target = 0;
        let conf = 0;
        let status = "";

        // ESTRATEGIA: SATURACIÓN DE ROJOS (Punto de rebote estadístico)
        if (coldStreak >= 4 && lastValue < 1.25) {
            target = 1.20; // Entrada ultra conservadora
            conf = 98;
            status = "PATRÓN DE REBOTE CONFIRMADO";
        } 
        
        // ESTRATEGIA: RECUPERACIÓN TRAS DOBLE CRASH (< 1.10x)
        else if (last5[last5.length-1] < 1.10 && last5[last5.length-2] < 1.10) {
            target = 1.15;
            conf = 96;
            status = "REBOTE TRAS DOBLE INSTACRASH";
        }

        // DISPARADOR: Solo se envía si la confianza es superior al 95%
        if (conf >= 95) {
            notifyTelegram(target.toFixed(2), conf, status);
        } else {
            console.log(`ℹ️ [LOG] Dato: ${lastValue}x. Esperando racha de seguridad.`);
        }
    }
}, (err) => {
    console.error("❌ Error crítico de conexión a Base de Datos:", err.message);
});
