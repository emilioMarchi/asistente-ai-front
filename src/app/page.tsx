"use client";

import { useEffect, useState, useRef } from "react";
import { useRecorder } from "../hooks/useRecorder";
import { voiceDetected } from "@/hooks/voiceDetect";

export default function Home() {
  const userId = "12345";
  const backendUrl = "http://localhost:8080/voice-session";

  const { isRecording, audioURL, startRecording, stopRecording } = useRecorder({
    userId,
    backendUrl,
  });

  const { isSpeaking } = voiceDetected();
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [hasPlayedResponse, setHasPlayedResponse] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  const hasUserSpoken = useRef(false);

  // 🎤 Control de grabación
  useEffect(() => {
    const canRecord = !isPlayingResponse && !isProcessingResponse;

    if (!canRecord) {
      if (isRecording) {
        console.log("⏸️ Pauso grabación porque está en proceso o reproduciendo respuesta");
        stopRecording();
      }
      return;
    }

    if (!isRecording) {
      console.log("🎤 Micrófono abierto en modo escucha");
      startRecording();
    }

    if (isSpeaking && isRecording) {
      hasUserSpoken.current = true;
    }

    if (!isSpeaking && isRecording && hasUserSpoken.current) {
      console.log("🔇 Usuario terminó de hablar → detengo grabación y proceso mensaje");
      stopRecording();
      hasUserSpoken.current = false;

      // activamos procesamiento hasta que el audio del backend empiece a reproducirse
      setIsProcessingResponse(true);
    }
  }, [isSpeaking, isRecording, isPlayingResponse, isProcessingResponse, startRecording, stopRecording]);

  // ▶️ Reproducción de respuesta
  useEffect(() => {
    if (!audioURL) return;

    // cada vez que llega un nuevo audio → resetear estado
    setHasPlayedResponse(false);
    setIsPlayingResponse(true);

    const audioEl = new Audio(audioURL);

    // cuando empieza la reproducción → liberamos procesamiento
    audioEl.onplay = () => {
      setIsProcessingResponse(false);
    };

    audioEl.onended = () => {
      console.log("▶️ Audio del backend terminó");
      setIsPlayingResponse(false);
      setHasPlayedResponse(true);
    };

    audioEl.onerror = () => {
      console.log("⚠️ Error de reproducción, simulamos fin");
      setTimeout(() => {
        setIsPlayingResponse(false);
        setHasPlayedResponse(true);
        setIsProcessingResponse(false);
      }, 2000);
    };

    audioEl.play().catch(() => audioEl.onerror?.(new Event("error")));
  }, [audioURL]);

  useEffect(() => {
    console.log("👂 Sistema listo, esperando al usuario...");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <p>
        {isPlayingResponse
          ? "🟡 Asistente hablando..."
          : isProcessingResponse
          ? "🔵 Procesando respuesta..."
          : isRecording
          ? "🟢 Grabando usuario"
          : "⚪ En espera"}
      </p>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg ${isRecording ? "bg-red-600" : "bg-green-600"}`}
      >
        {isRecording ? "Detener" : "Grabar"}
      </button>

      {audioURL && <audio controls src={audioURL} className="mt-4" />}
    </div>
  );
}
