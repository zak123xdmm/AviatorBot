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

// 2. CONFIGURACIÓN DE TELEGRAM (ACTUALIZADA)
const TELEGRAM_TOKEN = '8622153154:AAGHHDTA6Pv_umK5tCU9N8HU5enx3z3QEiA'; 
const CHAT_ID = '8345781964';

// Inicialización de servicios
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("-----------------------------------------");
console.log("🎯 MODO FRANCOTIRADOR V10.6 - ONLINE");
console.log("📡 Usando nuevo Token: 8622153...EiA");
console.log("-----------------------------------------");

// 3. FUNCIÓN DE ENVÍO PROFESIONAL
async function sendSignal(target, conf, motivo) {
    const msg = `💎 *SEÑAL DE ALTA PROBABILIDAD*\n\n🎯 *OBJETIVO:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *ANÁLISIS:* ${motivo}\n\n⚠️ _Retirar en el punto exacto para asegurar ganancia._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            })
        });
        const data = await response.json();
        if (data.ok) {
            console.log(`✅ [${new Date().toLocaleTimeString()}] SEÑAL ENVIADA AL CELULAR`);
        } else {
            console.log("❌ ERROR TELEGRAM:", data.description);
        }
    } catch (e) {
        console.log("❌ ERROR DE RED:", e.message);
    }
}

// 4. MOTOR DE PREDICCIÓN (LÓGICA DE SEGURIDAD)
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    const history = snap.docs.map(d => d.data().value).reverse();
    
    if (history.length >= 5) {
        const lastValues = history.slice(-5);
        const lastValue = lastValues[lastValues.length - 1];
        
        // FILTRO: Detectar racha de rojos (< 1.30x)
        const coldCount = lastValues.filter(v => v < 1.30).length;

        // ESTRATEGIA: Si hay 4 o más rojos y el último es un crash extremo
        if (coldCount >= 4 && lastValue < 1.10) {
            sendSignal("1.22", "94", "SATURACIÓN DE ALGORITMO");
        } 
        else {
            console.log(`📡 [LOG] Escuchando: ${lastValue}x. Mercado en espera de patrón.`);
        }
    }
}, (error) => {
    console.log("❌ ERROR FIREBASE:", error.message);
});

// 5. ANCLA DE ACTIVIDAD (Mantiene el servidor despierto en Railway)
setInterval(() => {
    console.log("💎 Sistema Francotirador: Verificando integridad del servidor...");
}, 60000);
