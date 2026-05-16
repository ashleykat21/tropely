import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCg7GB1Ors1MKTj9S3yo0bgiPXctpd66Yw",
  authDomain: "tropely-ba3a0.firebaseapp.com",
  projectId: "tropely-ba3a0",
  storageBucket: "tropely-ba3a0.firebasestorage.app",
  messagingSenderId: "162706231594",
  appId: "1:162706231594:web:3922a002d72c4716338e53",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
