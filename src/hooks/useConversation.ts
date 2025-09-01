import { useState, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function useConversation() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hola 👋 Soy tu asistente, ¿en qué puedo ayudarte?" }
  ]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let storedId = sessionStorage.getItem("userId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      sessionStorage.setItem("userId", storedId);
    }
    setUserId(storedId);
  }, []);

  const sendAudio = async (audio: Blob) => {
    if (!userId) return;

    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("userId", userId);

    try {
      console.log(formData)

      
    } catch (err) {
      console.error("Error enviando audio:", err);
    }
  };

  return { messages, sendAudio };
}
