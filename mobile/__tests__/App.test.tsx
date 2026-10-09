import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('opens on Today with the four tabs', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });
  const text = JSON.stringify(app!.toJSON());
  for (const tab of ['Today', 'Ask', 'Approvals', 'Rules']) {
    expect(text).toContain(tab);
  }
});
