import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { MechDetails, MechPanel } from '@/ui/mech-panel';

it('keeps the shared desktop/mobile details simple and identifies simulated readings', () => {
  const html = renderToStaticMarkup(<MechDetails />);
  expect(html).toContain('fan direction');
  expect(html).toContain('turning speed');
  expect(html).toContain('simulated for demo purposes only');
  expect(html).not.toContain('N·m');
  expect(html).toContain('90 teeth');
  expect(html).toContain('18 teeth');
  expect(html).toContain('Inside the fan');
  expect(renderToStaticMarkup(<MechPanel />)).toContain('aria-label="Back to the room"');
});
