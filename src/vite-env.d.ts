/// <reference types="vite/client" />

declare module '*.css';

// Add Speech Recognition API types
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}
