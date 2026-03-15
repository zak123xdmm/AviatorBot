// Importaciones locales para Node.js (Requiere: npm install firebase)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const myId = "UWSWLQ"; // Tu ID fijo

// --- LÓGICA DE PREDICCIÓN AVANZADA (Anti-Rojos) ---
// Esta lógica es la que evita que el bot tire puras cuotas de 1.20x
function analyzeRhythm(history) {
    if (history.length < 3) return { val: "---", take: "ESPERANDO DATOS" };
    
    const lastValue = history[0].value;
    const trend = history.slice(0, 3).map(d => d.value);
    
    let prediction = 2.10; // Objetivo mínimo para profit real
    
    // Si venimos de un rojo (< 1.50), buscamos el rebote verde
    if (lastValue < 1.5) {
        prediction = 2.50; 
    } else if (lastValue > 5.0) {
        // Si acaba de salir una muy alta, bajamos el riesgo
        prediction = 1.80;
    } else {
        prediction = lastValue * 1.15;
    }

    // RETIRO SEGURO: 20% de margen para no perder por un crash repentino
    const safeTake = (prediction * 0.80).toFixed(2);
    
    return {
        val: prediction.toFixed(2) + "x",
        take: safeTake + "x"
    };
}

// --- ESCUCHA DE DATOS Y NOTIFICACIÓN ---
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));

onSnapshot(q, (snap) => {
    let userHistory = [];
    snap.forEach(d => {
        const data = d.data();
        if (data.userId === myId) userHistory.push(data);
    });

    if (userHistory.length > 0) {
        const res = analyzeRhythm(userHistory);
        
        // Aquí es donde el bot de Telegram enviaría el mensaje
        console.log(`🎯 NUEVA PREDICCIÓN: ${res.val} | RETIRAR EN: ${res.take}`);
        
        // Si quieres que el bot hable, aquí iría la función de bot.sendMessage
    }
});

console.log("🚀 Servidor de Predicción Activo en Railway...");
