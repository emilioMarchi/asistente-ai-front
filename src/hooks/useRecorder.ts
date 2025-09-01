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
      const data = await response.json();
      console.log("Respuesta del backend:", data);

      if (data.audioBase64) {
        const replyBlob = new Blob(
          [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );
        const replyUrl = URL.createObjectURL(replyBlob);
        setAudioURL(replyUrl);

        const audioEl = new Audio(replyUrl);
        await audioEl.play();
      }
    } catch (err) {
      console.error("Error enviando audio:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessingRef.current) return;

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
        if (tempAudio.duration > 0.3) {
          sendAudioToBackend(blob);
        } else {
          console.log("⚠️ Audio demasiado corto o vacío → no se envía");
        }
      };
    };

    mediaRecorder.start();
  };

  return {
    isRecording,
    audioURL,
    startRecording,
    stopRecording,
  };
}
