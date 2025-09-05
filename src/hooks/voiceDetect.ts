// useVoiceActivity.ts
import { useEffect, useState, useRef } from "react";
import { MicVAD } from "@ricky0123/vad-web";

export function useVoiceActivity(silenceDelay: number = 700) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    let vad: MicVAD | null = null;

    (async () => {
      try {
        vad = await MicVAD.new({
          onSpeechStart: () => {
            if (!mounted) return;
            // si estaba esperando cortar, cancelamos
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
            setIsSpeaking(true);
          },
          onSpeechEnd: () => {
            if (!mounted) return;
            // esperamos un poco antes de marcar false
            silenceTimeoutRef.current = setTimeout(() => {
              if (mounted) setIsSpeaking(false);
              silenceTimeoutRef.current = null;
            }, silenceDelay);
          },
          submitUserSpeechOnPause: true,
        });
        vad.start();
      } catch (e) {
        console.error("Error initializing VAD:", e);
      }
    })();

    return () => {
      mounted = false;
      vad?.pause?.();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [silenceDelay]);

  return { isSpeaking };
}
