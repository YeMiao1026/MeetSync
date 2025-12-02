import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8wpOSiloVr_bUATzbWjNCAfdh4wuJhxE",
  authDomain: "meetsync-951dc.firebaseapp.com",
  projectId: "meetsync-951dc",
  storageBucket: "meetsync-951dc.firebasestorage.app",
  messagingSenderId: "708285854650",
  appId: "1:708285854650:web:66b0b7c7161b1ad265e383",
  measurementId: "G-2RJ4HS4S32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);