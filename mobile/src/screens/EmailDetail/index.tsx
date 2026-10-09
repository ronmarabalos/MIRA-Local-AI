/** Board 14-email-and-ai-reply: the email, MIRA's summary, a draft, and the send sheet. */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Sheet } from '../../components/Overlay';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Chip, Field, Glass, IconTile, PrimaryButton, SecondaryButton, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';
import { useDisplayName } from '../../theme/prefs';

type Phase = 'idle' | 'working' | 'draft';
type Status = 'draft' | 'saved' | 'queued' | 'sent';

const TONES = ['Friendly', 'Formal', 'Brief'];
const STATUS: Record<Status, [string, string, string]> = {
  draft: ['Not sent', palette.navy.DEFAULT, palette.peri.tonal],
  saved: ['Saved on device', palette.success.ink, palette.success.bg],
  queued: ['Queued', palette.ink.label, 'rgba(255,255,255,0.6)'],
  sent: ['Sent (demo)', palette.success.ink, palette.success.bg],
};

function draftText(tone: number, name: string): string {
  return [
    `Hi Maya,\n\nNo problem at all! Monday at 10:00 AM works well for me. Does that suit you?\n\nBest,\n${name}`,
    `Dear Maya,\n\nThank you for letting me know. I would be glad to move our meeting to Monday at 10:00 AM. Please let me know if that time is convenient.\n\nKind regards,\n${name}`,
    `Hi Maya, sure. Monday 10 AM? —${name}`,
  ][tone];
}

export default function EmailDetailScreen() {
  const go = useGo();
  const name = useDisplayName();
  const [phase, setPhase] = useState<Phase>('idle');
  const [tone, setTone] = useState(0);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [sheet, setSheet] = useState(false);
  const [offline, setOffline] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const work = (t: number) => {
    setPhase('working');
    timer.current = setTimeout(() => {
      setPhase('draft');
      setDraft(draftText(t, name));
      setTone(t);
      setStatus('draft');
    }, 900);
  };

  const [statusLabel, statusFg, statusBg] = STATUS[status];

  return (
    <Screen gap={18}>
      <View className="flex-row items-center justify-between">
        <BackButton to="Inbox" label="Back to Inbox" />
        <View className="flex-row items-center gap-8">
          <Tap
            label={`Demo: ${offline ? 'offline' : 'online'}`}
            accessibilityState={{ selected: offline }}
            onPress={() => setOffline(!offline)}
            className="h-36 flex-row items-center gap-6 rounded-full border border-dashed border-peri-300 bg-white/60 px-12"
          >
            <View className={`h-8 w-8 rounded-full ${offline ? 'bg-warning' : 'bg-success'}`} />
            <T className="text-12 font-bold text-ink-label">{`Demo: ${offline ? 'offline' : 'online'}`}</T>
          </Tap>
          <Tap label="Create task from email" onPress={() => go('Tasks')} glass="glass2" className="h-44 w-44 items-center justify-center rounded-14">
            <Icon name="checkCircle" size={20} />
          </Tap>
        </View>
      </View>

      <View className="gap-10">
        <T accessibilityRole="header" className="text-24 font-bold leading-[30px] tracking-[-0.24px]">
          Can we reschedule our meeting?
        </T>
        <View className="flex-row flex-wrap gap-6">
          <Chip label="Priority" fg={palette.error.ink} bg={palette.error.bg} />
          <Chip label="Needs reply" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} />
        </View>
      </View>

      <View className="flex-row items-center gap-12">
        <View className="h-44 w-44 items-center justify-center rounded-15 bg-error-bg">
          <T className="text-16 font-bold text-error-ink">M</T>
        </View>
        <View className="min-w-0 flex-1 gap-2">
          <T className="text-15 font-bold">Maya Chen</T>
          <T className="text-12 text-ink-muted">to you</T>
        </View>
        <T className="text-12 text-ink-muted">8:42 AM</T>
      </View>

      <View className="gap-8 rounded-20 border border-white/80 px-16 py-14" style={fx.summary}>
        <View className="flex-row items-center gap-8">
          <Companion size={24} />
          <T className="text-12 font-bold tracking-[0.72px] text-navy">MIRA SUMMARY</T>
        </View>
        <T className="text-14 leading-[21.7px] text-ink-deep">
          Maya can’t make Thursday’s 1:1 and wants to move it to early next week. She’s free Monday or Tuesday morning.
        </T>
      </View>

      <View className="gap-12">
        <T className="text-15 leading-[24.75px] text-ink-deep">{`Hi ${name},`}</T>
        <T className="text-15 leading-[24.75px] text-ink-deep">
          Something came up on Thursday and I won’t be able to make our 1:1. Could we move it to early next week? I’m free
          Monday or Tuesday morning. I’ve attached my availability.
        </T>
        <T className="text-15 leading-[24.75px] text-ink-deep">{'Thanks so much,\nMaya'}</T>
      </View>

      <Glass className="flex-row items-center gap-10 self-start rounded-14 px-12 py-10">
        <Icon name="file" size={18} color={palette.navy.DEFAULT} />
        <T className="text-13 font-bold">availability.ics</T>
        <T className="text-12 text-ink-muted">2 KB</T>
      </Glass>

      <Glass accessibilityLabel="MIRA reply assistant" className="gap-14 rounded-24 p-16" style={fx.panel08c}>
        {phase === 'idle' ? (
          <View className="gap-12">
            <View className="flex-row items-center gap-12">
              <Companion size={40} />
              <T className="text-15 font-bold">Reply to Maya?</T>
            </View>
            <PrimaryButton label="Generate reply" onPress={() => work(0)} height={50} radius={16} textClassName="text-15" style={fx.liftMdSoft} />
          </View>
        ) : phase === 'working' ? (
          <View className="h-76 flex-row items-center gap-12">
            <Companion size={40} mode="thinking" />
            <T className="text-14 font-semibold text-ink-body">Writing…</T>
          </View>
        ) : (
          <View className="gap-12">
            <View className="flex-row items-center justify-between">
              <T className="text-12 font-bold tracking-[0.72px] text-navy">DRAFT REPLY</T>
              <Chip label={statusLabel} fg={statusFg} bg={statusBg} textClassName="text-11 font-bold" />
            </View>
            <Field
              accessibilityLabel="Reply text"
              multiline
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                setStatus('draft');
              }}
              textAlignVertical="top"
              className="min-h-176 rounded-16 border border-white/80 bg-white/50 px-14 py-12 text-14 leading-[21.7px]"
            />
            <View className="flex-row flex-wrap gap-8">
              <Tap label="Regenerate" onPress={() => work(tone)} className="h-36 flex-row items-center gap-6 rounded-12 border border-white/80 bg-white/60 px-12">
                <Icon name="refresh" size={14} strokeWidth={2.2} />
                <T className="text-13 font-bold">Regenerate</T>
              </Tap>
              <Tap
                label={`Tone: ${TONES[tone]}`}
                onPress={() => work((tone + 1) % 3)}
                className="h-36 flex-row items-center rounded-12 border border-white/80 bg-white/60 px-12"
              >
                <T className="text-13 font-bold">
                  Tone: <T className="text-13 font-bold text-navy">{TONES[tone]}</T>
                </T>
              </Tap>
            </View>
            <View className="flex-row gap-8">
              <SecondaryButton label="Save draft" onPress={() => setStatus('saved')} height={50} radius={16} className="flex-1" />
              <Tap label="Send…" onPress={() => setSheet(true)} className="h-50 flex-1 items-center justify-center rounded-16" style={fx.primary}>
                <T className="text-15 font-bold text-white">Send…</T>
              </Tap>
            </View>
          </View>
        )}
      </Glass>

      <Sheet visible={sheet} onClose={() => setSheet(false)} label="Confirm sending">
        {offline ? (
          <View className="gap-16">
            <IconTile name="wifiOff" size={48} radius={16} iconSize={24} fg={palette.warning.ink} bg={palette.warning.bg} />
            <View className="gap-6">
              <T className="text-20 font-bold">You’re offline</T>
              <T className="text-14 leading-[21px] text-ink-2">MIRA will save it and ask you to send it when you’re back online.</T>
            </View>
            <PrimaryButton
              label="Save & queue for when online"
              onPress={() => {
                setSheet(false);
                setStatus('queued');
              }}
              height={54}
              textClassName="text-15"
              style={{}}
            />
          </View>
        ) : (
          <View className="gap-16">
            <IconTile name="shieldCheck" size={48} radius={16} iconSize={24} fg={palette.navy.DEFAULT} bg={palette.peri.tonal} />
            <T className="text-20 font-bold">Send this reply to Maya?</T>
            <View className="gap-6 rounded-14 bg-white/50 p-12">
              <View className="flex-row justify-between">
                <T className="text-13 text-ink-2">To</T>
                <T className="text-13 font-bold">maya@northwind.example</T>
              </View>
            </View>
            <PrimaryButton
              label="Approve & send"
              onPress={() => {
                setSheet(false);
                setStatus('sent');
              }}
              height={54}
              textClassName="text-15"
              style={{}}
            />
          </View>
        )}
        <SecondaryButton label="Keep editing" onPress={() => setSheet(false)} height={48} radius={16} />
      </Sheet>
    </Screen>
  );
}
