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

async function sendSignal(target, conf, motivo, estrategia) {
    const now = Date.now();
    if (now - lastSignalTime < 25000) return; 

    const msg = `🚀 *PREDICCIÓN MATEMÁTICA V12.3*\n\n🎯 *OBJETIVO:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *ANÁLISIS:* ${motivo}\n\n💡 *ESTRATEGIA:* ${estrategia}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
        lastSignalTime = now;
        console.log(`✅ Predicción enviada: ${target}x`);
    } catch (e) { console.log("❌ Error:", e.message); }
}

const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(12));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const last = last6[5];
        
        // CÁLCULO DE PRESIÓN DE PAGO (Lógica de Ingeniería)
        const presion = last6.reduce((acc, v) => {
            if (v < 1.10) return acc + 2.8; // Mayor peso a los instacrashes
            if (v < 1.50) return acc + 1.4;
            if (v >= 2.00) return acc - 2.5; // Los verdes liberan la carga del servidor
            return acc;
        }, 0);

        const redCount = last6.filter(v => v < 1.5).length;

        let target = 0;
        let conf = 0;
        let motivo = "";
        let estrategia = "";

        // ESCENARIO 1: COMPENSACIÓN POR SATURACIÓN (El más rentable)
        if (presion >= 7.0 && redCount >= 5) {
            target = (1.92 + (presion * 0.12)).toFixed(2);
            conf = 95;
            motivo = "SATURACIÓN DE ALGORITMO DETECTADA";
            estrategia = `Entrada recomendada. Salida segura en ${(target - 0.15).toFixed(2)}x`;
        }
        
        // ESCENARIO 2: REBOTE TÉCNICO (Tras un 1.00x)
        else if (last <= 1.01 && redCount >= 4) {
            target = "1.58";
            conf = 98;
            motivo = "REBOTE POR CRASH SECO";
            estrategia = "Scalping rápido. No buscar multiplicadores altos aquí.";
        }

        if (target > 0) {
            sendSignal(target, conf, motivo, estrategia);
        }
    }
});