// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBCSWVf6ocKTbGsWHRbng0ckQDNYpfOA6I',
  authDomain: 'web-cloud-ynov-2a647.firebaseapp.com',
  projectId: 'web-cloud-ynov-2a647',
  storageBucket: 'web-cloud-ynov-2a647.firebasestorage.app',
  messagingSenderId: '112256041910',
  appId: '1:112256041910:web:8e5432abf1b8638d373717',
  measurementId: 'G-PMZE4SX1FZ',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
