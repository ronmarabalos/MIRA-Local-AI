/** Board 22-notifications. */
import { useState } from 'react';
import { View } from 'react-native';

import { D, Icon } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, FilterPills, IconTile, Tap } from '../../components/ui';
import palette from '../../theme/palette';

const KINDS: Record<string, [string, string, string]> = {
  'Pending Approvals': [D.shield, palette.warning.bg, palette.warning.ink],
  Reminders: [D.bell, palette.peri.tonal, palette.navy.DEFAULT],
  Emails: [D.mail, 'rgba(255,255,255,0.55)', palette.navy.DEFAULT],
  'Automation Activities': [D.bolt, palette.mint.bg, palette.mint.ink],
  'System Updates': [D.info, 'rgba(255,255,255,0.6)', palette.ink.label],
};

const ITEMS: { cat: string; text: string; time: string; unread: boolean; to: Board }[] = [
  { cat: 'Pending Approvals', text: 'Your reply to Maya Chen is ready for your OK.', time: '8:44 AM', unread: true, to: 'Approvals' },
  { cat: 'Reminders', text: 'Call Mom at 8:00 PM tonight.', time: '8:00 AM', unread: true, to: 'Tasks' },
  { cat: 'Emails', text: 'Priya Nair: “Q3 report: final numbers”', time: '8:15 AM', unread: true, to: 'Inbox' },
  { cat: 'Automation Activities', text: 'Draft routine email replies prepared 1 draft.', time: '8:50 AM', unread: false, to: 'Automations' },
  { cat: 'System Updates', text: 'Calendar refresh failed. MIRA will retry when you’re online.', time: '9:12 AM', unread: false, to: 'OfflineSync' },
  { cat: 'Automation Activities', text: 'MIRA suggests a new automation: Sunday week planning.', time: '7:31 AM', unread: false, to: 'Teach' },
  { cat: 'System Updates', text: 'Your on-device model is up to date.', time: 'Yesterday', unread: false, to: 'Settings' },
];

const CATS = ['All', 'Reminders', 'Emails', 'Automation Activities', 'Pending Approvals', 'System Updates'];

export default function NotificationsScreen() {
  const go = useGo();
  const [cat, setCat] = useState('All');
  const [allRead, setAllRead] = useState(false);
  const visible = ITEMS.filter((n) => cat === 'All' || n.cat === cat);
  const unreadN = allRead ? 0 : ITEMS.filter((n) => n.unread).length;

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton to="Home" label="Back to Home" />
        <View className="flex-row gap-8">
          <Tap label="Mark all read" onPress={() => setAllRead(true)} className="h-44 justify-center rounded-14 border border-white/80 bg-white/60 px-12">
            <T className="text-13 font-bold text-navy">Mark all read</T>
          </Tap>
          <Tap label="Notification preferences" onPress={() => go('Settings')} glass="glass2" className="h-44 w-44 items-center justify-center rounded-14">
            <Icon name="sliders" size={20} />
          </Tap>
        </View>
      </View>
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Notifications</T>
        <T className="text-15 text-ink-2">{unreadN ? `${unreadN} unread` : 'You’re all caught up.'}</T>
      </View>
      <FilterPills label="Categories" value={cat} onChange={setCat} items={CATS.map((c) => ({ id: c, label: c }))} />
      <View className="gap-8">
        {visible.map((n) => {
          const unread = n.unread && !allRead;
          const [icon, bg, fg] = KINDS[n.cat];
          return (
            <Tap
              key={n.text}
              label={`${n.cat}: ${n.text}`}
              onPress={() => go(n.to)}
              className={`flex-row items-start gap-12 rounded-18 border p-14 ${unread ? 'border-peri-200 bg-white' : 'border-white/80 bg-white/50'}`}
            >
              <IconTile d={icon} size={40} radius={13} iconSize={19} fg={fg} bg={bg} />
              <View className="min-w-0 flex-1 gap-3">
                <View className="flex-row justify-between gap-8">
                  <T className="shrink text-11 font-bold tracking-[0.66px] text-ink-label">{n.cat.toUpperCase()}</T>
                  <T className="text-12 text-ink-muted">{n.time}</T>
                </View>
                <T className={`text-14 leading-[19.6px] ${unread ? 'font-bold' : 'font-medium'}`}>{n.text}</T>
              </View>
              {unread ? <View accessibilityLabel="Unread" className="mt-6 h-10 w-10 shrink-0 rounded-full bg-navy" /> : null}
            </Tap>
          );
        })}
      </View>
    </Screen>
  );
}
