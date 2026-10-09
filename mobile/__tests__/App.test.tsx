import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('opens on the splash board', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });
  const text = JSON.stringify(app!.toJSON());
  expect(text).toContain('MIRA');
  expect(text).toContain('Waking up your on-device assistant');
  await ReactTestRenderer.act(() => app!.unmount());
});
