// Dev runs on the Vite root with a proxied /api; production lives under
// https://robserver.me/typewithme/ next to its PHP front controller.
export const API = import.meta.env.DEV ? '/api' : '/typewithme/api';

export async function transcribeAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'speech.webm');
  const response = await fetch(`${API}/transcribe`, { method: 'POST', body: form });
  const payload: unknown = await response.json().catch(() => null);
  const text =
    payload && typeof payload === 'object' && 'text' in payload && typeof payload.text === 'string' ? payload.text : '';
  if (response.ok && text !== '') {
    return text;
  }
  const message =
    payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'The transcription service did not answer. Try again.';
  throw new Error(message);
}
