/** Board 13-inbox. */
import { Fragment, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { D, Icon, type IconName } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Chip, FilterPills, IconTile, SearchField, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Cat = 'all' | 'priority' | 'reply' | 'drafts' | 'handled';

const EMAILS = [
  { id: 'e1', from: 'Maya Chen', subject: 'Can we reschedule our meeting?', preview: 'Hi Alex, something came up on Thursday. Could we move our 1:1 to early next week?', time: '8:42 AM', unread: true, high: true, label: 'Needs reply', cats: ['priority', 'reply'], fresh: true, avBg: palette.error.bg, avFg: palette.error.ink },
  { id: 'e2', from: 'Priya Nair', subject: 'Q3 report: final numbers', preview: 'Attached the final revenue table. Can you fold it into the report before tomorrow?', time: '8:15 AM', unread: true, high: true, label: 'Deadline tomorrow', cats: ['priority'], fresh: true, avBg: palette.mint.bg, avFg: palette.mint.ink },
  { id: 'e3', from: 'Sam Rivera', subject: 'Dinner Saturday?', preview: 'Are we still on for 7:30? I can book the Thai place on Elm.', time: 'Yesterday', unread: false, high: false, label: 'Draft saved', cats: ['reply', 'drafts'], fresh: false, avBg: palette.warning.bg, avFg: palette.warning.ink },
  { id: 'e4', from: 'Jordan Lee', subject: 'Weekly sync notes', preview: 'Notes from today’s sync, plus the three action items we agreed on.', time: 'Yesterday', unread: false, high: false, label: 'Summarized', cats: ['handled'], fresh: false, avBg: palette.peri.tonal, avFg: palette.navy.DEFAULT },
  { id: 'e5', from: 'City Utilities', subject: 'Your October bill is ready', preview: 'Your bill of $64.20 is due on 20 October.', time: 'Yesterday', unread: false, high: false, label: 'Task created', cats: ['handled'], fresh: false, avBg: 'rgba(255,255,255,0.6)', avFg: palette.ink.label },
  { id: 'e6', from: 'Lumen Design Weekly', subject: '5 patterns for calmer interfaces', preview: 'This week: progressive disclosure, quiet defaults, and more.', time: 'Mon', unread: false, high: false, label: 'Newsletter', cats: [], fresh: false, avBg: 'rgba(255,255,255,0.6)', avFg: palette.ink.label },
];

const TABS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'priority', label: 'Priority' },
  { id: 'reply', label: 'Needs Reply' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'handled', label: 'Handled by MIRA' },
];

const ACTIONS: { label: string; icon: IconName; to: Board }[] = [
  { label: 'Summarize', icon: 'lines', to: 'EmailDetail' },
  { label: 'Draft reply', icon: 'pencil', to: 'EmailDetail' },
  { label: 'Remind me', icon: 'bell', to: 'Tasks' },
  { label: 'Create task', icon: 'checkCircle', to: 'Tasks' },
];

const matches = (e: (typeof EMAILS)[number], cat: Cat) => cat === 'all' || e.cats.includes(cat);

export default function InboxScreen() {
  const go = useGo();
  const [tab, setTab] = useState<Cat>('all');
  const [open, setOpen] = useState<string | null>('e1');
  const list = EMAILS.filter((e) => matches(e, tab));

  return (
    <Screen tab="Inbox">
      <View className="flex-row items-center justify-between">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Inbox</T>
        <Tap label="Compose" onPress={() => go('EmailDetail')} glass="glass2" className="h-44 w-44 items-center justify-center rounded-14">
          <Icon name="pencil" size={20} color={palette.navy.DEFAULT} />
        </Tap>
      </View>

      <Tap label="Demo mailbox, synced 8:45 AM" onPress={() => go('ConnectedApps')} glass="glass2" className="flex-row items-center gap-10 rounded-16 px-12 py-10">
        <IconTile name="mail" size={32} radius={10} iconSize={17} fg={palette.ink.label} bg="rgba(255,255,255,0.6)" />
        <View className="min-w-0 flex-1 gap-1">
          <T className="text-13 font-bold">Demo mailbox</T>
          <T className="text-12 text-ink-muted">Synced 8:45 AM</T>
        </View>
        <Chip label="Demo" fg={palette.warning.ink} bg={palette.warning.bg} />
      </Tap>

      <SearchField label="Search emails" placeholder="Search mail" />

      <FilterPills<Cat>
        label="Categories"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ ...t, count: EMAILS.filter((e) => matches(e, t.id)).length }))}
      />

      <View className="gap-10">
        {list.map((e, i) => {
          const showDivider = i === 0 || list[i - 1].fresh !== e.fresh;
          const isOpen = open === e.id;
          return (
            <Fragment key={e.id}>
              {showDivider ? (
                <View className="flex-row items-center gap-8 px-2 pt-6">
                  <Icon d={e.fresh ? D.refresh : D.phoneOutline} size={14} strokeWidth={2.2} color={palette.ink.label} />
                  <T className="text-12 font-bold text-ink-label">{e.fresh ? 'New' : 'Earlier · saved offline'}</T>
                </View>
              ) : null}
              <View
                className={`gap-10 rounded-20 border bg-white/46 p-14 ${e.unread ? 'border-peri-200' : 'border-white/80'}`}
                style={fx.glass2}
              >
                <Tap label={`${e.from}: ${e.subject}`} onPress={() => go('EmailDetail')} className="flex-row gap-12">
                  <View className="h-40 w-40 shrink-0 items-center justify-center rounded-14" style={{ backgroundColor: e.avBg }}>
                    <T className="text-15 font-bold" style={{ color: e.avFg }}>
                      {e.from[0]}
                    </T>
                    {e.unread ? (
                      <View accessibilityLabel="Unread" className="absolute -left-4 -top-4 h-11 w-11 rounded-full border-2 border-white bg-navy" />
                    ) : null}
                  </View>
                  <View className="min-w-0 flex-1 gap-2">
                    <View className="flex-row justify-between gap-8">
                      <T numberOfLines={1} className={`shrink text-14 ${e.unread ? 'font-bold' : 'font-semibold'}`}>
                        {e.from}
                      </T>
                      <T className="text-12 text-ink-muted">{e.time}</T>
                    </View>
                    <T numberOfLines={1} className={`text-14 ${e.unread ? 'font-bold' : 'font-semibold'}`}>
                      {e.subject}
                    </T>
                    <T numberOfLines={1} className="text-13 leading-[18.2px] text-ink-2">
                      {e.preview}
                    </T>
                  </View>
                </Tap>
                <View className="flex-row flex-wrap items-center gap-6 pl-52">
                  {e.high ? <Chip label="Priority" icon="arrowUp" fg={palette.error.ink} bg={palette.error.bg} /> : null}
                  <View className="flex-row items-center gap-5 rounded-full bg-peri-tonal px-8 py-4">
                    <View className="h-8 w-8 rounded-full" style={fx.labelDot} />
                    <T className="text-11 font-bold text-navy">{e.label}</T>
                  </View>
                  <View className="flex-1" />
                  <Tap
                    label="MIRA actions for this email"
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() => setOpen(isOpen ? null : e.id)}
                    className="h-32 flex-row items-center gap-4 rounded-10 border border-white/80 bg-white/60 px-10"
                  >
                    <T className="text-12 font-bold text-navy">Actions</T>
                    <Icon d={isOpen ? D.chevronUp : D.chevronDown} size={12} strokeWidth={2.6} color={palette.navy.DEFAULT} />
                  </Tap>
                </View>
                {isOpen ? (
                  <View className="flex-row flex-wrap gap-8 pt-2">
                    {ACTIONS.map((a) => (
                      <Tap
                        key={a.label}
                        label={a.label}
                        onPress={() => go(a.to)}
                        className="h-40 flex-row items-center justify-center gap-6 rounded-12 bg-white/55"
                        style={{ width: '48.5%' }}
                      >
                        <Icon name={a.icon} size={15} color={palette.navy.DEFAULT} />
                        <T className="text-13 font-bold">{a.label}</T>
                      </Tap>
                    ))}
                  </View>
                ) : null}
              </View>
            </Fragment>
          );
        })}
        {list.length === 0 ? (
          <View className="items-center gap-8 rounded-20 border border-dashed border-peri-200 bg-white/60 px-20 py-28">
            <Companion size={44} />
            <T className="text-15 font-bold">Nothing here right now</T>
            <T className="text-center text-13 text-ink-2">MIRA will place matching emails here as they arrive.</T>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
