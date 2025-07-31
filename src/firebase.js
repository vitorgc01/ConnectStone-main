import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwO6cw2H6HFl9fR_Yr6iRkBGkSQHX7cXY",
  authDomain: "granito-app.firebaseapp.com",
  projectId: "granito-app",
  storageBucket: "granito-app.appspot.com",
  messagingSenderId: "173250363454",
  appId: "1:173250363454:web:4a99ac509fda34130a116f",
  measurementId: "G-C4ZGM73BX6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);