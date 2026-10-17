import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../lib/api';

type RecorderState = 'idle' | 'asking' | 'recording' | 'uploading';

export function Recorder({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const upload = useCallback(
    async (blob: Blob) => {
      setState('uploading');
      try {
        onText(await transcribeAudio(blob));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Transcription failed.');
        setState('idle');
      }
    },
    [onText],
  );

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio on this page. Try Chrome, or update Firefox.');
      setState('idle');
      return;
    }
    setState('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void upload(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setState('recording');
    } catch (cause) {
      // Firefox fails instantly (no prompt) when the Android app itself lacks
      // microphone permission, or the site was previously blocked — each needs
      // a different fix, so tell the user which one applies. Duck-type the
      // name: cross-realm DOMExceptions fail instanceof checks.
      const name = (cause as { name?: string } | null)?.name ?? '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No microphone was found on this device.');
      } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        setError(
          'The microphone is blocked here. In Firefox: tap the padlock in the address bar, set Microphone to Allowed — and check Android Settings → Apps → Firefox → Permissions → Microphone. In Chrome: tap the padlock and allow the microphone.',
        );
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('The microphone is busy in another app. Close that app and try again.');
      } else {
        setError(cause instanceof Error ? `Microphone error: ${cause.message}` : 'Could not start recording.');
      }
      setState('idle');
    }
  }, [upload]);

  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state === 'recording') {
        recorder.onstop = null;
        recorder.stop();
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
    },
    [],
  );

  const busy = state === 'uploading';
  return (
    <section className="recorder">
      <button
        type="button"
        className={state === 'recording' ? 'mic recording' : 'mic'}
        onClick={() => (state === 'recording' ? stop() : start())}
        disabled={busy || state === 'asking'}
      >
        <span aria-hidden="true">🎤</span>
        <span>
          {state === 'recording'
            ? 'Recording… tap to finish'
            : state === 'asking'
              ? 'Waiting for the microphone…'
              : busy
                ? 'Listening back…'
                : 'Tap and speak your text'}
        </span>
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
