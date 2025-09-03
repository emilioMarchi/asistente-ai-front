// useVoiceActivity.ts
import { useEffect, useState } from "react";
import { MicVAD } from "@ricky0123/vad-web";

export function useVoiceActivity() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let mounted = true;
    let vad: MicVAD | null = null;

    (async () => {
      try {
        vad = await MicVAD.new({
          onSpeechStart: () => mounted && setIsSpeaking(true),
          onSpeechEnd:   () => mounted && setIsSpeaking(false),
          submitUserSpeechOnPause: true,
        });
        vad.start();
      } catch (e) {
        console.error("Error initializing VAD:", e);
      }
    })();

    return () => {
      mounted = false;
      vad?.pause?.(); // en vez de stop()
    };
  }, []);

  return { isSpeaking };
}
