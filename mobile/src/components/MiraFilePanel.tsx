/**
 * MIRA's file on this phone (board 04): whether it is here and valid, a
 * one-tap download (the only use of the internet), adding a copy the user
 * already has, and a local test that the model loads and answers. Shared by
 * first-visit setup and the "MIRA on this phone" page. Spec:
 * docs/specs/2026-10-10-on-device-model-hardening.md, section 4.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from './Companion';
import { Icon } from './Icon';
import { Spin } from './motion';
import { T } from './T';
import { Glass, PrimaryButton, SecondaryButton, Tap } from './ui';
import { codeOf, type ModelErrorCode } from '../core/modelErrors';
import { bridge, model } from '../services';
import {
  cancelModelDownload,
  downloadModelFile,
  type ImportProgress,
  importModelFile,
  MODEL_BYTES,
  type ModelFileStatus,
  modelStatus,
  partialDownloadBytes,
} from '../services/model/importFile';
import { fx } from '../theme/effects';
import palette from '../theme/palette';

type Work = 'idle' | 'downloading' | 'copying';
type Load = 'none' | 'loading' | { ms: number };

/** What went wrong, in plain words, by fixed code. */
const PROBLEMS: Partial<Record<ModelErrorCode, string>> = {
  MODEL_INVALID: 'That isn’t MIRA’s file. Pick the one ending in .gguf.',
  MODEL_NO_SPACE: 'Not enough free space. Free up about 1.3 GB and try again.',
  MODEL_IMPORT_FAILED: 'That file couldn’t be opened. Try picking it again.',
  MODEL_DOWNLOAD_FAILED: 'The download stopped. Check your connection, then tap Resume.',
  MODEL_CHECKSUM_FAILED: 'The download was damaged, so it was deleted. Try again.',
  MODEL_BUSY: 'Still downloading from before. Check back in a minute.',
  MODEL_OFFLINE: 'You’re offline. Connect to the internet to download MIRA’s file.',
  MODEL_LOAD_FAILED: 'MIRA’s file couldn’t be loaded. Try again, or replace the file.',
  MODEL_TIMEOUT: 'MIRA took too long to answer. Try again.',
  MODEL_NOT_INSTALLED: 'MIRA’s file isn’t on this phone yet.',
};

const FACTS = [
  'Install MIRA’s file before MIRA can read and answer.',
  'Internet is only needed to download it.',
  'After that, MIRA works in airplane mode.',
  'Your messages never go to Open WebUI or any online AI.',
];

const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(2);

type Action = { label: string; onPress(): void };

/**
 * `next` is offered once the file is in place; `skip` while it is not
 * (first-visit setup passes both, the settings page neither).
 */
export function MiraFilePanel({ next, skip }: { next?: Action; skip?: Action }) {
  const [file, setFile] = useState<ModelFileStatus>('missing');
  const [work, setWork] = useState<Work>('idle');
  const [load, setLoad] = useState<Load>('none');
  const [online, setOnline] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [problem, setProblem] = useState('');
  // Bytes an unfinished download left, so it can resume instead of starting over.
  const [partial, setPartial] = useState(0);
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const check = useCallback(() => {
    modelStatus().then(
      status => live.current && setFile(status),
      () => live.current && setFile('missing'),
    );
    partialDownloadBytes().then(bytes => live.current && setPartial(bytes));
  }, []);
  useEffect(check, [check]);

  useEffect(() => {
    bridge.isOnline().then(
      value => live.current && setOnline(value),
      () => {},
    );
    return bridge.onOnlineChange(value => live.current && setOnline(value));
  }, []);

  const say = (error: unknown) =>
    setProblem(PROBLEMS[codeOf(error) ?? 'MODEL_IMPORT_FAILED'] ?? 'That didn’t work. Try again.');

  /** Runs a download or an import, sharing progress, errors, and the way back. */
  const run = async (
    kind: 'downloading' | 'copying',
    step: (onProgress: (p: ImportProgress) => void) => Promise<string>,
  ) => {
    setProblem('');
    setProgress(null);
    setLoad('none');
    setWork(kind);
    try {
      const result = await step(p => live.current && setProgress(p));
      if (!live.current) return;
      if (result === 'imported' || result === 'downloaded') {
        // A new file: let go of any loaded model so the next request uses it.
        await model.reload?.().catch(() => {});
        setPartial(0);
        setFile('installed');
      }
    } catch (error) {
      if (live.current) say(error);
    }
    if (!live.current) return;
    setWork('idle');
    if (kind === 'downloading') {
      partialDownloadBytes().then(bytes => live.current && setPartial(bytes));
    }
  };
  const download = () => run('downloading', downloadModelFile);
  const choose = () => run('copying', importModelFile);

  /** Loads the model and runs one tiny request, all on the phone. */
  const test = async () => {
    setProblem('');
    setLoad('loading');
    try {
      const result = await model.warmUp!();
      if (live.current) setLoad({ ms: result.ms });
    } catch (error) {
      if (!live.current) return;
      setLoad('none');
      say(error);
    }
  };

  const percent =
    progress && progress.total > 0 ? Math.min(100, Math.round((progress.copied / progress.total) * 100)) : null;

  const busy = work !== 'idle';
  const ready = file === 'installed';
  const label = busy
    ? progress?.phase === 'verifying'
      ? 'Checking the file…'
      : work === 'downloading'
      ? 'Downloading to this phone…'
      : 'Adding to this phone…'
    : load === 'loading'
    ? 'Loading MIRA…'
    : typeof load === 'object'
    ? `Loaded · answered on this phone in ${(load.ms / 1000).toFixed(1)} s`
    : ready
    ? online === false
      ? 'Ready · works offline'
      : 'On this phone · ready offline'
    : file === 'invalid'
    ? 'The file on this phone isn’t a model'
    : partial > 0
    ? `Paused · ${gb(partial)} of ${gb(MODEL_BYTES)} GB`
    : 'Not on this phone yet';
  const tone =
    ready && !busy
      ? { fg: palette.success.ink, bg: palette.success.bg }
      : file === 'invalid' && !busy
      ? { fg: palette.error.ink, bg: palette.error.bg }
      : busy || load === 'loading'
      ? { fg: palette.navy.DEFAULT, bg: palette.peri.tonal }
      : { fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)' };

  return (
    <>
      <Glass className="items-center gap-16 rounded-28 px-20 pb-20 pt-24" style={fx.panel06}>
        <View className="h-112 w-112 items-center justify-center">
          <Spin className="absolute inset-0">
            <View
              className="h-112 w-112 rounded-full border-2 border-dashed"
              style={{ borderColor: ready ? palette.success.DEFAULT : palette.peri[300] }}
            />
          </Spin>
          <Companion size={84} mode={load === 'loading' || busy ? 'thinking' : ready ? 'offline' : 'idle'} />
          <View className="absolute bottom-6 right-2 h-30 w-30 items-center justify-center rounded-10 border-[3px] border-white bg-ink">
            <Icon name="phoneBare" size={14} strokeWidth={2.4} color={palette.white} />
          </View>
        </View>
        <T accessibilityRole="header" className="text-center text-24 font-bold leading-[30px] tracking-[-0.48px]">
          MIRA runs on this phone.
        </T>
        <View
          accessible
          accessibilityLabel={`Status: ${label}`}
          accessibilityLiveRegion="polite"
          className="flex-row items-center gap-6 rounded-full px-12 py-6"
          style={{ backgroundColor: tone.bg }}
        >
          <View className="h-8 w-8 rounded-full" style={{ backgroundColor: tone.fg }} />
          <T className="text-12 font-bold" style={{ color: tone.fg }}>
            {label}
          </T>
        </View>
      </Glass>

      <Glass className="gap-8 rounded-22 p-16">
        {FACTS.map(fact => (
          <View key={fact} className="flex-row items-start gap-8">
            <Icon name="check" size={16} strokeWidth={2.4} color={palette.success.ink} />
            <T className="flex-1 text-14 leading-[20px] text-ink-body">{fact}</T>
          </View>
        ))}
      </Glass>

      {busy ? (
        <View accessibilityLiveRegion="polite" className="gap-8">
          <View className="h-8 overflow-hidden rounded-full bg-peri-tonal">
            <View className="h-8 rounded-full bg-navy" style={{ width: `${percent ?? 5}%` }} />
          </View>
          <T className="text-13 font-semibold text-ink-2">
            {progress === null
              ? work === 'downloading'
                ? 'Connecting…'
                : 'Pick the file in the list that opened…'
              : `${work === 'downloading' ? 'Downloading' : 'Adding'}… ${
                  percent === null ? '' : `${percent}% · `
                }${gb(progress.copied)}${percent === null ? '' : ` of ${gb(progress.total)}`} GB`}
          </T>
          {work === 'downloading' ? (
            <T className="text-12 text-ink-muted">Keep MIRA open. If it stops, tap Resume.</T>
          ) : null}
        </View>
      ) : !ready ? (
        <T className="text-12 text-ink-muted">{`About ${gb(MODEL_BYTES)} GB. Wi-Fi is best.`}</T>
      ) : null}

      {problem ? (
        <View accessibilityRole="alert" className="flex-row items-start gap-10 rounded-16 bg-error-bg px-14 py-12">
          <Icon name="info" size={18} color={palette.error.ink} />
          <T className="flex-1 text-13 leading-[18.85px] text-error-ink">{problem}</T>
        </View>
      ) : null}

      <View className="mt-auto gap-10">
        {ready && !busy ? (
          <>
            {next ? <PrimaryButton label={next.label} onPress={next.onPress} /> : null}
            <SecondaryButton
              label={load === 'loading' ? 'Loading MIRA…' : 'Test MIRA'}
              onPress={load === 'loading' ? undefined : test}
            />
            <SecondaryButton label="Replace MIRA’s file" onPress={choose} />
          </>
        ) : work === 'downloading' ? (
          <SecondaryButton label="Pause download" onPress={() => cancelModelDownload().catch(() => {})} />
        ) : work === 'copying' ? (
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
        {!ready && !busy && skip ? (
          <Tap label={skip.label} onPress={skip.onPress} className="min-h-44 items-center justify-center">
            <T className="text-14 font-semibold text-ink-2">{skip.label}</T>
          </Tap>
        ) : null}
      </View>
    </>
  );
}
