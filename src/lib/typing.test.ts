import { buildProgress, accuracy, correctPrefix, progressPercent } from './typing';

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

test('correctPrefix stops at the first mistake', () => {
  expect(correctPrefix('hello world', 'hello wold')).toBe('hello wo');
  expect(correctPrefix('hello', 'HELLO')).toBe('');
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

test('accuracy counts matching keystrokes, null before typing', () => {
  expect(accuracy('cat', 'cxt')).toBe(67);
  expect(accuracy('cat', '')).toBeNull();
  expect(accuracy('cat', 'cat')).toBe(100);
});
