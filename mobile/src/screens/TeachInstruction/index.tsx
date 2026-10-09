/** Board 08-teach-by-instruction: write, MIRA interprets, review, saved. */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { FadeIn, Pop } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton, Field, Glass, PrimaryButton, Rows, SecondaryButton, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Phase = 'write' | 'thinking' | 'review' | 'saved';

const TONES = ['Professional', 'Friendly', 'Formal'];
const LENGTHS = ['Short', 'Medium'];
const IDEAS = [
  'Never schedule meetings before 10 AM.',
  'Sign my emails “Best, Alex”.',
  'Summarize long emails in 3 bullets.',
  'Keep my email replies short and professional.',
];

function EditValue({ label, value, onPress }: { label: string; value: string; onPress(): void }) {
  return (
    <Tap label={label} onPress={onPress} className="h-40 flex-row items-center gap-6 rounded-12 border border-white/80 bg-white/55 px-12">
      <T className="text-14 font-bold">{value}</T>
      <Icon name="pencil" size={13} strokeWidth={2.4} color={palette.navy.DEFAULT} />
    </Tap>
  );
}

function Line({ label, children, tight }: { label: string; children: React.ReactNode; tight?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between ${tight ? 'py-8' : 'py-14'}`}>
      <T className="text-14 text-ink-2">{label}</T>
      {children}
    </View>
  );
}

export default function TeachInstructionScreen() {
  const go = useGo();
  const [phase, setPhase] = useState<Phase>('write');
  const [text, setText] = useState('Keep my email replies short and professional.');
  const [tone, setTone] = useState(0);
  const [length, setLength] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const step = { write: 1, thinking: 2, review: 2, saved: 3 }[phase];
  const interpret = () => {
    if (!text.trim()) {
      return;
    }
    setPhase('thinking');
    timer.current = setTimeout(() => setPhase('review'), 1000);
  };

  return (
    <Screen gap={22}>
      <View className="flex-row items-center gap-12">
        <BackButton to="Teach" label="Back to Teach MIRA" />
        <View className="flex-1 gap-6">
          <T className="text-13 font-bold text-ink-2">Teach by instruction</T>
          <Steps done={step} />
        </View>
      </View>

      {phase === 'write' ? (
        <View className="gap-20">
          <View className="flex-row items-center gap-14">
            <Companion size={52} />
            <T accessibilityRole="header" className="flex-1 text-27 leading-[32.4px] tracking-[-0.81px]">
              What would you like MIRA to learn?
            </T>
          </View>
          <View className="gap-8">
            <T className="text-13 font-bold">Your instruction</T>
            <Field
              accessibilityLabel="Your instruction"
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Describe it the way you’d tell a colleague…"
              textAlignVertical="top"
              className="min-h-160 rounded-20 border-[1.5px] border-peri-300 bg-white/60 p-16 text-17 leading-[25.5px]"
              style={fx.field}
            />
          </View>
          <View className="gap-10">
            <T className="text-13 font-bold">Try one of these</T>
            <View className="flex-row flex-wrap gap-8">
              {IDEAS.map((idea) => (
                <Tap
                  key={idea}
                  label={idea}
                  onPress={() => setText(idea)}
                  className="min-h-40 justify-center rounded-14 border border-white/80 bg-white/60 px-14 py-8"
                >
                  <T className="text-13 font-semibold leading-[17.55px]">{idea}</T>
                </Tap>
              ))}
            </View>
          </View>
          <PrimaryButton label="Continue" onPress={interpret} />
        </View>
      ) : null}

      {phase === 'thinking' ? (
        <View className="items-center justify-center gap-18 pt-120">
          <Companion size={96} mode="thinking" />
          <T className="text-16 font-bold">Understanding your instruction…</T>
        </View>
      ) : null}

      {phase === 'review' ? (
        <FadeIn distance={10} className="gap-18">
          <T accessibilityRole="header" className="text-27 leading-[32.4px] tracking-[-0.81px]">Here’s what I understood</T>
          <View className="max-w-[86%] self-end rounded-t-20 rounded-bl-20 rounded-br-6 bg-navy px-14 py-12">
            <T className="text-15 leading-[21.75px] text-white">“{text}”</T>
          </View>
          <Glass className="rounded-24 px-16 py-6" style={fx.panel08}>
            <Rows>
              <Line label="Category">
                <T className="text-14 font-bold">Communication</T>
              </Line>
              <Line label="Preferred tone" tight>
                <EditValue label="Change tone" value={TONES[tone]} onPress={() => setTone((tone + 1) % TONES.length)} />
              </Line>
              <Line label="Response length" tight>
                <EditValue label="Change length" value={LENGTHS[length]} onPress={() => setLength((length + 1) % LENGTHS.length)} />
              </Line>
              <Line label="Applies to">
                <T className="text-14 font-bold">Email drafts</T>
              </Line>
              <Line label="Sends messages automatically">
                <View className="rounded-full bg-error-bg px-10 py-4">
                  <T className="text-13 font-bold text-error-ink">No</T>
                </View>
              </Line>
            </Rows>
          </Glass>
          <View className="flex-row items-start gap-12 rounded-18 bg-mint-bg p-14">
            <Icon name="shieldCheck" size={20} color={palette.mint.ink} />
            <T className="flex-1 text-13 leading-[19.5px] text-mint-deep">Saves a preference only. Sending always needs your OK.</T>
          </View>
          <View className="gap-10">
            <PrimaryButton label="Confirm & save" onPress={() => setPhase('saved')} />
            <View className="flex-row gap-10">
              <SecondaryButton label="Edit instruction" onPress={() => setPhase('write')} height={50} radius={16} className="flex-1" />
              <Tap label="Cancel" onPress={() => go('Teach')} className="h-50 flex-1 items-center justify-center rounded-16">
                <T className="text-15 font-bold text-ink-label">Cancel</T>
              </Tap>
            </View>
          </View>
        </FadeIn>
      ) : null}

      {phase === 'saved' ? (
        <View className="items-center gap-18 pt-80">
          <Pop className="h-88 w-88 items-center justify-center rounded-full bg-success-bg">
            <Icon name="check" size={42} strokeWidth={2.4} color={palette.success.ink} />
          </Pop>
          <T accessibilityRole="header" className="text-26 font-bold tracking-[-0.52px]">MIRA learned it</T>
          <T className="max-w-300 text-center text-15 leading-[23.25px] text-ink-2">
            “{TONES[tone]}, {LENGTHS[length].toLowerCase()} email replies” is saved to Personal Memory.
          </T>
          <View className="mt-12 w-full gap-10">
            <PrimaryButton label="View saved preferences" onPress={() => go('Memory')} />
            <SecondaryButton
              label="Teach something else"
              onPress={() => {
                setText('');
                setPhase('write');
              }}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
