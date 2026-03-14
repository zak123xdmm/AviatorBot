import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
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

// Almacén de estados por usuario (en memoria)
const userStats = {}; 

async function sendSignal(userId, target, conf, stats) {
    const total = stats.wins + stats.losses;
    const efectividad = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;

    const msg = `👤 *USUARIO:* ${userId.substring(0,6)}\n` +
                `🎯 *PRÓXIMA RONDA: ${target}x*\n` +
                `🔥 *CONFIANZA:* ${conf}%\n\n` +
                `📊 *TU RÉCORD PERSONAL:*\n` +
                `✅ Verdes: ${stats.wins} | ❌ Rojos: ${stats.losses}\n` +
                `🎯 Efectividad: ${efectividad}%\n\n` +
                `⚠️ _Retirar en ${(target - 0.10).toFixed(2)}x_`;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
    } catch (e) { console.log("❌ Error:", e.message); }
}

// Escuchamos la colección global
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(50));

onSnapshot(q, (snap) => {
    const allDocs = snap.docs.map(d => ({...d.data(), id: d.id}));
    
    // Agrupamos por usuario para procesar cada uno por separado
    const usersInSnap = [...new Set(allDocs.map(d => d.userId))];

    usersInSnap.forEach(userId => {
        if (!userId) return;

        // Filtramos los últimos 9 del usuario actual
        const userHistory = allDocs
            .filter(d => d.userId === userId)
            .slice(0, 9)
            .reverse();

        if (userHistory.length >= 8) {
            // Inicializamos stats si es usuario nuevo
            if (!userStats[userId]) userStats[userId] = { wins: 0, losses: 0, lastPred: 0 };

            const stats = userStats[userId];
            const actualResult = userHistory[userHistory.length - 1].value;

            // 1. Auditoría: ¿Se cumplió la predicción anterior de este usuario?
            if (stats.lastPred > 0) {
                if (actualResult >= stats.lastPred) stats.wins++;
                else stats.losses++;
                stats.lastPred = 0; 
            }

            // 2. Cálculo de la siguiente ronda para este usuario
            const last8 = userHistory.slice(-8);
            const deuda = last8.reduce((acc, v) => acc + (2.0 - v.value), 0);
            const lastVal = last8[7].value;

            let nextTarget = (1.85 + (deuda * 0.08)).toFixed(2);
            let confidence = 88;

            if (lastVal < 1.10) {
                nextTarget = (1.58 + (deuda * 0.12)).toFixed(2);
                confidence = 97;
            }

            // Solo enviamos si el último dato es nuevo (evitar spam)
            const lastDataId = userHistory[userHistory.length - 1].id;
            if (stats.lastProcessedId !== lastDataId) {
                stats.lastProcessedId = lastDataId;
                stats.lastPred = parseFloat(nextTarget);
                sendSignal(userId, nextTarget, confidence, stats);
            }
        }
    });
});