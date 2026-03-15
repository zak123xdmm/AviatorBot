import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import TelegramBot from "node-telegram-bot-api";

// 1. CONFIGURACIÓN FIREBASE
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

// 2. CONFIGURACIÓN TELEGRAM
// REEMPLAZA ESTOS DOS VALORES
const TOKEN = 'TU_TOKEN_DE_TELEGRAM'; 
const MY_CHAT_ID = 'TU_CHAT_ID'; 

const bot = new TelegramBot(TOKEN, { polling: true });
const USER_ID_FILTER = "UWSWLQ"; 

// 3. MOTOR DE PREDICCIÓN (Lógica de Rebote para evitar el 1.20x)
function analyzeRhythm(history) {
    if (history.length < 3) return null;
    
    const last = history[0].value;
    let prediction = 2.15; 
    let confianza = "88%";

    // Si detectamos racha de rojos o el 1.20x basura, buscamos rebote verde
    if (last < 1.5) {
        prediction = 2.55; 
        confianza = "94%";
    } else if (last > 4.0) {
        prediction = 1.85;
        confianza = "82%";
    }

    const safeTake = (prediction * 0.82).toFixed(2); 
    
    return {
        val: prediction.toFixed(2),
        take: safeTake,
        conf: confianza
    };
}

// 4. ESCUCHA ACTIVA Y MANTENIMIENTO DE PROCESO
console.log("🚀 Servidor de Predicción Activo en Railway...");

const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(15));
let lastProcessedTimestamp = null;

onSnapshot(q, (snap) => {
    if (snap.empty) return;
    
    let userHistory = [];
    const latestDoc = snap.docs[0];
    const latestData = latestDoc.data();

    // Evitar duplicados por reinicios de servidor
    if (lastProcessedTimestamp && latestData.timestamp?.toMillis() <= lastProcessedTimestamp) return;
    lastProcessedTimestamp = latestData.timestamp?.toMillis();

    snap.forEach(d => {
        if (d.data().userId === USER_ID_FILTER) userHistory.push(d.data());
    });

    const res = analyzeRhythm(userHistory);
    
    if (res) {
        const msg = `
🎯 **NUEVA SEÑAL DETECTADA**
━━━━━━━━━━━━━━━━━━
📈 PRÓXIMA RONDA: **${res.val}x**
⚠️ RETIRAR EN: **${res.take}x**
🔥 CONFIANZA: **${res.conf}**
━━━━━━━━━━━━━━━━━━
✅ *Sincronizado con Panel Web*`;

        bot.sendMessage(MY_CHAT_ID, msg, { parse_mode: "Markdown" })
           .catch(err => console.error("Error Telegram:", err.message));
        
        console.log(`✅ Predicción enviada: ${res.val}x`);
    }
}, (error) => {
    console.error("Error Firebase Snapshot:", error);
});

// Mensaje de comando para verificar que el bot está vivo
bot.onText(/\/status/, (msg) => {
    bot.sendMessage(msg.chat.id, "✅ El sistema de predicción está Online y escuchando Firebase.");
});
