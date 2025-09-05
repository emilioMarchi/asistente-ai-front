import { useState, useRef } from "react";

type UseRecorderOptions = {
  userId: string;
  backendUrl: string;
};

export function useRecorder({ userId, backendUrl }: UseRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      console.log("⏹ Deteniendo grabación");
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    isProcessingRef.current = true;

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("userId", userId);

    try {
      const response = await fetch(backendUrl, { method: "POST", body: formData });

      if (!response.ok) {
        console.warn("⚠️ Backend devolvió error HTTP:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Respuesta del backend:", data);

      // Si no hay audio en la respuesta, no bloquear flujo
      if (!data.audioBase64) {
        console.log("⚠️ Backend no devolvió audio → flujo desbloqueado");
        return;
      }

      // Convertir base64 a blob reproducible
      const replyBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );
      const replyUrl = URL.createObjectURL(replyBlob);
      setAudioURL(replyUrl);

    } catch (err) {
      console.error("❌ Error enviando audio:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      setIsRecording(true);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Validar duración antes de enviar
        const tempAudio = document.createElement("audio");
        tempAudio.src = URL.createObjectURL(blob);

        tempAudio.onloadedmetadata = () => {
          if (!tempAudio.duration || tempAudio.duration < 0.2) {
            console.log("⚠️ Audio demasiado corto o vacío → no se envía");
            isProcessingRef.current = false; // 🔑 desbloquear flujo
            return;
          }
          sendAudioToBackend(blob);
        };
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("❌ No se pudo iniciar grabación:", err);
    }
  };

  return {
    isRecording,
    audioURL,
    startRecording,
    stopRecording,
  };
}
