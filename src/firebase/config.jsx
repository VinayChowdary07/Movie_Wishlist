// src/firebase/config.jsx
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyAA4jKxPgwd3DRGcJR9WpV9OAW8eip8194",
  authDomain: "movie-wishlist-491a4.firebaseapp.com",
  projectId: "movie-wishlist-491a4",
  storageBucket: "movie-wishlist-491a4.firebasestorage.app",
  messagingSenderId: "909017143583",
  appId: "1:909017143583:web:9eec404ce231ce564d782a",
  measurementId: "G-W53EVY1LPM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);
