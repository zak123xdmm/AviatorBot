import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

// 1. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

// 2. CONFIGURACIÓN DE TELEGRAM (Tu ID confirmado)
const TELEGRAM_TOKEN = '8151433013:AAFiK6qE09O3506Wn9Uis8fU13v-9-m6rN4'; 
const CHAT_ID = '8345781964';

// Inicialización de Servicios
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("-----------------------------------------");
console.log("🎯 MODO FRANCOTIRADOR V10.6 - INICIADO");
console.log("📡 Estado: Escuchando datos de ingeniería...");
console.log("-----------------------------------------");

// Variable para evitar señales duplicadas seguidas
let lastSignalTime = 0;

// 3. FUNCIÓN DE ENVÍO OPTIMIZADA
async function sendSignal(target, conf, motivo) {
    const now = Date.now();
    // Evita mandar dos señales en menos de 10 segundos
    if (now - lastSignalTime < 10000) return; 

    const msg = `💎 *SEÑAL DE ALTA PROBABILIDAD*\n\n🎯 *ENTRADA:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *MOTIVO:* ${motivo}\n\n⚠️ _Retirar al llegar al objetivo._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            })
        });
        const data = await response.json();
        if (data.ok) {
            lastSignalTime = now;
            console.log(`✅ [${new Date().toLocaleTimeString()}] SEÑAL ENVIADA CON ÉXITO`);
        } else {
            console.log("❌ ERROR TELEGRAM:", data.description);
        }
    } catch (e) {
        console.log("❌ ERROR DE RED:", e.message);
    }
}

// 4. MOTOR DE ANÁLISIS (LÓGICA DE INGENIERÍA)
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    // Obtenemos los valores y los ordenamos cronológicamente
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const lastValue = last6[last6.length - 1];
        
        // Conteo de multiplicadores bajos (Rojos < 1.30x)
        const coldCount = last6.filter(v => v < 1.30).length;

        // ESTRATEGIA 1: SATURACIÓN EXTREMA (La más segura)
        // 5 rojos seguidos y el último fue casi pérdida total
        if (coldCount >= 5 && lastValue < 1.05) {
            sendSignal("1.15", "99", "COMPENSACIÓN DE SISTEMA");
        } 
        // ESTRATEGIA 2: DOBLE CRASH RÁPIDO
        else if (last6[last6.length-1] < 1.10 && last6[last6.length-2] < 1.10) {
            sendSignal("1.20", "96", "REBOTE ESTADÍSTICO");
        }
        else {
            console.log(`📡 Dato recibido: ${lastValue}x. Analizando patrones...`);
        }
    }
}, (error) => {
    console.log("❌ ERROR FIREBASE:", error.message);
});
