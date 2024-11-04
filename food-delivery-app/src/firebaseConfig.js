// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDj_Tw6tKZDw9Y2cH-xX7IczEH11T6ZfXM",
  authDomain: "food-delivery-app-34464.firebaseapp.com",
  projectId: "food-delivery-app-34464",
  storageBucket: "food-delivery-app-34464.firebasestorage.app",
  messagingSenderId: "276023994246",
  appId: "1:276023994246:web:1d8c9c6858195d89412e07"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
