import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

// 1. CONFIGURACIÓN DE TUS CREDENCIALES
const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

// --- REEMPLAZA ESTO CON TU TOKEN ---
const TELEGRAM_TOKEN = 'TU_TOKEN_AQUÍ'; 
const CHAT_ID = '8345781964';

// 2. INICIALIZACIÓN
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🚀 Safe-Guard Engine iniciado en Railway...");
console.log("📡 Escuchando cambios en Firebase para el ID: " + CHAT_ID);

// 3. FUNCIÓN DE ENVÍO A TELEGRAM
async function notifyTelegram(target, conf, status) {
    const icon = status.includes("PELIGRO") ? "⚠️" : "✅";
    const msg = `
${icon} *SEÑAL SAFE-GUARD*
--------------------------
🎯 *Objetivo:* ${target}x
💎 *Confianza:* ${conf}%
📊 *Estado:* ${status}
--------------------------
🔔 _Retira antes del objetivo._
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`;
    
    try {
        const response = await fetch(url);
        if (response.ok) {
            console.log(`[${new Date().toLocaleTimeString()}] Mensaje enviado con éxito.`);
        } else {
            console.error("Error en la respuesta de Telegram:", response.statusText);
        }
    } catch (e) {
        console.error("Error de conexión con la API de Telegram:", e);
    }
}

// 4. LÓGICA DE ANÁLISIS EN TIEMPO REAL
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    // Obtenemos los últimos valores y los invertimos para que el más nuevo sea el último del array
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 5) {
        const last = history[history.length - 1];
        
        // Contamos cuántos "azules" (menores a 1.8) han salido recientemente
        let blueCount = 0;
        history.slice(-6).forEach(v => { if (v < 1.8) blueCount++; });

        let target = 1.30;
        let conf = 75;
        let status = "ESTABLE";

        // Caso de saturación (El casino está quitando dinero)
        if (blueCount >= 4) {
            target = 1.15;
            conf = 95;
            status = "PELIGRO DE INSTACRASH";
        } 
        // Caso de rebote tras un número muy bajo
        else if (last < 1.2) {
            target = 1.25;
            conf = 90;
            status = "REBOTE SEGURO";
        }

        // 5. DISPARADOR DE NOTIFICACIÓN
        // Solo mandamos mensaje si la confianza es alta para no saturar Railway ni tu celular
        if (conf >= 90) {
            notifyTelegram(target.toFixed(2), conf, status);
        }
    }
}, (error) => {
    console.error("Error en la escucha de Firebase:", error);
});