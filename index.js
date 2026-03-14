import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

// CONFIGURACIÓN FIREBASE
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
const userStats = {}; 

// FUNCIÓN DE ENVÍO A TELEGRAM
async function sendSignal(userId, target, conf, stats, seed) {
    const total = stats.wins + stats.losses;
    const efectividad = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;
    const shortSeed = seed.length > 20 ? seed.substring(0, 10) + "..." + seed.slice(-5) : seed;

    const msg = `👤 *USUARIO:* ${userId}\n` +
                `🔐 *SEMILLA:* \`${shortSeed}\`\n` +
                `🎯 *PRÓXIMA RONDA: ${target}x*\n` +
                `🔥 *CONFIANZA:* ${conf}%\n\n` +
                `📊 *TU RÉCORD PERSONAL:*\n` +
                `✅ Verdes: ${stats.wins} | ❌ Rojos: ${stats.losses}\n` +
                `🎯 Efectividad: ${efectividad}%\n\n` +
                `⚠️ _Retirar en ${(target - 0.12).toFixed(2)}x_`;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
    } catch (e) { console.error("Error Telegram:", e); }
}

// MOTOR DE PROCESAMIENTO
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(50));

onSnapshot(q, (snap) => {
    const allDocs = snap.docs.map(d => ({...d.data(), id: d.id}));
    const usersInSnap = [...new Set(allDocs.map(d => d.userId))];

    usersInSnap.forEach(userId => {
        if (!userId) return;
        
        // Obtenemos los últimos 8 registros de este usuario específico
        const history = allDocs.filter(d => d.userId === userId).slice(0, 8).reverse();

        if (history.length >= 8) {
            if (!userStats[userId]) userStats[userId] = { wins: 0, losses: 0, lastPred: 0, lastId: "" };
            const stats = userStats[userId];
            const currentSeed = history[history.length - 1].seedId || "global";
            const actualValue = history[history.length - 1].value;

            // VALIDACIÓN DE RESULTADO ANTERIOR
            if (stats.lastPred > 0 && stats.lastProcessedId !== history[history.length - 1].id) {
                if (actualValue >= stats.lastPred) {
                    stats.wins++;
                } else {
                    stats.losses++;
                }
                stats.lastProcessedId = history[history.length - 1].id;
                stats.lastPred = 0; 
            }

            // LÓGICA DE CÁLCULO BASADA EN SEMILLA
            // Extraemos energía del Hash (Base 16) si existe
            const seedEnergy = currentSeed.length >= 2 ? parseInt(currentSeed.substring(0, 2), 16) : 128;
            const balanceDeuda = history.reduce((acc, v) => acc + (2.0 - v.value), 0);
            
            // Ajuste de probabilidad: base 1.50x + factor de deuda + factor de semilla
            let target = (1.50 + (balanceDeuda * 0.12) + (seedEnergy / 1500)).toFixed(2);
            let conf = Math.min(99, 86 + (seedEnergy / 25)).toFixed(0);

            // CORRECCIÓN DE PISO: Evita multiplicadores menores a 1.20x
            target = Math.max(1.20, parseFloat(target)).toFixed(2);

            // Solo envía señal si el ID del último tiro es nuevo
            const currentLastId = history[history.length - 1].id;
            if (stats.lastId !== currentLastId) {
                stats.lastId = currentLastId;
                stats.lastPred = parseFloat(target);
                sendSignal(userId, target, conf, stats, currentSeed);
            }
        }
    });
});

console.log("🚀 Motor SAFE-GUARD V15.6 Activo en Railway");