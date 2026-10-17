export type CharStatus = 'correct' | 'wrong' | 'pending';

export interface TypedChar {
  char: string;
  status: CharStatus;
}

/**
 * Compares the typed text against the target character by character. Wrong
 * keystrokes stay visible (red) and the cursor keeps moving; kids fix them
 * with backspace.
 */
export function buildProgress(target: string, typed: string): TypedChar[] {
  const result: TypedChar[] = [];
  for (let i = 0; i < target.length; i++) {
    const expected = target[i] as string;
    if (i >= typed.length) {
      result.push({ char: expected, status: 'pending' });
    } else {
      result.push({ char: expected, status: typed[i] === expected ? 'correct' : 'wrong' });
    }
  }
  return result;
}

/**
 * The text that counts: everything typed before the first mistake. This is
 * what the copy button hands to the clipboard.
 */
export function correctPrefix(target: string, typed: string): string {
  let prefix = '';
  for (let i = 0; i < typed.length && i < target.length; i++) {
    const typedChar = typed[i] as string;
    if (typedChar !== target[i]) {
      break;
    }
    prefix += typedChar;
  }
  return prefix;
}

export function progressPercent(target: string, typed: string): number {
  if (target.length === 0) {
    return 100;
  }
  return Math.round((correctPrefix(target, typed).length / target.length) * 100);
}

/** Keystrokes that matched the target, as a share of everything typed. */
export function accuracy(target: string, typed: string): number | null {
  if (typed.length === 0) {
    return null;
  }
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) {
      correct++;
    }
  }
  return Math.round((correct / typed.length) * 100);
}
