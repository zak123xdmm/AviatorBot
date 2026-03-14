import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import fetch from "node-fetch";

// 1. CONFIGURACIÓN DE NUBE (FIREBASE)
const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

// 2. CONFIGURACIÓN DE TELEGRAM
const TELEGRAM_TOKEN = '8622153154:AAGHHDTA6Pv_umK5tCU9N8HU5enx3z3QEiA'; 
const CHAT_ID = '8345781964';

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables de control de estado
let lastSignalTime = 0;
const SIGNAL_COOLDOWN = 30000; // 30 segundos entre señales para evitar spam

console.log("-------------------------------------------");
console.log("🎯 SAFE-GUARD PRECISION V11.6 - ACTIVO");
console.log("📡 Escuchando flujo de datos en Firebase...");
console.log("-------------------------------------------");

// 3. FUNCIÓN DE ENVÍO DE SEÑAL
async function sendSignal(target, conf, motivo) {
    const now = Date.now();
    
    // Evitar ráfagas de mensajes si entran datos muy rápido
    if (now - lastSignalTime < SIGNAL_COOLDOWN) {
        console.log(`⏳ Señal de ${target}x bloqueada por cooldown.`);
        return;
    }

    const msg = `🔥 *SEÑAL DE ALTO IMPACTO*\n\n🎯 *OBJETIVO:* ${target}x\n🔥 *CONFIANZA:* ${conf}%\n📊 *ANÁLISIS:* ${motivo}\n\n⚠️ _Retirar antes del punto objetivo._`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
        
        const resData = await response.json();
        if (resData.ok) {
            lastSignalTime = now;
            console.log(`✅ [${new Date().toLocaleTimeString()}] SEÑAL ENVIADA: ${target}x (${motivo})`);
        } else {
            console.log("❌ Error de Telegram:", resData.description);
        }
    } catch (e) {
        console.log("❌ Error de red/Fetch:", e.message);
    }
}

// 4. MOTOR DE ANÁLISIS MATEMÁTICO
// Escuchamos los últimos 10 datos para tener contexto suficiente
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    // Convertimos a array de números y lo invertimos para tener el orden cronológico
    const history = snap.docs.map(d => d.data().value).reverse();
    
    // Solo operamos si tenemos al menos 6 datos para detectar patrones reales
    if (history.length >= 6) {
        const last6 = history.slice(-6);
        const lastValue = last6[last6.length - 1];
        
        // --- MÉTRICAS DE PRECISIÓN ---
        const redCount = last6.filter(v => v < 1.50).length; // Conteo de rojos
        const ultraCrashes = last6.filter(v => v < 1.10).length; // Conteo de instacrashes (1.00x - 1.09x)
        
        let calculatedTarget = 0;
        let confidence = 0;
        let reason = "";

        // ESCENARIO 1: COMPENSACIÓN ALTA (PAGO POR SATURACIÓN)
        // Si hay 5 rojos y el casino ha quitado mucho dinero (<1.10x), el pago debe ser alto
        if (redCount >= 5 && ultraCrashes >= 3) {
            calculatedTarget = (2.10 + (ultraCrashes * 0.25)).toFixed(2); 
            confidence = 85;
            reason = "ALGORITMO EN SATURACIÓN DE PAGO";
        }
        
        // ESCENARIO 2: FASE DE PAGO ESTÁNDAR
        // Racha de 5 rojos normal
        else if (redCount >= 5 && lastValue < 1.18) {
            calculatedTarget = "2.12";
            confidence = 90;
            reason = "COMPENSACIÓN MATEMÁTICA";
        }
        
        // ESCENARIO 3: REBOTE TÉCNICO (MÁXIMA SEGURIDAD)
        // Tras 4 rojos y un crash muy seco, esperamos una salida rápida
        else if (redCount >= 4 && lastValue < 1.05) {
            calculatedTarget = "1.48";
            confidence = 97;
            reason = "REBOTE DE SEGURIDAD";
        }

        // 5. DISPARADOR DE SEÑAL
        if (calculatedTarget > 0) {
            sendSignal(calculatedTarget, confidence, reason);
        } else {
            // Log de monitoreo silencioso
            console.log(`📡 Monitoreando: ${lastValue}x | Rojos: ${redCount}/6`);
        }
    }
});

// Mantener el servidor despierto en Railway
setInterval(() => {
    console.log("💎 Sistema Safe-Guard monitoreando flujo activo...");
}, 60000);