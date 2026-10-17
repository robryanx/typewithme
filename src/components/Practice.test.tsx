import { renderToStaticMarkup } from 'react-dom/server';
import { TextDisplay } from './Practice';

test('renders pending characters greyed and correct characters marked', () => {
  const html = renderToStaticMarkup(<TextDisplay target="cat" typed="ca" />);
  expect(html).toContain('class="correct"');
  expect(html).toContain('class="pending"');
  expect(html).toContain('<span class="caret"');
});

test('marks the expected character wrong after a mistake', () => {
  const html = renderToStaticMarkup(<TextDisplay target="cat" typed="cx" />);
  expect(html).toContain('class="wrong"');
});

test('shows a trailing caret when the target is fully typed', () => {
  const html = renderToStaticMarkup(<TextDisplay target="cat" typed="cat" />);
  expect(html).not.toContain('class="pending"');
  expect(html).toContain('<span class="caret"');
});
