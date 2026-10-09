/** Boards 05-home and 05b-home-dark (dark when Settings > Appearance is Dark). */
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon, type IconName } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useTabBarBottom } from '../../components/TabBar';
import { Glass, IconTile, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';
import { useDisplayName, usePrefs } from '../../theme/prefs';

const { dk } = palette;

/** Colours that change between the light and dark boards. */
function useTheme(dark: boolean) {
  return {
    dark,
    glass: dark ? ('dark' as const) : ('glass' as const),
    text: dark ? 'text-dk-text' : 'text-ink',
    textValue: dark ? dk.text : palette.ink.DEFAULT,
    sub: dark ? 'text-dk-text3' : 'text-ink-2',
    tileIcon: dark ? dk.text3 : palette.ink[2],
    mini: dark ? 'bg-white/10' : 'bg-white/85',
    miniSub: dark ? 'text-dk-muted' : 'text-ink-muted',
    iconTile: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
    pill: dark ? 'bg-dk-chip' : 'bg-ink',
    pillText: dark ? 'text-dk-bg' : 'text-white',
    primary: dark ? fx.primaryDark : fx.primary,
    divider: dark ? 'border-white/8' : 'border-ink/8',
    muted: dark ? 'text-dk-muted' : 'text-ink-muted',
  };
}
type Theme = ReturnType<typeof useTheme>;

function Overview({ t, title, value, line1, line2, icon, to, approvals }: {
  t: Theme; title: string; value: string; line1: string; line2: string; icon: ReactNode; to: Board; approvals?: boolean;
}) {
  const go = useGo();
  const tint = approvals
    ? {
        className: `min-h-170 flex-1 gap-6 rounded-26 border p-14 ${t.dark ? 'border-white/14' : 'border-white/85'}`,
        style: [t.dark ? fx.approvalsTileDark : fx.approvalsTile, t.dark ? fx.glassDark : fx.glass],
      }
    : null;
  return (
    <Tap
      label={`${title}, ${value}`}
      onPress={() => go(to)}
      glass={tint ? undefined : t.glass}
      className={tint ? tint.className : 'min-h-170 flex-1 gap-6 rounded-26 p-14'}
      style={tint?.style}
    >
      <View className="flex-row items-start justify-between">
        <T className={`text-15 font-semibold leading-[18.75px] ${t.text}`}>{title}</T>
        {icon}
      </View>
      <T className={`text-30 font-semibold tracking-[-0.9px] ${t.text}`}>{value}</T>
      <View className={`mt-auto rounded-14 px-10 py-9 ${t.mini}`} style={fx.tile}>
        <T className={`text-12 leading-[16.2px] ${t.text}`}>{line1}</T>
        <T className={`text-12 leading-[16.2px] ${t.miniSub}`}>{line2}</T>
      </View>
    </Tap>
  );
}

function Suggestion({ t, icon, color, title, action, to, onDismiss }: {
  t: Theme; icon: IconName; color: string; title: string; action: string; to: Board; onDismiss?(): void;
}) {
  const go = useGo();
  return (
    <Glass kind={t.glass} className="flex-row items-center gap-12 rounded-22 py-10 pl-12 pr-10">
      <IconTile name={icon} size={36} radius={12} iconSize={17} fg={color} bg={t.iconTile} />
      <T className={`min-w-0 flex-1 text-14 font-semibold ${t.text}`}>{title}</T>
      {onDismiss ? (
        <Tap
          label="Not now"
          onPress={onDismiss}
          className={`h-36 w-36 items-center justify-center rounded-full ${t.dark ? 'bg-white/10' : 'bg-white/70'}`}
        >
          <Icon name="x" size={14} strokeWidth={2.4} color={t.dark ? dk.label : palette.ink.label} />
        </Tap>
      ) : null}
      <Tap label={action} onPress={() => go(to)} className={`h-36 justify-center rounded-full px-14 ${t.pill}`}>
        <T className={`text-13 font-semibold ${t.pillText}`}>{action}</T>
      </Tap>
    </Glass>
  );
}

function QuickAction({ t, icon, label, to, primary }: { t: Theme; icon: IconName; label: string; to: Board; primary?: boolean }) {
  const go = useGo();
  return (
    <Tap label={label} onPress={() => go(to)} className="flex-1 items-center gap-8">
      {primary ? (
        <View className="h-58 w-58 items-center justify-center rounded-full" style={[t.primary, fx.liftMd]}>
          <Icon name={icon} size={22} strokeWidth={1.9} color={palette.white} />
        </View>
      ) : (
        <Glass kind={t.glass} className="h-58 w-58 items-center justify-center rounded-full">
          <Icon name={icon} size={22} strokeWidth={1.9} color={t.textValue} />
        </Glass>
      )}
      <T className={`text-center text-12 font-medium ${t.text}`}>{label}</T>
    </Tap>
  );
}

function ActivityRow({ t, title, time, done }: { t: Theme; title: string; time: string; done: boolean }) {
  const fg = done ? (t.dark ? dk.success : palette.success.ink) : t.dark ? dk.label : palette.ink.label;
  const bg = done ? (t.dark ? dk.successBg : palette.success.bg) : t.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)';
  return (
    <View className="flex-row items-center gap-12 py-12">
      <View className="h-34 w-34 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
        <Icon name={done ? 'check' : 'clock'} size={16} strokeWidth={done ? 2.4 : 2} color={fg} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <T className={`text-14 font-semibold ${t.text}`}>{title}</T>
        <T className={`text-12 ${t.muted}`}>{time}</T>
      </View>
      <T className="text-11 font-semibold" style={{ color: fg }}>
        {done ? 'Completed' : 'Queued'}
      </T>
    </View>
  );
}

export default function HomeScreen() {
  const go = useGo();
  const name = useDisplayName();
  const t = useTheme(usePrefs().isDark);
  const [showAuto, setShowAuto] = useState(true);
  const tabBottom = useTabBarBottom();

  const askBar = (
    <Tap
      label="Ask MIRA anything"
      onPress={() => go('Assistant')}
      className={`absolute left-18 right-18 h-60 flex-row items-center gap-10 rounded-full border px-8 ${
        t.dark ? 'border-white/14 bg-white/8' : 'border-white/80 bg-white/60'
      }`}
      style={[t.dark ? fx.glassDark : fx.glass, { bottom: tabBottom + 78 }]}
    >
      <View className={`h-44 w-44 items-center justify-center rounded-full ${t.dark ? 'bg-white/10' : 'bg-white/85'}`}>
        <Icon name="plus" size={20} color={t.textValue} />
      </View>
      <T className={`flex-1 text-15 ${t.dark ? 'text-dk-muted' : 'text-ink-muted'}`}>Ask MIRA anything…</T>
      <View className="h-44 w-44 items-center justify-center">
        <Icon name="mic" size={20} strokeWidth={1.9} color={t.textValue} />
      </View>
    </Tap>
  );

  return (
    <Screen top={56} px={18} gap={22} bottom={190} tab="Home" dark={t.dark} overlay={askBar}>
      <View className="gap-14">
        <View className="flex-row justify-end gap-8">
          <Tap
            label="Offline ready"
            onPress={() => go('OfflineSync')}
            glass={t.glass}
            className="h-44 flex-row items-center gap-6 rounded-full px-14"
          >
            <View className="h-8 w-8 rounded-full bg-success" />
            <T className={`text-13 font-semibold ${t.dark ? 'text-dk-mint' : 'text-mint-ink'}`}>Offline ready</T>
          </Tap>
          <Tap
            label="Notifications, 3 unread"
            onPress={() => go('Notifications')}
            glass={t.glass}
            className="h-44 w-44 items-center justify-center rounded-full"
          >
            <Icon name="bell" size={20} strokeWidth={1.9} color={t.textValue} />
            <View
              className="absolute right-11 top-10 h-8 w-8 rounded-full border-2 bg-error"
              style={{ borderColor: t.dark ? dk.raised : palette.silk.ring }}
            />
          </Tap>
        </View>
        <View accessibilityRole="header" className="gap-2">
          <View className="flex-row flex-wrap items-center gap-10">
            <T className={`text-30 font-semibold tracking-[-0.9px] ${t.text}`}>Good morning,</T>
            <Tap
              label="Profile"
              onPress={() => go('Profile')}
              className="h-34 w-34 items-center justify-center rounded-full"
              style={[fx.avatarFill, t.dark ? fx.avatarDark : fx.avatar]}
            >
              <T className="text-15 font-bold text-navy">{name[0].toUpperCase()}</T>
            </Tap>
            <T className={`text-30 font-semibold tracking-[-0.9px] ${t.text}`}>{name}</T>
          </View>
          <T className={`text-30 font-light tracking-[-0.9px] ${t.dark ? 'text-dk-text2' : 'text-ink-soft'}`}>
            Here’s what matters today
          </T>
        </View>
      </View>

      <Glass kind={t.glass} accessibilityLabel="MIRA" className="gap-14 rounded-30 p-18">
        <View className="flex-row items-center gap-14">
          <Companion size={56} theme={t.dark ? 'dark' : 'light'} />
          <View className="flex-1 gap-3">
            <T className={`text-17 font-semibold leading-[22px] ${t.text}`}>I’m here whenever you need me.</T>
            <T className={`text-13 ${t.sub}`}>Free after 2 PM. Good time for the Q3 report.</T>
          </View>
        </View>
        <View className="flex-row gap-8">
          <Tap
            label="Ask MIRA"
            onPress={() => go('Assistant')}
            className="h-50 flex-1 items-center justify-center rounded-full"
            style={[t.primary, fx.liftMd]}
          >
            <T className="text-15 font-semibold text-white">Ask MIRA</T>
          </Tap>
          <Tap
            label="Teach"
            onPress={() => go('Teach')}
            className={`h-50 justify-center rounded-full border px-18 ${
              t.dark ? 'border-white/14 bg-white/10' : 'border-white/90 bg-white/70'
            }`}
          >
            <T className={`text-15 font-semibold ${t.text}`}>Teach</T>
          </Tap>
        </View>
      </Glass>

      <View accessibilityLabel="Today’s overview" className="gap-10">
        <View className="flex-row gap-10">
          <Overview
            t={t} title="Tasks" value="3" line1="Reply to Sam" line2="Today · 6:00 PM" to="Tasks"
            icon={<Icon name="checkCircle" size={16} color={t.tileIcon} />}
          />
          <Overview
            t={t} title="Next up" value="14:00" line1="+1 more event" line2="Stand-up · 9:30" to="Calendar"
            icon={
              <IconTile
                name="calendarSmall" size={22} radius={7} iconSize={13} strokeWidth={2.2}
                fg={t.dark ? dk.mint : palette.mint.ink} bg={t.dark ? dk.mintBg : palette.mint.bg}
              />
            }
          />
        </View>
        <View className="flex-row gap-10">
          <Overview
            t={t} title="Emails" value="3" line1="Maya Chen" line2="Can we reschedule?" to="Inbox"
            icon={<Icon name="mail" size={16} color={t.tileIcon} />}
          />
          <Overview
            t={t} approvals title="Approvals" value="4" line1="Reply to Maya" line2="Ready to send" to="Approvals"
            icon={<Icon name="shield" size={16} color={t.dark ? dk.warning : palette.warning.ink} />}
          />
        </View>
      </View>

      <View className="gap-8">
        <View className="flex-row items-center gap-8 px-4">
          <T accessibilityRole="header" className={`text-17 font-semibold ${t.text}`}>Smart suggestions</T>
        </View>
        <Suggestion
          t={t} icon="clock" color={t.dark ? dk.warning : palette.warning.ink}
          title="2 deadlines tomorrow" action="View" to="Tasks"
        />
        <Suggestion
          t={t} icon="mail" color={t.dark ? dk.accent : palette.navy.DEFAULT}
          title="Maya may need a reply" action="Draft" to="EmailDetail"
        />
        {showAuto ? (
          <Suggestion
            t={t} icon="bolt" color={t.dark ? dk.mint : palette.mint.ink}
            title="Automate Sunday planning?" action="Set up" to="AutomationBuilder"
            onDismiss={() => setShowAuto(false)}
          />
        ) : null}
      </View>

      <View className="gap-10">
        <T accessibilityRole="header" className={`px-4 text-17 font-semibold ${t.text}`}>Quick actions</T>
        <View className="flex-row gap-8">
          <QuickAction t={t} primary icon="bulb" label="Teach MIRA" to="Teach" />
          <QuickAction t={t} icon="pencil" label="Draft email" to="EmailDetail" />
          <QuickAction t={t} icon="bell" label="Add reminder" to="Tasks" />
          <QuickAction t={t} icon="bolt" label="Automation" to="AutomationBuilder" />
        </View>
      </View>

      <View className="gap-10">
        <View className="flex-row items-center justify-between px-4">
          <T accessibilityRole="header" className={`text-17 font-semibold ${t.text}`}>Recent activity</T>
          <Tap label="See all" onPress={() => go('Activity')} className="py-10">
            <T className="text-13 font-semibold text-navy">See all</T>
          </Tap>
        </View>
        <Glass kind={t.glass} className="rounded-26 px-14 py-4">
          <View className={`border-b ${t.divider}`}>
            <ActivityRow t={t} title="Drafted reply to Jordan Lee" time="8:50 AM" done />
          </View>
          <View className={`border-b ${t.divider}`}>
            <ActivityRow t={t} title="Created reminder: Submit Q3 report" time="8:31 AM" done />
          </View>
          <ActivityRow t={t} title="Send reply to Sam Rivera" time="When online" done={false} />
        </Glass>
      </View>
    </Screen>
  );
}
