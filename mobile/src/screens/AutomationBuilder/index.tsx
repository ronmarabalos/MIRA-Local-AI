/** Board 10-automation-builder. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { FadeIn, Spin } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, ChoicePill, Field, Glass, PrimaryButton, Radio, Switch, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

const TRIGGERS = ['An email arrives', 'A time of day', 'A task is due'];
const ACTIONS = ['Prepare a reply draft', 'Remind me', 'Create a task'];
const CONDITIONS = ['It’s a routine meeting request', 'Sender is in my contacts'];
const LEVELS = [
  { label: 'Prepare only', hint: 'MIRA drafts, you decide' },
  { label: 'Ask before acting', hint: 'Asks every time' },
  { label: 'Act automatically', hint: 'Not for email', disabled: true },
];

function Tag({ text, fg, bg }: { text: string; fg: string; bg: string }) {
  return (
    <View className="rounded-8 px-10 py-5" style={{ backgroundColor: bg }}>
      <T className="text-11 font-bold tracking-[1.1px]" style={{ color: fg }}>
        {text}
      </T>
    </View>
  );
}

function Connector() {
  return (
    <View accessibilityElementsHidden className="h-28 items-center">
      <View className="w-2 flex-1 bg-peri-300" />
    </View>
  );
}

function Choices({ items, value, onChange }: { items: string[]; value: number; onChange(i: number): void }) {
  return (
    <View className="flex-row flex-wrap gap-8">
      {items.map((label, i) => (
        <ChoicePill key={label} label={label} selected={i === value} onPress={() => onChange(i)} />
      ))}
    </View>
  );
}

function Card({ children, then }: { children: ReactNode; then?: boolean }) {
  return then ? (
    <View className="gap-12 rounded-22 border-[1.5px] border-peri-300 bg-white/60 p-16" style={fx.panel08b}>
      {children}
    </View>
  ) : (
    <Glass className="gap-12 rounded-22 p-16">{children}</Glass>
  );
}

export default function AutomationBuilderScreen() {
  const go = useGo();
  const [desc, setDesc] = useState('When a routine meeting request arrives, prepare a reply draft for me.');
  const [working, setWorking] = useState(false);
  const [proposed, setProposed] = useState(true);
  const [trigger, setTrigger] = useState(0);
  const [action, setAction] = useState(0);
  const [level, setLevel] = useState(0);
  const [conds, setConds] = useState([true, false]);
  const [name, setName] = useState('Draft routine email replies');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const propose = () => {
    setWorking(true);
    setProposed(false);
    timer.current = setTimeout(() => {
      setWorking(false);
      setProposed(true);
      setTrigger(0);
      setAction(0);
      setConds([true, false]);
    }, 1000);
  };

  return (
    <Screen gap={20}>
      <View className="flex-row items-center justify-between">
        <BackButton to="Teach" />
        <Tap label="My automations" onPress={() => go('Automations')} className="px-4 py-12">
          <T className="text-14 font-bold text-navy">My automations</T>
        </Tap>
      </View>
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Create an Automation</T>

      <View className="gap-12 rounded-24 border border-white/80 p-16" style={fx.summary}>
        <View className="flex-row items-center gap-10">
          <Companion size={32} />
          <T className="flex-1 text-15 font-bold">Describe what you want to automate.</T>
        </View>
        <Field
          accessibilityLabel="Describe what you want to automate"
          multiline
          value={desc}
          onChangeText={setDesc}
          textAlignVertical="top"
          className="min-h-70 rounded-16 border border-white/80 bg-white/60 px-14 py-12 text-15 leading-[22.5px]"
        />
        <Tap label={working ? 'Drafting a rule' : 'Propose a rule'} onPress={propose} className="h-46 flex-row items-center justify-center gap-8 rounded-14 bg-ink">
          {working ? (
            <Spin>
              <View className="h-16 w-16 rounded-full border-2 border-white/30" style={{ borderTopColor: palette.white }} />
            </Spin>
          ) : null}
          <T className="text-14 font-bold text-white">{working ? 'Drafting a rule…' : 'Propose a rule'}</T>
        </Tap>
      </View>

      {proposed ? (
        <FadeIn className="flex-row items-center gap-8 rounded-14 bg-peri-tonal px-12 py-10">
          <Icon name="pencil" size={16} strokeWidth={2.2} color={palette.navy.DEFAULT} />
          <T className="text-13 font-bold text-navy">Proposed by MIRA. Edit freely.</T>
        </FadeIn>
      ) : null}

      <View className="gap-6">
        <T className="text-13 font-bold">Automation name</T>
        <Field
          accessibilityLabel="Automation name"
          value={name}
          onChangeText={setName}
          className="h-52 rounded-16 border border-white/80 bg-white/60 px-14 text-16 font-semibold"
        />
      </View>

      <View accessibilityLabel="Workflow">
        <Card>
          <View className="flex-row items-center gap-10">
            <Tag text="WHEN" fg={palette.white} bg={palette.navy.DEFAULT} />
            <T className="text-15 font-bold">{TRIGGERS[trigger]}</T>
          </View>
          <Choices items={TRIGGERS} value={trigger} onChange={setTrigger} />
        </Card>
        <Connector />
        <Card>
          <View className="flex-row items-center gap-10">
            <Tag text="IF" fg={palette.ink.DEFAULT} bg={palette.peri[150]} />
            <T className="text-15 font-bold">Conditions</T>
            <T className="text-12 text-ink-muted">optional</T>
          </View>
          {CONDITIONS.map((label, i) => (
            <View key={label} className="min-h-48 flex-row items-center gap-10 rounded-14 border border-ink/8 bg-white/50 py-6 pl-12 pr-6">
              <T className="flex-1 text-14 font-semibold">{label}</T>
              <Switch on={conds[i]} label={label} onPress={() => setConds(conds.map((v, j) => (j === i ? !v : v)))} />
            </View>
          ))}
          <Tap label="Add condition" className="h-40 flex-row items-center justify-center gap-6 rounded-12 border border-dashed border-peri-300 bg-white/60">
            <Icon name="plus" size={14} strokeWidth={2.4} color={palette.navy.DEFAULT} />
            <T className="text-13 font-bold text-navy">Add condition</T>
          </Tap>
        </Card>
        <Connector />
        <Card then>
          <View className="flex-row items-center gap-10">
            <Tag text="THEN" fg={palette.white} bg={palette.mint.ink} />
            <T className="text-15 font-bold">{ACTIONS[action]}</T>
          </View>
          <Choices items={ACTIONS} value={action} onChange={setAction} />
        </Card>
      </View>

      <View className="gap-10">
        <T className="text-15 font-bold">How much can MIRA do?</T>
        <View accessibilityRole="radiogroup" accessibilityLabel="Permission level" className="gap-8">
          {LEVELS.map((l, i) => {
            const sel = i === level;
            return (
              <Tap
                key={l.label}
                label={l.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel, disabled: !!l.disabled }}
                disabled={l.disabled}
                onPress={() => setLevel(i)}
                className={`min-h-60 flex-row items-center gap-12 rounded-16 px-14 py-10 ${
                  sel ? 'border-[1.5px] border-peri-600 bg-white/55' : 'border border-white/80 bg-white'
                } ${l.disabled ? 'opacity-55' : ''}`}
              >
                <Radio on={sel} />
                <View className="gap-2">
                  <T className="text-14 font-bold">{l.label}</T>
                  <T className="text-12 text-ink-2">{l.hint}</T>
                </View>
              </Tap>
            );
          })}
        </View>
      </View>

      <Glass className="flex-row items-center gap-12 rounded-18 px-14 py-12">
        <Icon name="lock" size={20} color={palette.navy.DEFAULT} />
        <View className="flex-1 gap-2">
          <T className="text-14 font-bold">Ask me before sending</T>
          <T className="text-12 text-ink-muted">Always on for email</T>
        </View>
        <View className="rounded-full bg-white/60 px-8 py-4">
          <T className="text-11 font-bold text-ink-label">Locked</T>
        </View>
      </Glass>

      <PrimaryButton label="Review" onPress={() => go('AutomationReview')} />
    </Screen>
  );
}
