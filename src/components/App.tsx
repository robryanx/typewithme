import { useState } from 'react';
import { Practice } from './Practice';
import { Recorder } from './Recorder';

type View = { kind: 'home' } | { kind: 'practice'; text: string };

/** Speech transcripts read better for practice with single, tidy spacing. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function initialView(): View {
  // The mic cannot be scripted in a headless browser, so Cypress injects
  // practice text with ?text=... in the URL. It only starts a local
  // practice view — no API, no stored data.
  const injected = new URLSearchParams(window.location.search).get('text');
  const clean = injected === null ? '' : normalizeText(injected);
  return clean === '' ? { kind: 'home' } : { kind: 'practice', text: clean };
}

export function App() {
  const [view, setView] = useState<View>(initialView);

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
