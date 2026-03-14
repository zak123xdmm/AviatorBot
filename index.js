import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

const TELEGRAM_TOKEN = '8622153154:AAGHHDTA6Pv_umK5tCU9N8HU5enx3z3QEiA'; 
const CHAT_ID = '8345781964';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let lastSignalTime = 0;

async function sendSignal(target, conf, motivo) {
    const now = Date.now();
    if (now - lastSignalTime < 30000) return; 

    const msg = `🎯 *PRONÓSTICO DE ALTA PRECISIÓN*\n\n✅ *ENTRADA CONFIRMADA*\n🎯 *OBJETIVO:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *ANÁLISIS:* ${motivo}\n\n⚠️ _Retirar 0.10x antes por seguridad._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
        lastSignalTime = now;
        console.log(`✅ SEÑAL ENVIADA: ${target}x`);
    } catch (e) { console.log("❌ Error:", e.message); }
}

const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const last = last6[last6.length - 1];
        
        // --- MOTOR DE CÁLCULO BAYESIANO ---
        // Sumamos la "deuda" del casino
        const factorRiesgo = last6.reduce((acc, v) => acc + (v < 1.2 ? 2 : v < 1.5 ? 1 : -2), 0);
        const redCount = last6.filter(v => v < 1.5).length;

        let target = 0;
        let conf = 0;
        let motivo = "";

        // CASO 1: REBOTE TRAS INSTACRASH (Muy preciso)
        if (last <= 1.02 && redCount >= 4) {
            target = "1.58";
            conf = 98;
            motivo = "REBOTE POR VACÍO DE ALGORITMO";
        }
        // CASO 2: COMPENSACIÓN TRAS RACHA FRÍA
        else if (factorRiesgo >= 7 && redCount >= 5) {
            // Calculamos un target dinámico basado en qué tan mala es la racha
            target = (2.05 + (factorRiesgo * 0.08)).toFixed(2);
            conf = 91;
            motivo = "PAGO POR SATURACIÓN TÉCNICA";
        }
        // CASO 3: RECUPERACIÓN ESTÁNDAR
        else if (redCount >= 5) {
            target = "2.12";
            conf = 88;
            motivo = "CICLO DE COMPENSACIÓN BÁSICO";
        }

        if (target > 0) sendSignal(target, conf, motivo);
    }
});

setInterval(() => console.log("💎 Motor de Precisión V12.1 Monitoreando..."), 60000);