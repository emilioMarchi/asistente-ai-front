"use client";

import { useEffect, useState, useRef } from "react";
import { useRecorder } from "../hooks/useRecorder";
import { voiceDetected } from "@/hooks/voiceDetect";
import "./Home.css";

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
      if (isRecording) stopRecording();
      return;
    }

    if (!isRecording) startRecording();

    if (isSpeaking && isRecording) hasUserSpoken.current = true;

    if (!isSpeaking && isRecording && hasUserSpoken.current) {
      stopRecording();
      hasUserSpoken.current = false;
      setIsProcessingResponse(true);
    }
  }, [isSpeaking, isRecording, isPlayingResponse, isProcessingResponse, startRecording, stopRecording]);

  // ▶️ Reproducción de respuesta optimizada
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    if (!audioURL || !audioRef.current) return;

    const audioEl = audioRef.current;

    // Pausar cualquier audio previo y reiniciar
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.src = audioURL;

    const handlePlay = () => setIsProcessingResponse(false);
    const handleEnded = () => {
      setIsPlayingResponse(false);
      setHasPlayedResponse(true);
    };
    const handleError = () => {
      setTimeout(() => {
        setIsPlayingResponse(false);
        setHasPlayedResponse(true);
        setIsProcessingResponse(false);
      }, 2000);
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
