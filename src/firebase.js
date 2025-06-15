import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// COLE A SUA CONFIGURAÇÃO DO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "AIzaSyDdLMejUJfq7zzWX-m_8gcDVOUViS1fRls",
  authDomain: "lean-film-design-app.firebaseapp.com",
  projectId: "lean-film-design-app",
  storageBucket: "lean-film-design-app.firebasestorage.app",
  messagingSenderId: "946605969141",
  appId: "1:946605969141:web:8cc8a1eaef15b2a4baffbc"
};

// Inicializa os serviços do Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços para serem usados em outras partes do app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);