import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: 請將此處替換為您的 Firebase Console > Project Settings > General 下方的 Config
// 如果您使用 GitHub 部署，建議使用環境變數 import.meta.env.VITE_FIREBASE_API_KEY 等

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyD-YOUR-API-KEY-HERE",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);