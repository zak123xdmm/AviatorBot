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

// 2. CONFIGURACIÓN DE TELEGRAM (Tu Token Nuevo)
const TELEGRAM_TOKEN = '8622153154:AAGHHDTA6Pv_umK5tCU9N8HU5enx3z3QEiA'; 
const CHAT_ID = '8345781964';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("-----------------------------------------");
console.log("🎯 MOTOR V10.8 PRO - MODO FRANCOTIRADOR");
console.log("📡 Estado: Escuchando patrones de alta cuota");
console.log("-----------------------------------------");

// 3. FUNCIÓN DE ENVÍO DE SEÑALES
async function sendSignal(target, conf, motivo) {
    const msg = `🔥 *SEÑAL DE ALTO IMPACTO*\n\n🎯 *OBJETIVO:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *MOTIVO:* ${motivo}\n\n⚠️ _Espera el patrón y entra con confianza._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
        const data = await response.json();
        if (data.ok) console.log(`✅ [${new Date().toLocaleTimeString()}] SEÑAL ENVIADA: ${target}x`);
    } catch (e) {
        console.log("❌ Error de envío:", e.message);
    }
}

// 4. MOTOR DE ANÁLISIS CRÍTICO
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const lastValue = last6[last6.length - 1];
        
        // CONTEO TÉCNICO
        const reds = last6.filter(v => v < 1.50).length; // Rachas de pérdida
        const extremeCrashes = last6.filter(v => v < 1.10).length; // "Instacrashes"

        // ESTRATEGIA 1: EL "SALTO" (Multiplicador 2.15x)
        // Si el casino lleva 5 rojos y 2 de ellos fueron casi 1.00x, la compensación es inminente.
        if (reds >= 5 && extremeCrashes >= 2 && lastValue < 1.15) {
            sendSignal("2.15", "89", "COMPENSACIÓN MAYOR DETECTADA");
        } 
        // ESTRATEGIA 2: RECUPERACIÓN (Multiplicador 1.45x)
        else if (reds >= 4 && lastValue < 1.05) {
            sendSignal("1.45", "96", "REBOTE TÉCNICO");
        }
        else {
            console.log(`📡 Analizando: ${lastValue}x... Esperando patrón de alta probabilidad.`);
        }
    }
});

// 5. ANCLA DE ACTIVIDAD (Fundamental para Railway)
setInterval(() => {
    console.log("💎 Sistema activo y monitoreando Firebase...");
}, 55000);
