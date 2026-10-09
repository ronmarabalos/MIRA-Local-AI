/** Board 11-review-and-approve. */
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { Pop } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, CheckBox, Glass, IconTile, PrimaryButton, Rows, SecondaryButton, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

const PERMS = [
  { label: 'Read incoming emails', hint: 'Subject, sender and body · on device' },
  { label: 'Create drafts', hint: 'Saved in your drafts, never sent' },
  { label: 'Use your saved tone preferences', hint: '“Friendly, concise” and “Short replies”' },
];

function Rule({ label, color, children }: { label: string; color: string; children: ReactNode }) {
  return (
    <View className="flex-row gap-12 py-14">
      <T className="w-64 shrink-0 pt-2 text-11 font-bold tracking-[0.88px]" style={{ color }}>
        {label}
      </T>
      <View className="flex-1">{children}</View>
    </View>
  );
}

function Pill({ text, fg, bg }: { text: string; fg: string; bg: string }) {
  return (
    <View className="rounded-full px-8 py-3" style={{ backgroundColor: bg }}>
      <T className="text-11 font-bold" style={{ color: fg }}>
        {text}
      </T>
    </View>
  );
}

export default function AutomationReviewScreen() {
  const go = useGo();
  const [on, setOn] = useState([true, true, false]);
  const [active, setActive] = useState(false);
  const all = on.every(Boolean);

  return (
    <Screen gap={18}>
      <View className="flex-row items-center gap-12">
        <BackButton to="AutomationBuilder" label="Back to builder" />
        <T className="text-13 font-bold text-ink-2">Review & approve</T>
      </View>

      <View className="gap-6">
        <View className={`self-start rounded-full px-8 py-4 ${active ? 'bg-success-bg' : 'bg-peri-tonal'}`}>
          <T className={`text-11 font-bold tracking-[0.66px] ${active ? 'text-success-ink' : 'text-navy'}`}>
            {active ? 'APPROVED · ACTIVE' : 'PROPOSED · NOT ACTIVE'}
          </T>
        </View>
        <T accessibilityRole="header" className="text-27 leading-[32.4px] tracking-[-0.81px]">Draft routine email replies</T>
      </View>

      <View className="flex-row items-start gap-12 rounded-22 bg-ink p-16">
        <IconTile name="shieldCheck" size={40} radius={13} iconSize={22} fg={palette.peri[300]} bg="rgba(180,192,240,0.2)" />
        <T className="flex-1 text-15 font-semibold leading-[22.5px] text-white">
          MIRA will prepare replies for this category, but will <T className="font-semibold text-peri-300">not send them</T> without your approval.
        </T>
      </View>

      <Glass className="rounded-22 px-16 py-4">
        <Rows>
          <Rule label="WHEN" color={palette.navy.DEFAULT}>
            <T className="text-14 font-semibold leading-[20.3px]">An email arrives in your demo mailbox</T>
          </Rule>
          <Rule label="IF" color={palette.navy.DEFAULT}>
            <T className="text-14 font-semibold leading-[20.3px]">It’s a routine meeting request</T>
          </Rule>
          <Rule label="THEN" color={palette.mint.ink}>
            <View className="gap-6">
              <T className="text-14 font-semibold leading-[20.3px]">Prepare a reply draft in your tone</T>
              <View className="flex-row flex-wrap gap-6">
                <Pill text="Runs without asking" fg={palette.success.ink} bg={palette.success.bg} />
                <Pill text="Sending needs your OK" fg={palette.warning.ink} bg={palette.warning.bg} />
              </View>
            </View>
          </Rule>
          <Rule label="APP" color={palette.ink.label}>
            <T className="text-14 font-semibold leading-[20.3px]">Demo mailbox · sample data</T>
          </Rule>
        </Rows>
      </Glass>

      <View className="gap-10">
        <T className="text-15 font-bold">MIRA will need to</T>
        <View className="gap-8">
          {PERMS.map((p, i) => (
            <Tap
              key={p.label}
              label={p.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on[i] }}
              onPress={() => setOn(on.map((v, j) => (j === i ? !v : v)))}
              className={`min-h-60 flex-row items-center gap-12 rounded-16 bg-white/60 px-14 py-10 ${
                on[i] ? 'border-[1.5px] border-peri-300' : 'border border-white/80'
              }`}
            >
              <CheckBox on={on[i]} size={24} radius={8} />
              <View className="flex-1 gap-2">
                <T className="text-14 font-bold">{p.label}</T>
                <T className="text-12 text-ink-2">{p.hint}</T>
              </View>
            </Tap>
          ))}
        </View>
      </View>

      <View className="flex-row items-start gap-10 rounded-18 border border-warning-line bg-warning-panel p-14">
        <View className="mt-1">
          <Icon name="info" size={18} color={palette.warning.ink} />
        </View>
        <View className="flex-1 gap-4">
          <T className="text-13 font-bold leading-[18.85px] text-warning-text">Limitations</T>
          <T className="text-13 leading-[18.85px] text-warning-text">New emails arrive only while online.</T>
        </View>
      </View>

      {active ? (
        <Glass className="items-center gap-12 rounded-22 p-20">
          <Pop className="h-56 w-56 items-center justify-center rounded-full bg-success-bg">
            <Icon name="check" size={28} strokeWidth={2.6} color={palette.success.ink} />
          </Pop>
          <T className="text-17 font-bold">Automation active</T>
          <PrimaryButton
            label="Go to My Automations"
            onPress={() => go('Automations')}
            height={52}
            radius={16}
            textClassName="text-15"
            style={{}}
            className="w-full"
          />
        </Glass>
      ) : (
        <View className="gap-10">
          <Tap
            label="Approve & Activate"
            disabled={!all}
            accessibilityState={{ disabled: !all }}
            onPress={() => setActive(true)}
            className={`h-56 items-center justify-center rounded-18 ${all ? '' : 'bg-peri-disabled'}`}
            style={all ? [fx.primary, fx.liftLg] : undefined}
          >
            <T className="text-16 font-bold text-white">Approve & Activate</T>
          </Tap>
          {!all ? <T className="text-center text-12 text-ink-muted">Tick each permission to continue.</T> : null}
          <SecondaryButton label="Edit rule" onPress={() => go('AutomationBuilder')} height={50} radius={16} />
        </View>
      )}
    </Screen>
  );
}
