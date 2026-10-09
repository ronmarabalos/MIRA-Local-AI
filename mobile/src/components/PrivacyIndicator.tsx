import { useGo } from './nav';
import { T } from './T';
import { Tap } from './ui';

export function PrivacyIndicator({ dark = false }: { dark?: boolean }) {
  const go = useGo();
  return (
    <Tap
      label="Open privacy proof"
      onPress={() => go('Settings')}
      glass={dark ? 'dark' : 'glass'}
      className="min-h-48 justify-center rounded-16 px-12 py-8"
    >
      <T
        className={`text-13 font-semibold ${
          dark ? 'text-dk-text' : 'text-ink-body'
        }`}
      >
        Privacy proof
      </T>
    </Tap>
  );
}
