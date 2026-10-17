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
  const [draft, setDraft] = useState('');

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
      <section className="manual">
        <h2>Or paste your own text</h2>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type or paste the text you want to practise…"
          rows={4}
        />
        <button
          type="button"
          className="primary"
          disabled={normalizeText(draft) === ''}
          onClick={() => {
            const clean = normalizeText(draft);
            if (clean !== '') {
              setDraft('');
              setView({ kind: 'practice', text: clean });
            }
          }}
        >
          Start typing practice
        </button>
      </section>
    </main>
  );
}
