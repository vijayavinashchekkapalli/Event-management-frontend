import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFtS7aYcEcM2-f7nkEkZu5wIwUN-PcLFA",
  authDomain: "event-management-system-c7588.firebaseapp.com",
  projectId: "event-management-system-c7588",
  storageBucket: "event-management-system-c7588.firebasestorage.app",
  messagingSenderId: "826553605822",
  appId: "1:826553605822:web:b0f45d1184df4601b188ef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);