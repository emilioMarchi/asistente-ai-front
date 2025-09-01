// useVoiceActivity.ts
import { useEffect, useState } from "react";
import { MicVAD } from "@ricky0123/vad-web";

export function voiceDetected() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vadInstance, setVadInstance] = useState<MicVAD | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initVAD() {
      try {
        const micVAD = await MicVAD.new({
          onSpeechStart: () => {
            console.log("🎤 Speech start");
            if (mounted) setIsSpeaking(true);
          },
          onSpeechEnd: () => {
            console.log("🔇 Speech end");
            if (mounted) setIsSpeaking(false);
          },
        });
        setVadInstance(micVAD);
        micVAD.start();
      } catch (e) {
        console.error("Error initializing VAD:", e);
      }
    }

    initVAD();

    return () => {
      mounted = false;
      if (vadInstance) {
        vadInstance.stop();
      }
    };
  }, []);

  return { isSpeaking };
}
