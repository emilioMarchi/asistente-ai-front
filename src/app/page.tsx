"use client";

import { useEffect, useState, useRef } from "react";
import { useRecorder } from "../hooks/useRecorder";
import { voiceDetected } from "@/hooks/voiceDetect";
import "./Home.css";

export default function Home() {
  const userId = "12345";
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL+"/voice-session"}`;

  const { isRecording, audioURL, startRecording, stopRecording } = useRecorder({
    userId,
    backendUrl,
  });

  const { isSpeaking } = voiceDetected();
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  const hasUserSpoken = useRef(false);

  // 🎤 Control de grabación
  useEffect(() => {
    // 🚫 Bloquear grabación si se procesa respuesta o se reproduce audio
    if (isProcessingResponse || isPlayingResponse) {
      if (isRecording) stopRecording();
      return;
    }

    // Iniciar grabación solo si no estaba grabando
    if (!isRecording) startRecording();

    // Detecta cuando el usuario habla
    if (isSpeaking && isRecording) hasUserSpoken.current = true;

    // Si el usuario deja de hablar, detener grabación y procesar
    if (!isSpeaking && isRecording && hasUserSpoken.current) {
      stopRecording();
      hasUserSpoken.current = false;
      setIsProcessingResponse(true);
    }
  }, [isSpeaking, isRecording, isPlayingResponse, isProcessingResponse, startRecording, stopRecording]);

  // ▶️ Reproducción de respuesta
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
  }, []);

  useEffect(() => {
    if (!audioURL || !audioRef.current) {
      // Si no hay audio pero estaba procesando, desbloquear estado
      if (isProcessingResponse) setIsProcessingResponse(false);
      return;
    }

    const audioEl = audioRef.current;
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.src = audioURL;

    const handlePlay = () => {
      setIsProcessingResponse(false);
      setIsPlayingResponse(true);
    };

    const handleEnded = () => {
      setIsPlayingResponse(false);
    };

    const handleError = () => {
      setIsPlayingResponse(false);
      setIsProcessingResponse(false);
    };

    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("error", handleError);

    audioEl.play().catch(() => handleError());

    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("ended", handleEnded);
      audioEl.removeEventListener("error", handleError);
      audioEl.pause();
    };
  }, [audioURL]);

  return (
    <div className="home-container">
      {/* Objeto del asistente */}
      <div
        className={`assistant-circle ${isPlayingResponse ? "assistant-speaking" : ""}`}
      />

      {/* Estado */}
      <p className="status-text">
        {isPlayingResponse
          ? "Asistente hablando..."
          : isProcessingResponse
          ? "Procesando respuesta..."
          : isRecording
          ? "Grabando usuario"
          : "En espera"}
      </p>

      {/* Botón */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`record-btn ${isRecording ? "stop" : "start"}`}
      >
        {isRecording ? "Detener" : "Grabar"}
      </button>
    </div>
  );
}
