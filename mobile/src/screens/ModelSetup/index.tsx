/**
 * Board 04-ai-model-setup. Shows whether MIRA's file is on this phone, and
 * downloads it with one tap (the only use of the internet), or adds a copy
 * the user already has. After that MIRA works with no connection.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { Spin } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton, Glass, PrimaryButton, Rows, SecondaryButton, Tap } from '../../components/ui';
import { isModelOnPhone } from '../../services/firstRun';
import {
  cancelModelDownload,
  downloadModelFile,
  type ImportProgress,
  importModelFile,
  MODEL_BYTES,
  partialDownloadBytes,
} from '../../services/model/importFile';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Phase = 'idle' | 'downloading' | 'copying' | 'ready';

const STATUS: Record<Phase, { label: string; fg: string; bg: string }> = {
  idle: { label: 'Not on this phone yet', fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)' },
  downloading: { label: 'Downloading to this phone…', fg: palette.navy.DEFAULT, bg: palette.peri.tonal },
  copying: { label: 'Adding to this phone…', fg: palette.navy.DEFAULT, bg: palette.peri.tonal },
  ready: { label: 'On this phone · ready offline', fg: palette.success.ink, bg: palette.success.bg },
};

/** What went wrong, in plain words, by the native error code. */
const IMPORT_ERRORS: Record<string, string> = {
  not_model: 'That isn’t MIRA’s file. Pick the one ending in .gguf.',
  no_space: 'Not enough free space. Free up about 1.3 GB and try again.',
  unreadable: 'That file couldn’t be opened. Try picking it again.',
  no_picker: 'This phone has no file picker. Copy the file over USB instead.',
  no_connection: 'The download stopped. Check your connection, then tap Resume.',
  corrupt: 'The download was damaged, so it was deleted. Try again.',
  no_storage: 'Phone storage isn’t available right now. Try again.',
};

const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(2);

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-13">
      <T className="text-14 text-ink-2">{label}</T>
      {children}
    </View>
  );
}

export default function ModelSetupScreen() {
  const go = useGo();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [problem, setProblem] = useState('');
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  // Bytes an unfinished download left, so it can resume instead of starting over.
  const [partial, setPartial] = useState(0);
  const check = useCallback(() => {
    isModelOnPhone().then(
      present => live.current && setPhase(present ? 'ready' : 'idle'),
      () => live.current && setPhase('idle'),
    );
    partialDownloadBytes().then(bytes => live.current && setPartial(bytes));
  }, []);
  useEffect(check, [check]);

  /** Runs a download or an import, sharing progress, errors, and the way back. */
  const run = async (
    kind: 'downloading' | 'copying',
    work: (onProgress: (p: ImportProgress) => void) => Promise<string>,
  ) => {
    const before = phase;
    setProblem('');
    setProgress(null);
    setPhase(kind);
    try {
      const result = await work(p => live.current && setProgress(p));
      if (!live.current) return;
      if (result === 'imported' || result === 'downloaded') {
        setPartial(0);
        setPhase('ready');
      } else {
        setPhase(before);
      }
    } catch (error) {
      if (!live.current) return;
      const code = (error as { code?: string }).code ?? '';
      setProblem(IMPORT_ERRORS[code] ?? 'That didn’t work. Try again.');
      setPhase(before);
    }
    if (kind === 'downloading') {
      partialDownloadBytes().then(bytes => live.current && setPartial(bytes));
    }
  };
  const download = () => run('downloading', downloadModelFile);
  const choose = () => run('copying', importModelFile);

  const percent =
    progress && progress.total > 0 ? Math.min(100, Math.round((progress.copied / progress.total) * 100)) : null;

  const status = STATUS[phase];
  const finish = () => go('Home', { reset: true });

  return (
    <Screen top={56} px={24} gap={20} bottom={32} fill>
      <View className="gap-10">
        <View className="flex-row items-center justify-between">
          <BackButton to="Setup" look="plain" />
          <T className="text-13 font-semibold text-ink-2">Step 2 of 3</T>
        </View>
        <Steps done={2} />
      </View>

      <Glass className="items-center gap-16 rounded-28 px-20 pb-20 pt-24" style={fx.panel06}>
        <View className="h-112 w-112 items-center justify-center">
          <Spin className="absolute inset-0">
            <View
              className="h-112 w-112 rounded-full border-2 border-dashed"
              style={{ borderColor: phase === 'ready' ? palette.success.DEFAULT : palette.peri[300] }}
            />
          </Spin>
          <Companion size={84} mode={phase === 'ready' ? 'offline' : 'idle'} />
          <View className="absolute bottom-6 right-2 h-30 w-30 items-center justify-center rounded-10 border-[3px] border-white bg-ink">
            <Icon name="phoneBare" size={14} strokeWidth={2.4} color={palette.white} />
          </View>
        </View>
        <View className="items-center gap-6">
          <T accessibilityRole="header" className="text-center text-24 font-bold leading-[30px] tracking-[-0.48px]">
            MIRA runs on this phone
          </T>
          <T className="max-w-290 text-center text-14 leading-[21px] text-ink-2">Your messages are read here, never on a server. It works with no connection.</T>
        </View>
        <View className="flex-row items-center gap-6 rounded-full px-12 py-6" style={{ backgroundColor: status.bg }}>
          <View className="h-8 w-8 rounded-full" style={{ backgroundColor: status.fg }} />
          <T className="text-12 font-bold" style={{ color: status.fg }}>
            {status.label}
          </T>
        </View>
      </Glass>

      <Glass className="rounded-22 px-16 py-4">
        <Rows>
          <Fact label="Where it runs">
            <T className="text-14 font-bold">On this phone</T>
          </Fact>
          <Fact label="Size on this phone">
            <T className="text-14 font-bold">About 1.1 GB</T>
          </Fact>
          <Fact label="Internet needed">
            <View className="flex-row items-center gap-6">
              <Icon name="check" size={16} strokeWidth={2.4} color={palette.success.ink} />
              <T className="text-14 font-bold text-success-ink">Only to download it</T>
            </View>
          </Fact>
        </Rows>
      </Glass>

      {phase === 'copying' || phase === 'downloading' ? (
        <View accessibilityLiveRegion="polite" className="gap-8">
          <View className="h-8 overflow-hidden rounded-full bg-peri-tonal">
            <View className="h-8 rounded-full bg-navy" style={{ width: `${percent ?? 5}%` }} />
          </View>
          <T className="text-13 font-semibold text-ink-2">
            {progress === null
              ? phase === 'downloading'
                ? 'Connecting…'
                : 'Pick the file in the list that opened…'
              : `${phase === 'downloading' ? 'Downloading' : 'Adding'}… ${
                  percent === null ? '' : `${percent}% · `
                }${gb(progress.copied)}${percent === null ? '' : ` of ${gb(progress.total)}`} GB`}
          </T>
        </View>
      ) : null}

      {problem ? (
        <View accessibilityRole="alert" className="flex-row items-start gap-10 rounded-16 bg-error-bg px-14 py-12">
          <Icon name="info" size={18} color={palette.error.ink} />
          <T className="flex-1 text-13 leading-[18.85px] text-error-ink">{problem}</T>
        </View>
      ) : null}

      <View className="flex-row items-start gap-10 rounded-16 bg-warning-bg px-14 py-12">
        <View className="mt-1">
          <Icon name="info" size={18} color={palette.warning.text} />
        </View>
        <T className="flex-1 text-13 leading-[18.85px] text-warning-text">
          {phase === 'ready'
            ? 'MIRA reads everything on this phone. Your messages never leave it, and it works with no connection.'
            : phase === 'downloading'
            ? 'Keep MIRA open while it downloads. If it stops, tap Resume to carry on.'
            : `Downloading uses about ${gb(MODEL_BYTES)} GB, so Wi-Fi is best. It’s the only time MIRA goes online; your messages never leave this phone.`}
        </T>
      </View>

      <View className="mt-auto gap-10">
        {phase === 'ready' ? (
          <>
            <PrimaryButton label="Finish setup" onPress={finish} />
            <SecondaryButton label="Replace MIRA’s file" onPress={choose} />
          </>
        ) : phase === 'downloading' ? (
          <SecondaryButton label="Pause download" onPress={() => cancelModelDownload().catch(() => {})} />
        ) : phase === 'copying' ? (
          <PrimaryButton label="Adding…" disabled className="opacity-60" />
        ) : (
          <>
            <PrimaryButton
              label={
                partial > 0
                  ? `Resume download (${gb(partial)} of ${gb(MODEL_BYTES)} GB done)`
                  : 'Download MIRA’s file'
              }
              onPress={download}
              left={<Icon name="download" size={18} color={palette.white} />}
            />
            <SecondaryButton label="I have it: Add MIRA’s file" onPress={choose} />
          </>
        )}
        {phase === 'idle' ? (
          <Tap label="Continue for now" onPress={finish} className="min-h-44 items-center justify-center">
            <T className="text-14 font-semibold text-ink-2">Continue for now</T>
          </Tap>
        ) : null}
      </View>
    </Screen>
  );
}
