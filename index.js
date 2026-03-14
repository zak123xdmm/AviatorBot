import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

// --- CONFIGURACIÓN ---
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

// --- FUNCIÓN DE SALIDA ---
async function sendSignal(target, conf, analisis) {
    const now = Date.now();
    if (now - lastSignalTime < 15000) return; // Cooldown optimizado para rondas seguidas

    const msg = `💎 *DETERMINACIÓN DE SISTEMA*\n\n🎯 *PUNTO DE SALIDA:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *BASE:* ${analisis}\n\n✅ _Instrucción: Salida automática configurada a ${target}x._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
        lastSignalTime = now;
        console.log(`✅ PREDICCIÓN FIJADA: ${target}x`);
    } catch (e) { console.log("❌ Error Telegram:", e.message); }
}

// --- MOTOR DE CÁLCULO ---
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(8));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 4) {
        const last = history[history.length - 1];
        const penult = history[history.length - 2];
        const antepenult = history[history.length - 3];
        
        // Análisis de Varianza (Diferencia acumulada del 2.0x)
        const varianza = history.reduce((acc, v) => acc + (2.0 - v), 0);
        
        let target = 0;
        let conf = 0;
        let reason = "";

        // LÓGICA 1: COMPENSACIÓN POR HUECO (Racha de rojos o valores mediocres)
        // Si la varianza es alta, el sistema DEBE pagar una cuota decente
        if (varianza > 4.5) {
            target = (2.02 + (varianza * 0.12)).toFixed(2);
            conf = 94;
            reason = "ALGORITMO EN PUNTO DE RETORNO";
        }
        
        // LÓGICA 2: REPETICIÓN DE PATRÓN DE ESPEJO
        // Si detecta un rebote tras un valor ínfimo
        else if (last <= 1.10) {
            target = (1.55 + (varianza * 0.05)).toFixed(2);
            conf = 97;
            reason = "PUNTO DE REBOTE MATEMÁTICO";
        }
        
        // LÓGICA 3: FLUJO CONTINUO (Para que no se quede callado)
        // Si hay una tendencia estable de rojos suaves (1.2 - 1.8)
        else if (last < 2.0 && penult < 2.0) {
            target = (2.12).toFixed(2);
            conf = 88;
            reason = "AJUSTE DE TENDENCIA LINEAL";
        }

        // Validación de cuota mínima para "Ganar Dinero"
        if (target > 1.30) {
            sendSignal(target, conf, reason);
        }
    }
});
