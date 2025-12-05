import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Chỗ để thêm API keys và cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7O_2i5eoDuNY1EhGl_lTObokaE_yxbfs",
  authDomain: "learn-web-f0163.firebaseapp.com",
  projectId: "learn-web-f0163",
  storageBucket: "learn-web-f0163.firebasestorage.app",
  messagingSenderId: "13824128832",
  appId: "1:13824128832:web:9e38b3187ed3be4173aca5",
  measurementId: "G-XCZJXS2S0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
