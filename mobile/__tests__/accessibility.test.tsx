import React from 'react';
import Renderer, { act } from 'react-test-renderer';

import { Tap } from '../src/components/ui';

test('Tap expands small visible controls to an Android-sized touch target', async () => {
  let tree: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<Tap label="Action" />);
  });
  const control = tree!.root.findByProps({ accessibilityLabel: 'Action' });
  expect(control.props.hitSlop).toEqual({ top: 6, right: 6, bottom: 6, left: 6 });
  await act(async () => tree!.unmount());
});
