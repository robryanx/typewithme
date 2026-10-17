import { extensionForType } from './api';

test('browser recording mime types map to OpenAI file extensions', () => {
  expect(extensionForType('audio/webm;codecs=opus')).toBe('webm');
  // Firefox records OGG/Opus.
  expect(extensionForType('audio/ogg;codecs=opus')).toBe('ogg');
  expect(extensionForType('audio/mp4')).toBe('m4a');
  expect(extensionForType('audio/mpeg')).toBe('mp3');
  expect(extensionForType('audio/wav')).toBe('wav');
  expect(extensionForType('audio/flac')).toBe('flac');
  expect(extensionForType('')).toBe('webm');
});
