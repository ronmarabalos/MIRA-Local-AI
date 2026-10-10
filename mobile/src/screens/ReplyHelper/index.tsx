/**
 * "Should I help answer your messages?": MIRA asks a few questions in a chat,
 * switches on reply drafts for what the user chose, and can draft replies to
 * today's messages at once. Every draft waits in Approvals; sending always
 * needs the user's tap and confirmation, then goes out through the app's own
 * reply box.
 */
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { PulseDot } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Field, PrimaryButton, SecondaryButton, Tap } from '../../components/ui';
import { BUILTIN_RULES } from '../../core/builtinRules';
import { draftRuleFor, messagesToDraft, REPLY_KINDS, type ReplySetup, setupFromRule } from '../../core/replySetup';
import type { Channel, RecordType } from '../../core/types';
import { getActionRunner } from '../../services/actions/runner';
import { getChannelManager } from '../../services/channels/manager';
import { getStore } from '../../services/db';
import { useChannels, useDrafts, useRules } from '../../services/db/hooks';

const TONES = ['Friendly', 'Polite and formal', 'Short and simple', 'Casual Taglish'];

type Step = 'start' | 'about' | 'apps' | 'kinds' | 'tone' | 'confirm' | 'saving' | 'offer' | 'drafting' | 'done';
type Line = { from: 'mira' | 'you'; text: string };

const DRAFT_RULE = BUILTIN_RULES.find(rule => rule.id === 'builtin-draft')!;

const list = (words: string[]) =>
  words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

function Bubble({ line, thinking }: { line: Line; thinking?: boolean }) {
  return line.from === 'you' ? (
    <View className="max-w-[85%] self-end rounded-18 rounded-br-6 bg-navy px-14 py-10">
      <T className="text-14 font-semibold text-white">{line.text}</T>
    </View>
  ) : (
    <View className="flex-row items-start gap-8">
      <Companion size={32} mode={thinking ? 'thinking' : 'idle'} />
      <View className="flex-1 rounded-18 rounded-tl-6 border border-white/80 bg-white/60 p-14">
        <T className="text-15 leading-[22px]">{line.text}</T>
      </View>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress(): void }) {
  return (
    <Tap
      label={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      className={`min-h-44 justify-center rounded-full px-16 ${on ? 'bg-navy' : 'border border-white/80 bg-white/60'}`}
    >
      <T className={`text-14 font-semibold ${on ? 'text-white' : 'text-ink-body'}`}>{label}</T>
    </Tap>
  );
}

export default function ReplyHelperScreen() {
  const go = useGo();
  const { data: channels } = useChannels();
  const { data: rules } = useRules();
  const { data: waiting } = useDrafts('waiting');
  const connected = (channels ?? []).filter(c => c.enabled);
  const rule = rules?.find(r => r.id === DRAFT_RULE.id) ?? DRAFT_RULE;
  const alreadyOn = !!rules?.find(r => r.id === DRAFT_RULE.id)?.enabled;

  const [step, setStep] = useState<Step>('start');
  const [lines, setLines] = useState<Line[]>([]);
  const [about, setAbout] = useState('');
  const [apps, setApps] = useState<string[]>([]);
  const [setup, setSetup] = useState<ReplySetup>({ kinds: ['question'], groups: false });
  const [tone, setTone] = useState(TONES[0]);
  const [problem, setProblem] = useState('');

  const say = (...more: Line[]) => setLines(current => [...current, ...more]);
  const mira = (text: string): Line => ({ from: 'mira', text });
  const you = (text: string): Line => ({ from: 'you', text });
  const appName = (pkg: string) => connected.find(c => c.packageName === pkg)?.label ?? pkg;
  const kindNames = (kinds: RecordType[]) =>
    REPLY_KINDS.filter(k => kinds.includes(k.kind)).map(k => k.label.toLowerCase());

  const begin = async () => {
    // Start from what was chosen before, if anything.
    const store = await getStore().catch(() => null);
    const prefs = (await store?.getPrefs().catch(() => ({}) as Record<string, string>)) ?? {};
    setAbout(prefs.replyAbout ?? '');
    setTone(prefs.replyTone || TONES[0]);
    setSetup(setupFromRule(rule));
    const drafting = connected.filter(c => c.level === 2).map(c => c.packageName);
    setApps(drafting.length > 0 ? drafting : connected.map(c => c.packageName));
    say(mira('Great! First, tell me a little about you, so my replies sound like you.'));
    setStep('about');
  };

  const answerAbout = (skip: boolean) => {
    say(you(skip || about.trim() === '' ? 'Skip' : about.trim()));
    if (skip) setAbout('');
    say(
      mira(
        connected.length === 0
          ? 'Which apps should I write replies in? You haven’t connected any yet.'
          : 'Which apps should I write replies in?',
      ),
    );
    setStep('apps');
  };

  const answerApps = () => {
    say(you(list(apps.map(appName))), mira('Which messages should I write replies to?'));
    setStep('kinds');
  };

  const answerKinds = () => {
    say(
      you(`${list(kindNames(setup.kinds))}${setup.groups ? ', in group chats too' : ', in private chats'}`),
      mira('How should I sound?'),
    );
    setStep('tone');
  };

  const answerTone = (choice: string) => {
    setTone(choice);
    say(
      you(choice),
      mira(
        `Got it. I’ll write ${choice.toLowerCase()} replies to ${list(kindNames(setup.kinds))} in ${list(
          apps.map(appName),
        )}. You check each one before it’s sent.`,
      ),
    );
    setStep('confirm');
  };

  const save = async () => {
    setProblem('');
    setStep('saving');
    try {
      const store = await getStore();
      await store.setPref('replyAbout', about.trim());
      await store.setPref('replyTone', tone);
      // Drafting needs the "Also draft replies" level; other connected apps only read.
      const manager = await getChannelManager();
      for (const channel of connected) {
        const level = apps.includes(channel.packageName) ? 2 : 1;
        if (channel.level !== level) await manager.save({ ...channel, level } as Channel);
      }
      await store.saveRule(draftRuleFor(rule, setup));
      say(you('Turn on reply drafts'), mira('Done! Reply drafts are on. Want me to write replies for today’s messages now?'));
      setStep('offer');
    } catch {
      setProblem('Couldn’t save that. Try again.');
      setStep('confirm');
    }
  };

  const draftNow = async () => {
    say(you('Yes, write them now'));
    setStep('drafting');
    try {
      const [store, runner] = await Promise.all([getStore(), getActionRunner()]);
      const now = Date.now();
      const items = await store.getItems(now - 24 * 3_600_000, now + 1, 200);
      let made = 0;
      for (const item of messagesToDraft(items, setup, apps, now)) {
        const result = await runner.draftFor(item.message.id);
        if (result.outcome === 'drafted' || result.outcome === 'exists') made += 1;
      }
      say(
        mira(
          made === 0
            ? 'No messages today need a reply yet. I’ll write one as soon as one arrives.'
            : `I wrote ${made} ${made === 1 ? 'reply' : 'replies'}. Check ${made === 1 ? 'it' : 'them'} before ${
                made === 1 ? 'it’s' : 'they’re'
              } sent.`,
        ),
      );
    } catch {
      say(mira('I couldn’t write them right now. New messages will still get drafts.'));
    }
    setStep('done');
  };

  const notNow = () => {
    say(you('Not now'), mira('Okay. I’ll write a reply when a new message arrives.'));
    setStep('done');
  };

  let controls: ReactNode = null;
  if (step === 'start') {
    controls = alreadyOn ? (
      <>
        <PrimaryButton label={`Review drafts${waiting?.length ? ` (${waiting.length})` : ''}`} onPress={() => go('Approvals')} />
        <SecondaryButton label="Change my answers" onPress={begin} />
      </>
    ) : (
      <PrimaryButton label="Let’s set it up" onPress={begin} />
    );
  } else if (step === 'about') {
    controls = (
      <>
        <Field
          accessibilityLabel="About you"
          value={about}
          onChangeText={setAbout}
          placeholder="e.g. 3rd-year nursing student, part-time barista"
          maxLength={200}
          multiline
          className="min-h-56 rounded-16 border border-white/80 bg-white/60 px-14 py-12 text-15"
        />
        <PrimaryButton label="Next" disabled={about.trim() === ''} onPress={() => answerAbout(false)} />
        <SecondaryButton label="Skip" onPress={() => answerAbout(true)} />
      </>
    );
  } else if (step === 'apps') {
    controls =
      connected.length === 0 ? (
        <PrimaryButton label="Connect an app" onPress={() => go('ConnectedApps')} />
      ) : (
        <>
          <View className="flex-row flex-wrap gap-8">
            {connected.map(c => (
              <Chip
                key={c.packageName}
                label={c.label}
                on={apps.includes(c.packageName)}
                onPress={() =>
                  setApps(current =>
                    current.includes(c.packageName)
                      ? current.filter(p => p !== c.packageName)
                      : [...current, c.packageName],
                  )
                }
              />
            ))}
          </View>
          <PrimaryButton label="Next" disabled={apps.length === 0} onPress={answerApps} />
        </>
      );
  } else if (step === 'kinds') {
    controls = (
      <>
        <View className="flex-row flex-wrap gap-8">
          {REPLY_KINDS.map(k => (
            <Chip
              key={k.kind}
              label={k.label}
              on={setup.kinds.includes(k.kind)}
              onPress={() =>
                setSetup(current => ({
                  ...current,
                  kinds: current.kinds.includes(k.kind)
                    ? current.kinds.filter(x => x !== k.kind)
                    : [...current.kinds, k.kind],
                }))
              }
            />
          ))}
          <Chip
            label="Group chats too"
            on={setup.groups}
            onPress={() => setSetup(current => ({ ...current, groups: !current.groups }))}
          />
        </View>
        <PrimaryButton label="Next" disabled={setup.kinds.length === 0} onPress={answerKinds} />
      </>
    );
  } else if (step === 'tone') {
    controls = (
      <View className="flex-row flex-wrap gap-8">
        {TONES.map(t => (
          <Chip key={t} label={t} on={tone === t} onPress={() => answerTone(t)} />
        ))}
      </View>
    );
  } else if (step === 'confirm' || step === 'saving') {
    controls = (
      <PrimaryButton
        label={step === 'saving' ? 'Saving…' : 'Turn on reply drafts'}
        disabled={step === 'saving'}
        onPress={save}
      />
    );
  } else if (step === 'offer') {
    controls = (
      <>
        <PrimaryButton label="Yes, write them now" onPress={draftNow} />
        <SecondaryButton label="Not now" onPress={notNow} />
      </>
    );
  } else if (step === 'done') {
    controls = <PrimaryButton label="Review drafts" onPress={() => go('Approvals')} />;
  }

  return (
    <Screen top={56} px={20} gap={14} bottom={40}>
      <View className="flex-row items-center">
        <BackButton to="Home" label="Back to Today" />
      </View>
      <T accessibilityRole="header" className="text-28 font-bold tracking-[-0.56px]">
        Help with replies
      </T>

      <Bubble
        line={mira(
          alreadyOn
            ? `Reply drafts are on for ${list(kindNames(setupFromRule(rule).kinds))}. I write them; you check and send.`
            : 'I can write replies to your messages. You check each one, and nothing is sent without your OK.',
        )}
      />
      {lines.map((line, i) => (
        <Bubble key={i} line={line} />
      ))}
      {step === 'drafting' ? (
        <View className="flex-row items-center gap-8">
          <Companion size={32} mode="thinking" />
          <View className="flex-row items-center gap-10 rounded-18 border border-white/80 bg-white/60 p-14">
            <View className="flex-row gap-5">
              {[0, 200, 400].map(delay => (
                <PulseDot key={delay} delay={delay} duration={1400} scale className="h-8 w-8 rounded-full bg-peri-600" />
              ))}
            </View>
            <T className="text-14 font-semibold text-ink-body">Writing replies…</T>
          </View>
        </View>
      ) : null}

      {problem ? (
        <T accessibilityRole="alert" className="text-14 font-semibold text-error-ink">
          {problem}
        </T>
      ) : null}
      <View className="gap-10 pt-4">{controls}</View>
    </Screen>
  );
}
