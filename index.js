import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import TelegramBot from "node-telegram-bot-api";

// CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONFIGURACIÓN TELEGRAM - ASEGÚRATE DE QUE SEAN VÁLIDOS
const TOKEN = '8622153154:AAGHHDTA6Pv_umK5tCU9N8HU5enx3z3QEiA'; 
const MY_CHAT_ID = '1003800496169'; 
const bot = new TelegramBot(TOKEN, { polling: true });

const USER_ID_FILTER = "UWSWLQ"; 

// --- NÚCLEO MATEMÁTICO: REGRESIÓN Y PROBABILIDAD ---
function predictNext(history) {
    if (history.length < 5) return null;

    const values = history.map(d => d.value).reverse(); // Del más antiguo al más nuevo
    const n = values.length;
    
    // 1. Cálculo de Regresión Lineal (Tendencia)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predicción teórica
    let rawPrediction = slope * n + intercept;

    // 2. Filtro de Seguridad (Leyes de Probabilidad)
    const last = values[n-1];
    let finalPred = rawPrediction;
    let confianza = 85;

    if (last < 1.30) { 
        finalPred = 2.40; // Ley de compensación tras cuota basura
        confianza = 96;
    } else if (last > 10) {
        finalPred = 1.50; // Ajuste de riesgo tras cuota alta (Riesgo de racha negra)
        confianza = 70;
    }

    // Asegurar que la predicción sea rentable (> 1.50)
    if (finalPred < 1.50 && last >= 1.30) finalPred = 1.85;

    return {
        val: finalPred.toFixed(2),
        take: (finalPred * 0.85).toFixed(2), // Retiro al 85% del objetivo
        conf: confianza
    };
}

console.log("🚀 SISTEMA MATEMÁTICO V2 ACTIVO...");

const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(15));
let lastId = null;

onSnapshot(q, (snap) => {
    if (snap.empty) return;
    const latestDoc = snap.docs[0];
    if (lastId === latestDoc.id) return;
    lastId = latestDoc.id;

    const data = latestDoc.data();
    if (data.userId === USER_ID_FILTER) {
        let history = [];
        snap.forEach(d => {
            if (d.data().userId === USER_ID_FILTER) history.push(d.data());
        });

        const res = predictNext(history);
        if (res) {
            const msg = `
📊 **ANÁLISIS DE TENDENCIA**
━━━━━━━━━━━━━━━━━━
🚀 OBJETIVO: **${res.val}x**
💰 RETIRO SEGURO: **${res.take}x**
🔥 CONFIANZA: **${res.conf}%**
━━━━━━━━━━━━━━━━━━
⚠️ *Entra solo si la confianza es > 85%*`;

            bot.sendMessage(MY_CHAT_ID, msg, { parse_mode: "Markdown" })
               .catch(e => console.error("Error envío:", e.message));
        }
    }
});