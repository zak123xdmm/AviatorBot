import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// CONFIGURACIÓN DE TU PROYECTO
const config = {
    apiKey: "AIzaSyAKITV7P-n2hhDdtyhyHR8l6TLu7SMqkq4",
    authDomain: "aviator-engine.firebaseapp.com",
    projectId: "aviator-engine",
    storageBucket: "aviator-engine.firebasestorage.app",
    messagingSenderId: "46567723254",
    appId: "1:46567723254:web:c3108b6fe059bdd93a9cd7"
};

const app = initializeApp(config);
const db = getFirestore(app);

// ID FIJO PARA TU SESIÓN
const myId = "UWSWLQ"; 

const valIn = document.getElementById('valIn');
const nextVal = document.getElementById('nextVal');
const nextTake = document.getElementById('nextTake');

// --- LÓGICA DE ESTRATEGIA Y PREDICCIÓN ---
function analyzeRhythm(history) {
    if (history.length < 3) return { val: "---", take: "FALTAN DATOS" };
    
    // Obtenemos el último resultado para detectar patrones
    const last = history[0].value;
    
    // PREDICCIÓN DE REBOTE: Si el último fue rojo (< 1.5), buscamos verde fuerte
    let prediction = 2.10; 
    
    if (last < 1.5) {
        prediction = 2.45; // Forzamos objetivo alto para recuperar
    } else {
        prediction = last * 1.2; // Seguimos la tendencia con un 20% de incremento
    }

    // RETIRO SEGURO: Calculamos salida anticipada (20% antes del crash)
    const safeTake = (prediction * 0.80).toFixed(2);
    
    return {
        val: prediction.toFixed(2) + "x",
        take: "RETIRAR EN: " + safeTake + "x"
    };
}

// --- REGISTRO DE DATOS ---
document.getElementById('btnSend').onclick = async () => {
    const v = parseFloat(valIn.value);
    if (!v || isNaN(v)) return;

    try {
        await addDoc(collection(db, "history"), {
            value: v,
            timestamp: serverTimestamp(),
            userId: myId,
            // Enviamos la semilla automáticamente de fondo
            seedId: "5e45a81bece2d421b2d42493084cd764e5491f19def1f88de935a4d9435b0d0c"
        });
        valIn.value = "";
        valIn.focus();
    } catch (e) {
        console.error("Error al guardar:", e);
    }
};

// --- ESCUCHA EN TIEMPO REAL ---
const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(50));

onSnapshot(q, (snap) => {
    const box = document.getElementById('logs');
    box.innerHTML = "";
    let userHistory = [];
    
    snap.forEach(d => {
        const data = d.data();
        if (data.userId === myId) {
            userHistory.push(data);
            // Dibujamos solo los últimos 8 en la cuadrícula
            if (userHistory.length <= 8) {
                const card = document.createElement('div');
                card.className = `badge ${data.value >= 2.0 ? 'win' : 'lose'}`;
                card.innerText = data.value.toFixed(2) + "x";
                box.appendChild(card);
            }
        }
    });

    // Actualizamos el cuadro de predicción superior
    const res = analyzeRhythm(userHistory);
    nextVal.innerText = res.val;
    nextTake.innerText = res.take;
});