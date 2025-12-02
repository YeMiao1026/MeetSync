import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8wpOSiloVr_bUATzbWjNCAfdh4wuJhxE",
  authDomain: "meetsync-951dc.firebaseapp.com",
  projectId: "meetsync-951dc",
  storageBucket: "meetsync-951dc.firebasestorage.app",
  messagingSenderId: "708285854650",
  appId: "1:708285854650:web:66b0b7c7161b1ad265e383"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);