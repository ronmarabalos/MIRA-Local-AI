import { type ComponentType, useEffect, useState } from 'react';
import { DevSettings, Modal } from 'react-native';

import ProbeScreen from './ProbeScreen';

/** Adds a "MIRA probe" entry to the React Native dev menu. Debug builds only. */
export function withDevProbe(App: ComponentType): ComponentType {
  return function AppWithProbe() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
      DevSettings.addMenuItem('MIRA probe', () => setOpen(true));
    }, []);

    return (
      <>
        <App />
        <Modal
          animationType="slide"
          onRequestClose={() => setOpen(false)}
          visible={open}
        >
          <ProbeScreen onClose={() => setOpen(false)} />
        </Modal>
      </>
    );
  };
}
