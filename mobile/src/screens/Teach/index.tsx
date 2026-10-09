/** Board 07-teach-mira. */
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon, type IconName } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Glass, IconTile, Rows, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';
import { useDisplayName } from '../../theme/prefs';

function SectionHead({ title, link, to }: { title: string; link?: string; to?: Board }) {
  const go = useGo();
  return (
    <View className="flex-row items-center justify-between">
      <T accessibilityRole="header" className="text-18 font-bold">{title}</T>
      {link && to ? (
        <Tap label={link} onPress={() => go(to)} className="py-10">
          <T className="text-13 font-bold text-navy">{link}</T>
        </Tap>
      ) : null}
    </View>
  );
}

function Way({ icon, fg, bg, title, desc, to }: { icon: IconName; fg: string; bg: string; title: string; desc: string; to: Board }) {
  const go = useGo();
  return (
    <Tap label={title} onPress={() => go(to)} glass="glass2" className="flex-row items-start gap-14 rounded-22 p-16">
      <IconTile name={icon} size={44} radius={15} iconSize={22} fg={fg} bg={bg} />
      <View className="flex-1 gap-4">
        <T className="text-15 font-bold">{title}</T>
        <T className="text-13 leading-[18.85px] text-ink-2">{desc}</T>
      </View>
      <View className="mt-12">
        <Icon name="chevronRight" size={18} color={palette.ink.muted} />
      </View>
    </Tap>
  );
}

function Automation({ icon, fg, bg, title, sub }: { icon: IconName; fg: string; bg: string; title: string; sub: string }) {
  const go = useGo();
  return (
    <Tap label={title} onPress={() => go('Automations')} className="flex-row items-center gap-12 py-12">
      <IconTile name={icon} size={36} radius={12} iconSize={18} fg={fg} bg={bg} />
      <View className="flex-1 gap-2">
        <T className="text-14 font-bold">{title}</T>
        <T className="text-12 text-ink-muted">{sub}</T>
      </View>
      <View className="rounded-full bg-success-bg px-8 py-4">
        <T className="text-11 font-bold text-success-ink">Active</T>
      </View>
    </Tap>
  );
}

function Learned({ color, title, sub, last }: { color: string; title: string; sub: string; last?: boolean }) {
  return (
    <View className="flex-row gap-12">
      <View className="items-center">
        <View className="mt-4 h-12 w-12 rounded-full" style={{ backgroundColor: color }} />
        {last ? null : <View className="w-2 flex-1 bg-peri-150" />}
      </View>
      <View className={`flex-1 gap-2 ${last ? '' : 'pb-16'}`}>
        <T className="text-14 font-bold">{title}</T>
        <T className="text-12 text-ink-muted">{sub}</T>
      </View>
    </View>
  );
}

export default function TeachScreen() {
  const go = useGo();
  const name = useDisplayName();
  const prefs: [string, string][] = [
    ['Friendly, concise emails', palette.peri[600]],
    ['Short replies', palette.peri[600]],
    ['Meetings after 10 AM', palette.mint.DEFAULT],
    ['Morning brief at 7:30', palette.mint.DEFAULT],
    [`Call me ${name}`, palette.warning.DEFAULT],
  ];

  return (
    <Screen gap={24} tab="Teach">
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Teach MIRA</T>
        <T className="text-15 text-ink-2">Show MIRA how you want things done.</T>
      </View>

      <View className="gap-18 overflow-hidden rounded-28 bg-ink px-20 pb-20 pt-22" style={fx.darkCard}>
        <View className="absolute h-260 w-260 rounded-full" style={[fx.glowPeri, { right: -70, top: -80 }]} />
        <View className="absolute h-220 w-220 rounded-full" style={[fx.glowMint, { left: -60, bottom: -90 }]} />
        <View className="flex-row items-center gap-16">
          <Companion size={72} theme="dark" />
          <T className="flex-1 text-19 font-bold leading-[24.7px] text-white">MIRA has learned 5 things from you</T>
        </View>
        <View accessibilityLabel="How teaching works" className="flex-row gap-8">
          {[
            ['1', 'You tell or show', palette.peri[400]],
            ['2', 'MIRA interprets', palette.peri[400]],
            ['3', 'You approve', palette.mint.DEFAULT],
          ].map(([n, label, color]) => (
            <View key={n} className="flex-1 gap-6 rounded-16 border border-white/12 bg-white/8 p-10">
              <View className="h-22 w-22 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                <T className="text-12 font-bold">{n}</T>
              </View>
              <T className="text-12 font-bold leading-[15.6px] text-white">{label}</T>
            </View>
          ))}
        </View>
        <Tap
          label="Teach something new"
          onPress={() => go('TeachInstruction')}
          className="h-54 flex-row items-center justify-center gap-8 rounded-18 bg-white/60"
        >
          <Icon name="plus" size={18} strokeWidth={2.4} color={palette.navy.DEFAULT} />
          <T className="text-15 font-bold">Teach something new</T>
        </Tap>
      </View>

      <View className="gap-12">
        <SectionHead title="Three ways to teach" />
        <Way
          icon="chat" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} title="Teach by instruction" to="TeachInstruction"
          desc="“Always write professional emails using a friendly and concise tone.”"
        />
        <Way
          icon="example" fg={palette.mint.ink} bg={palette.mint.bg} title="Teach by example" to="TeachExample"
          desc="Show a sample and your ideal reply."
        />
        <Way
          icon="refresh" fg={palette.warning.ink} bg={palette.warning.bg} title="Teach a routine" to="AutomationBuilder"
          desc="“Every Sunday evening, remind me to plan my week.”"
        />
      </View>

      <View className="gap-12">
        <SectionHead title="Learned preferences" link="Manage" to="Memory" />
        <View className="flex-row flex-wrap gap-8">
          {prefs.map(([label, color]) => (
            <Tap key={label} label={label} onPress={() => go('Memory')} glass="glass2" className="h-38 flex-row items-center gap-6 rounded-12 px-12">
              <View className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
              <T className="text-13 font-semibold">{label}</T>
            </Tap>
          ))}
        </View>
      </View>

      <View className="gap-12">
        <SectionHead title="Approved automations" link="See all" to="Automations" />
        <Glass className="rounded-22 px-16 py-4">
          <Rows>
            <Automation icon="mail" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} title="Draft routine email replies" sub="Ran 14 times · drafts only" />
            <Automation icon="sun" fg={palette.warning.ink} bg={palette.warning.bg} title="Daily morning planning" sub="Every day 7:30 AM" />
            <Automation icon="clock" fg={palette.error.ink} bg={palette.error.bg} title="Deadline reminder" sub="1 day before due dates" />
          </Rows>
        </Glass>
      </View>

      <View className="gap-12">
        <SectionHead title="Pending suggestions" />
        <View className="gap-12 rounded-22 border-[1.5px] border-dashed border-peri-300 bg-white/60 p-16">
          <View className="flex-row items-start gap-12">
            <IconTile name="bolt" size={36} radius={12} iconSize={18} fg={palette.navy.DEFAULT} bg={palette.peri.tonal} />
            <View className="flex-1 flex-row flex-wrap items-center gap-6">
              <T className="text-14 font-bold">Sunday week planning</T>
              <View className="rounded-full bg-peri-tonal px-7 py-3">
                <T className="text-10 font-bold tracking-[0.4px] text-navy">SUGGESTED</T>
              </View>
            </View>
          </View>
          <View className="flex-row gap-8 pl-48">
            <Tap label="Review" onPress={() => go('AutomationReview')} className="h-38 justify-center rounded-12 bg-navy px-14">
              <T className="text-13 font-bold text-white">Review</T>
            </Tap>
            <Tap label="Dismiss" onPress={() => go('Approvals')} className="h-38 justify-center rounded-12 border border-white/80 px-14">
              <T className="text-13 font-bold">Dismiss</T>
            </Tap>
          </View>
        </View>
      </View>

      <View className="gap-12">
        <SectionHead title="Recent learning" />
        <View>
          <Learned color={palette.navy.DEFAULT} title="Saved “Short replies”" sub="Taught by instruction · Today 8:20 AM" />
          <Learned color={palette.mint.DEFAULT} title="Activated “Deadline reminder”" sub="You approved · Wed 7 Oct" />
          <Learned color={palette.warning.DEFAULT} title="Learned “Meetings after 10 AM”" sub="From an example you approved · Mon 5 Oct" last />
        </View>
      </View>
    </Screen>
  );
}
