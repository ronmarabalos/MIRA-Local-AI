/** Board 09-teach-by-example: example in, MIRA analyzes, proposes a preference. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { FadeIn } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, CheckBox, Field, Glass, PrimaryButton, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Phase = 'idle' | 'working' | 'done';

const TRAITS = ['Professional but friendly tone', 'Acknowledge the request first', 'Ask for the details you need'];

function Step({ n, active, last, children }: { n: number; active: boolean; last?: boolean; children: ReactNode }) {
  return (
    <View className="flex-row gap-14">
      <View className="items-center">
        <View className={`h-28 w-28 shrink-0 items-center justify-center rounded-full ${active ? 'bg-navy' : 'bg-peri-150'}`}>
          <T className={`text-13 font-bold ${active ? 'text-white' : 'text-ink-label'}`}>{n}</T>
        </View>
        {last ? null : <View className="my-4 w-2 flex-1 bg-peri-150" />}
      </View>
      <View className={`min-w-0 flex-1 gap-12 ${last ? '' : 'pb-22'}`}>{children}</View>
    </View>
  );
}

export default function TeachExampleScreen() {
  const go = useGo();
  const [phase, setPhase] = useState<Phase>('idle');
  const [saved, setSaved] = useState(false);
  const [on, setOn] = useState([true, true, true]);
  const [input, setInput] = useState('Can we reschedule our meeting?');
  const [output, setOutput] = useState('Certainly! Please let me know your preferred time.');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const done = phase === 'done';
  const analyze = () => {
    setPhase('working');
    timer.current = setTimeout(() => setPhase('done'), 1100);
  };

  return (
    <Screen gap={22}>
      <View className="flex-row items-center gap-12">
        <BackButton to="Teach" label="Back to Teach MIRA" />
        <T className="text-13 font-bold text-ink-2">Teach by example</T>
      </View>
      <T accessibilityRole="header" className="text-27 leading-[32.4px] tracking-[-0.81px]">Show MIRA an example.</T>

      <View>
        <Step n={1} active>
          <T className="pt-4 text-15 font-bold">Your example</T>
          <View className="gap-6">
            <T className="text-12 font-bold text-ink-2">EXAMPLE INPUT · incoming email</T>
            <Field
              accessibilityLabel="Example input"
              multiline
              value={input}
              onChangeText={setInput}
              textAlignVertical="top"
              className="min-h-70 rounded-16 border border-white/80 bg-white/60 px-14 py-12 text-15 leading-[22.5px]"
            />
          </View>
          <View className="items-center">
            <Icon name="arrowDown" size={20} strokeWidth={2.2} color={palette.peri[400]} />
          </View>
          <View className="gap-6">
            <T className="text-12 font-bold text-ink-2">YOUR PREFERRED RESPONSE</T>
            <Field
              accessibilityLabel="Your preferred response"
              multiline
              value={output}
              onChangeText={setOutput}
              textAlignVertical="top"
              className="min-h-70 rounded-16 border-[1.5px] border-peri-300 bg-white/60 px-14 py-12 text-15 leading-[22.5px]"
            />
          </View>
        </Step>

        <Step n={2} active={phase !== 'idle'}>
          <T className="pt-4 text-15 font-bold">MIRA analyzes it</T>
          {phase === 'idle' ? (
            <PrimaryButton label="Analyze example" onPress={analyze} height={50} radius={16} textClassName="text-15" style={fx.liftMdSoft} />
          ) : phase === 'working' ? (
            <View className="h-50 flex-row items-center gap-12">
              <Companion size={36} mode="thinking" />
              <T className="text-14 font-semibold text-ink-body">Analyzing…</T>
            </View>
          ) : (
            <View className="flex-row items-center gap-8">
              <Icon name="check" size={16} strokeWidth={2.4} color={palette.success.ink} />
              <T className="text-13 font-bold text-success-ink">Analyzed on device</T>
            </View>
          )}
        </Step>

        <Step n={3} active={done} last>
          <T className="pt-4 text-15 font-bold">MIRA proposes a reusable preference</T>
          {!done ? (
            <View className="rounded-18 border-[1.5px] border-dashed border-peri-200 p-18">
              <T className="text-center text-13 text-ink-muted">Appears after analysis</T>
            </View>
          ) : (
            <>
              <FadeIn distance={10}>
                <Glass className="gap-12 rounded-22 p-16" style={fx.panel08}>
                  <View className="flex-row items-center justify-between">
                    <T className="text-12 font-bold tracking-[0.72px] text-navy">MIRA LEARNS</T>
                    <View className={`rounded-full px-8 py-4 ${saved ? 'bg-success-bg' : 'bg-peri-tonal'}`}>
                      <T className={`text-11 font-bold ${saved ? 'text-success-ink' : 'text-navy'}`}>{saved ? 'Saved' : 'Suggested'}</T>
                    </View>
                  </View>
                  {TRAITS.map((label, i) => (
                    <Tap
                      key={label}
                      label={label}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on[i] }}
                      onPress={() => {
                        setOn(on.map((v, j) => (j === i ? !v : v)));
                        setSaved(false);
                      }}
                      className="min-h-44 flex-row items-center gap-10 rounded-14 border border-white/80 bg-white/50 px-12 py-8"
                    >
                      <CheckBox on={on[i]} border={1.5} />
                      <T className="flex-1 text-14 font-semibold">{label}</T>
                    </Tap>
                  ))}
                </Glass>
              </FadeIn>
              {saved ? (
                <Tap
                  label="Saved, view in Personal Memory"
                  onPress={() => go('Memory')}
                  className="h-50 flex-row items-center justify-center gap-6 rounded-16 bg-success-bg"
                >
                  <Icon name="check" size={16} strokeWidth={2.4} color={palette.success.ink} />
                  <T className="text-14 font-bold text-success-ink">Saved · view in Personal Memory</T>
                </Tap>
              ) : (
                <View className="flex-row gap-8">
                  <Tap label="Save" onPress={() => setSaved(true)} className="h-50 flex-[2] items-center justify-center rounded-16" style={fx.primary}>
                    <T className="text-15 font-bold text-white">Save</T>
                  </Tap>
                  <Tap
                    label="Revise"
                    onPress={() => {
                      setPhase('idle');
                      setSaved(false);
                    }}
                    className="h-50 flex-1 items-center justify-center rounded-16 border border-white/80 bg-white/60"
                  >
                    <T className="text-14 font-bold">Revise</T>
                  </Tap>
                  <Tap label="Discard" onPress={() => go('Teach')} className="h-50 flex-1 items-center justify-center rounded-16">
                    <T className="text-14 font-bold text-error-ink">Discard</T>
                  </Tap>
                </View>
              )}
            </>
          )}
        </Step>
      </View>
    </Screen>
  );
}
