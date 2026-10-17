import { useState } from 'react';
import { Practice } from './Practice';
import { Recorder } from './Recorder';

type View = { kind: 'home' } | { kind: 'practice'; text: string };

/** Speech transcripts read better for practice with single, tidy spacing. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function App() {
  const [view, setView] = useState<View>({ kind: 'home' });

  if (view.kind === 'practice') {
    return (
      <main className="app">
        <header>
          <h1>typewithme</h1>
          <p className="tagline">
            Type it out — green is right, red needs a fix. Copy the good part when you are done.
          </p>
        </header>
        <Practice target={view.text} onNewText={() => setView({ kind: 'home' })} />
      </main>
    );
  }

  return (
    <main className="app">
      <header>
        <h1>typewithme</h1>
        <p className="tagline">
          Speak your text, then type it out to unlock it. Perfect for chat lines in your favourite games.
        </p>
      </header>
      <Recorder
        onText={(text) => {
          const clean = normalizeText(text);
          if (clean !== '') {
            setView({ kind: 'practice', text: clean });
          }
        }}
      />
    </main>
  );
}
