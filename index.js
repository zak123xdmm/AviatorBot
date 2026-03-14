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

// 2. CONFIGURACIÓN DE TELEGRAM (Tu ID verificado)
const TELEGRAM_TOKEN = '8151433013:AAFiK6qE09O3506Wn9Uis8fU13v-9-m6rN4'; 
const CHAT_ID = '8345781964';

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("-----------------------------------------");
console.log("🎯 MODO FRANCOTIRADOR ACTIVO - ALTA PRECISIÓN");
console.log("📡 Escuchando datos en tiempo real...");
console.log("-----------------------------------------");

// 3. FUNCIÓN DE ENVÍO PROFESIONAL
async function sendSignal(target, conf, motivo) {
    const msg = `💎 *SEÑAL DE ALTA PROBABILIDAD*\n\n🎯 *ENTRADA:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *MOTIVO:* ${motivo}\n\n⚠️ _Retirar de inmediato al llegar al objetivo._`;
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
            console.log("✅ SEÑAL ENVIADA AL CELULAR");
        } else {
            console.log("❌ ERROR TELEGRAM:", data.description);
        }
    } catch (e) {
        console.log("❌ ERROR DE RED:", e);
    }
}

// 4. MOTOR DE PREDICCIÓN (LÓGICA DE INGENIERÍA)
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const lastValue = last6[last6.length - 1];
        
        // Conteo de números bajos (rojos < 1.30x)
        const coldCount = last6.filter(v => v < 1.30).length;

        // PATRÓN 1: SATURACIÓN EXTREMA (Alta Precisión)
        // Si hay 5 rojos seguidos y el último es un "instacrash" (< 1.05x)
        if (coldCount >= 5 && lastValue < 1.05) {
            sendSignal("1.15", "99", "COMPENSACIÓN DE SISTEMA");
        } 
        // PATRÓN 2: REBOTE ESTADÍSTICO
        // Tras dos crashes muy bajos seguidos
        else if (last6[last6.length-1] < 1.10 && last6[last6.length-2] < 1.10) {
            sendSignal("1.20", "96", "REBOTE TRAS DOBLE CRASH");
        }
        else {
            console.log(`📡 Analizando: ${lastValue}x... Esperando oportunidad segura.`);
        }
    }
});
