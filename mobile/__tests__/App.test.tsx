import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// The tab bar schedules work after the first render. Fake timers and an
// unmount keep it from running once the test environment is gone.
jest.useFakeTimers();

test('opens on Today with the four tabs', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });
  const text = JSON.stringify(app!.toJSON());
  for (const tab of ['Today', 'Ask', 'Approvals', 'Rules']) {
    expect(text).toContain(tab);
  }
  await ReactTestRenderer.act(() => {
    app.unmount();
  });
});
