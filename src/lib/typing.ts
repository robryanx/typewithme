export type CharStatus = 'correct' | 'wrong' | 'pending';

export interface TypedChar {
  char: string;
  status: CharStatus;
}

/** Keystrokes are judged case-insensitively; the target's casing is what shows. */
function matchesCaseInsensitive(typedChar: string | undefined, expected: string): boolean {
  return typedChar !== undefined && typedChar.toLowerCase() === expected.toLowerCase();
}

function isPunctuation(char: string): boolean {
  return /\p{P}/u.test(char);
}

/**
 * Reconciles the raw keystrokes with the target: whenever the kid types the
 * letter that follows a target punctuation symbol (skipping the symbol — the
 * transcription adds punctuation nobody wants to type), the symbol is
 * inserted into the typed text as if it had been typed correctly, and the
 * keystroke counts for the letter after it.
 */
export function withAutoPunctuation(target: string, raw: string): string {
  let result = '';
  let rawIndex = 0;
  let targetIndex = 0;
  let sawMistake = false;
  while (rawIndex < raw.length && targetIndex < target.length) {
    const rawChar = raw[rawIndex] as string;
    const targetChar = target[targetIndex] as string;
    if (matchesCaseInsensitive(rawChar, targetChar)) {
      result += targetChar;
      rawIndex++;
      targetIndex++;
      continue;
    }
    if (isPunctuation(targetChar) && !isPunctuation(rawChar)) {
      let afterPunctuation = targetIndex;
      while (afterPunctuation < target.length && isPunctuation(target[afterPunctuation] as string)) {
        afterPunctuation++;
      }
      const next = target[afterPunctuation];
      if (next !== undefined && matchesCaseInsensitive(rawChar, next)) {
        // The keystroke belongs after the punctuation run: insert the run
        // green and let the next loop iteration match the keystroke itself.
        result += target.slice(targetIndex, afterPunctuation);
        targetIndex = afterPunctuation;
        continue;
      }
    }
    // A genuine mistake: keep the raw character so it shows red.
    result += rawChar;
    rawIndex++;
    targetIndex++;
    sawMistake = true;
  }
  // With every keystroke spent and nothing mistyped, trailing punctuation
  // (like the final '!') inserts itself instead of blocking completion.
  if (!sawMistake && raw.length > 0 && rawIndex === raw.length) {
    let end = targetIndex;
    while (end < target.length && isPunctuation(target[end] as string)) {
      end++;
    }
    if (end === target.length && end > targetIndex) {
      result += target.slice(targetIndex, end);
    }
  }
  return result;
}

/**
 * Compares the typed text against the target character by character. Wrong
 * keystrokes stay visible (red) and the cursor keeps moving; kids fix them
 * with backspace. Case differences count as correct.
 */
export function buildProgress(target: string, typed: string): TypedChar[] {
  const result: TypedChar[] = [];
  for (let i = 0; i < target.length; i++) {
    const expected = target[i] as string;
    if (i >= typed.length) {
      result.push({ char: expected, status: 'pending' });
    } else if (matchesCaseInsensitive(typed[i], expected)) {
      result.push({ char: expected, status: 'correct' });
    } else {
      result.push({ char: expected, status: 'wrong' });
    }
  }
  return result;
}

/**
 * The text that counts: everything typed before the first mistake. The
 * target's own casing is preserved — this is what the copy button hands to
 * the clipboard.
 */
export function correctPrefix(target: string, typed: string): string {
  let prefix = '';
  for (let i = 0; i < typed.length && i < target.length; i++) {
    const expected = target[i] as string;
    if (!matchesCaseInsensitive(typed[i], expected)) {
      break;
    }
    prefix += expected;
  }
  return prefix;
}

export function progressPercent(target: string, typed: string): number {
  if (target.length === 0) {
    return 100;
  }
  return Math.round((correctPrefix(target, typed).length / target.length) * 100);
}

/** Keystrokes that matched the target (any case), as a share of everything typed. */
export function accuracy(target: string, typed: string): number | null {
  if (typed.length === 0) {
    return null;
  }
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (matchesCaseInsensitive(typed[i], target[i])) {
      correct++;
    }
  }
  return Math.round((correct / typed.length) * 100);
}
