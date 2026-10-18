import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent as ReactChangeEvent, ClipboardEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { buildProgress, accuracy, correctPrefix, progressPercent, withAutoPunctuation } from '../lib/typing';

/** The greyed-out target text with green/red per-character feedback and a caret. */
export function TextDisplay({ target, typed }: { target: string; typed: string }) {
  const progress = buildProgress(target, typed);
  const caretIndex = typed.length;
  return (
    <p className="text-display" aria-hidden="true">
      {progress.map((entry, index) => (
        <span key={index} className={entry.status}>
          {caretIndex === index ? <span className="caret" /> : null}
          {entry.char}
        </span>
      ))}
      {caretIndex >= target.length ? <span className="caret" /> : null}
    </p>
  );
}

export function Practice({ target, onNewText }: { target: string; onNewText: () => void }) {
  const [typed, setTyped] = useState('');
  const [reversed, setReversed] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reversing swaps the practice target to its mirror (and back); the typed
  // progress resets because it cannot survive the flip.
  const targetText = reversed ? Array.from(target).reverse().join('') : target;

  useEffect(
    () => () => {
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
    },
    [],
  );

  const correct = correctPrefix(targetText, typed);

  const handleChange = (event: ReactChangeEvent<HTMLTextAreaElement>) => {
    // Real keystrokes (and native backspace) land here; blocked keys never do.
    // Required punctuation the kid skips is auto-inserted as green.
    const raw = event.target.value.slice(0, targetText.length);
    setTyped(withAutoPunctuation(targetText, raw));
  };

  const blockPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Only real single-character keystrokes advance the practice; everything
    // else (arrows, shortcuts) is swallowed so the typed text stays honest.
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (event.key === 'Backspace') {
      return; // Handled natively by the textarea.
    }
    if (event.key.length !== 1) {
      event.preventDefault();
      return;
    }
    if (typed.length >= targetText.length) {
      event.preventDefault();
      return;
    }
  };

  const copyCorrect = async () => {
    try {
      await navigator.clipboard.writeText(correct);
      setCopied(true);
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const complete = typed.length >= targetText.length && targetText.length > 0;

  return (
    <section className="practice">
      <div className="display-shell" onClick={() => inputRef.current?.focus()} data-testid="practice-display">
        <TextDisplay target={targetText} typed={typed} />
        <label className="visually-hidden" htmlFor="practice-input">
          Type the text shown above
        </label>
        <textarea
          id="practice-input"
          ref={inputRef}
          className="practice-input"
          value={typed}
          maxLength={targetText.length}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={blockPaste}
        />
      </div>

      <p className="stats">
        <span>{progressPercent(targetText, typed)}% typed correctly</span>
        {accuracy(targetText, typed) !== null && <span> · {accuracy(targetText, typed)}% accuracy</span>}
      </p>

      <div className="actions">
        <button type="button" className="primary" onClick={copyCorrect} disabled={correct.length === 0}>
          {copied ? 'Copied!' : 'Copy my correct text'}
        </button>
        <button
          type="button"
          onClick={() => {
            setReversed((current) => !current);
            setTyped('');
          }}
        >
          {reversed ? 'Un-reverse text' : 'Reverse text'}
        </button>
        <button type="button" onClick={() => setTyped('')} disabled={typed.length === 0}>
          Start over
        </button>
        <button type="button" onClick={onNewText}>
          New text
        </button>
      </div>

      {complete && (
        <p className="complete" role="status">
          You typed the whole thing! Copy your correct text and paste it into your game.
        </p>
      )}
    </section>
  );
}
