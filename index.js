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
    if (now - lastSignalTime < 25000) return; // Cooldown de 25s

    const msg = `🔥 *SEÑAL DE PRECISIÓN V12*\n\n🎯 *OBJETIVO:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *ANÁLISIS:* ${motivo}\n\n⚠️ _Retirar antes del objetivo._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
        lastSignalTime = now;
        console.log(`✅ SEÑAL PRECISA ENVIADA: ${target}x`);
    } catch (e) { console.log("❌ Error:", e.message); }
}

const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const lastValue = last6[last6.length - 1];
        
        // --- MOTOR DE PESO DE ABSORCIÓN ---
        // Calcula qué tanto "debe" el algoritmo según la gravedad de los rojos
        const absorcion = last6.reduce((acc, val) => {
            if (val < 1.10) return acc + 3; // Instacrashes pesan más
            if (val < 1.50) return acc + 1; // Rojos normales
            return acc - 2; // Verdes liberan presión
        }, 0);

        const redCount = last6.filter(v => v < 1.50).length;

        let target = 0;
        let conf = 0;
        let motivo = "";

        // Lógica de disparo por saturación
        if (absorcion >= 8 && redCount >= 5) {
            target = (2.12 + (absorcion * 0.10)).toFixed(2);
            conf = 94;
            motivo = "SATURACIÓN CRÍTICA DETECTADA";
        } 
        else if (lastValue <= 1.02 && redCount >= 4) {
            target = "1.52";
            conf = 98;
            motivo = "REBOTE DE ALTA SEGURIDAD";
        }
        else if (redCount >= 5 && lastValue < 1.20) {
            target = "2.10";
            conf = 89;
            motivo = "COMPENSACIÓN LINEAL";
        }

        if (target > 0) sendSignal(target, conf, motivo);
    }
});

setInterval(() => console.log("📡 Monitoreando flujo de precisión..."), 60000);