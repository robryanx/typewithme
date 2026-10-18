import { buildProgress, accuracy, correctPrefix, progressPercent, withAutoPunctuation } from './typing';

test('pending chars stay pending and correct chars turn correct', () => {
  const progress = buildProgress('cat', 'ca');
  expect(progress.map((c) => c.status)).toEqual(['correct', 'correct', 'pending']);
});

test('mistakes are marked wrong against the expected character', () => {
  const progress = buildProgress('cat', 'cx');
  expect(progress.map((c) => c.status)).toEqual(['correct', 'wrong', 'pending']);
  expect(progress[1]?.char).toBe('a');
});

test('typing past the target length is not tracked beyond it', () => {
  const progress = buildProgress('hi', 'hix');
  expect(progress).toHaveLength(2);
  expect(progress[1]?.status).toBe('correct');
});

test('correctPrefix keeps the target casing but accepts any case typed', () => {
  expect(correctPrefix('hello world', 'hello wold')).toBe('hello wo');
  expect(correctPrefix('hello', 'HELLO')).toBe('hello');
  expect(correctPrefix('Hello', 'hELLO')).toBe('Hello');
  expect(correctPrefix('hello', '')).toBe('');
  expect(correctPrefix('hello', 'hello')).toBe('hello');
});

test('correctPrefix ignores over-typed characters beyond the target', () => {
  expect(correctPrefix('hi', 'hixx')).toBe('hi');
});

test('progressPercent is the correct share of the target', () => {
  expect(progressPercent('hello world', 'hello wo')).toBe(73);
  expect(progressPercent('', 'x')).toBe(100);
  expect(progressPercent('abc', '')).toBe(0);
});

test('case differences count as correct', () => {
  const progress = buildProgress('Hello World', 'hELLO wORLD');
  expect(progress.every((c) => c.status === 'correct')).toBe(true);
  expect(progress[0]?.char).toBe('H');
});

test('skipped target punctuation is auto-inserted when the next letter is typed', () => {
  expect(withAutoPunctuation('hey, rob', 'hey, rob')).toBe('hey, rob');
  expect(withAutoPunctuation('hey, rob', 'hey rob')).toBe('hey, rob');
  expect(withAutoPunctuation('wait... what', 'wait what')).toBe('wait... what');
  expect(withAutoPunctuation("don't stop", 'dont stop')).toBe("don't stop");
});

test('auto-inserted punctuation keeps the target casing and counts as typed', () => {
  expect(withAutoPunctuation('Hey, Rob!', 'hey rob')).toBe('Hey, Rob!');
});

test('typing the punctuation yourself still works', () => {
  expect(withAutoPunctuation('hey, rob', 'hey,')).toBe('hey,');
});

test('punctuation is only skipped when the following letter matches', () => {
  // A wrong letter at the punctuation position stays a mistake (red).
  expect(withAutoPunctuation('hey, rob', 'heyx')).toBe('heyx');
  // Before the next letter is typed, nothing is inserted yet.
  expect(withAutoPunctuation('hey, rob', 'hey')).toBe('hey');
});

test('trailing punctuation inserts itself once everything else matched', () => {
  expect(withAutoPunctuation('Hey, Rob!', 'hey rob')).toBe('Hey, Rob!');
  // But not after a mistake — the kid still has to fix that first.
  expect(withAutoPunctuation('Hey, Rob!', 'hey robx')).toBe('Hey, Robx');
  // And not when there is typing left to do.
  expect(withAutoPunctuation('Hey, Rob!', 'hey')).toBe('Hey');
});

test('backspace removes auto-inserted punctuation normally', () => {
  expect(withAutoPunctuation('hey, rob', 'hey, ro')).toBe('hey, ro');
  expect(withAutoPunctuation('hey, rob', 'hey, r')).toBe('hey, r');
});

test('accuracy counts matching keystrokes, null before typing', () => {
  expect(accuracy('cat', 'cxt')).toBe(67);
  expect(accuracy('cat', '')).toBeNull();
  expect(accuracy('cat', 'cat')).toBe(100);
});
