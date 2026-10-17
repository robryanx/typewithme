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
    } catch {
      setError('I could not use the microphone. Check the browser permission, or paste your text instead.');
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
