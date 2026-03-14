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
    if (now - lastSignalTime < 20000) return; // Cooldown reducido a 20s

    const msg = `🎯 *PREDICCIÓN CALCULADA*\n\n📈 *PRÓXIMO MULTIPLICADOR:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *BASE:* ${motivo}\n\n⚠️ _Sugerencia: Retirar en ${ (target - 0.10).toFixed(2) }x para asegurar._`;
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

const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const redCount = last6.filter(v => v < 1.5).length;
        const last = last6[last6.length - 1];

        // --- ALGORITMO DE PREDICCIÓN DINÁMICA ---
        // Calculamos la "Presión de Pago" sumando cuánto se alejaron los rojos del 2.0x
        const presionPago = last6.reduce((acc, v) => acc + (2.0 - v), 0);
        
        let predictedTarget = 0;
        let confidence = 0;
        let reason = "";

        // Si la racha de rojos es de 5 o más, el bot predice el multiplicador de escape
        if (redCount >= 5) {
            // Predicción: Base 1.80 + (Presión acumulada / Factor de dispersión)
            predictedTarget = (1.85 + (presionPago / 4)).toFixed(2);
            confidence = Math.min(95, 80 + (presionPago * 2)).toFixed(0);
            reason = "CÁLCULO POR COMPENSACIÓN DE FLUJO";
        } 
        // Si hay un crash extremo (1.00x), predice un rebote corto pero seguro
        else if (last <= 1.02 && redCount >= 3) {
            predictedTarget = (last + 0.55).toFixed(2);
            confidence = 98;
            reason = "PREDICCIÓN DE REBOTE TÉCNICO";
        }

        if (predictedTarget > 1.10) {
            sendSignal(predictedTarget, confidence, reason);
        }
    }
});
