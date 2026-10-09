/** Board 18-personal-memory: what MIRA remembers, editable and deletable. */
import { Fragment, useState } from 'react';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Dialog } from '../../components/Overlay';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Chip, Field, FilterPills, Glass, IconTile, SearchField, SecondaryButton, Tap } from '../../components/ui';
import palette from '../../theme/palette';
import { useDisplayName } from '../../theme/prefs';

const CATS = ['Personal Preferences', 'Communication Style', 'Important Information', 'Routines and Habits', 'Saved Instructions'];

type Memory = { id: string; cat: string; text: string; taught: boolean; date: string };

function startList(name: string): Memory[] {
  return [
    { id: 'm1', cat: 'Communication Style', text: 'Write emails in a friendly, concise tone', taught: true, date: 'Saved 2 Oct' },
    { id: 'm2', cat: 'Communication Style', text: 'Keep email replies short', taught: true, date: 'Saved today' },
    { id: 'm3', cat: 'Personal Preferences', text: 'Prefers meetings after 10 AM', taught: false, date: 'Saved 5 Oct' },
    { id: 'm4', cat: 'Personal Preferences', text: `Call me ${name}`, taught: true, date: 'Saved 1 Oct' },
    { id: 'm5', cat: 'Routines and Habits', text: 'Morning brief at 7:30 AM', taught: false, date: 'Saved 3 Oct' },
    { id: 'm6', cat: 'Important Information', text: 'The Q3 report goes to Priya Nair', taught: false, date: 'Saved today' },
    { id: 'm7', cat: 'Saved Instructions', text: `Sign emails “Best, ${name}”`, taught: true, date: 'Saved 4 Oct' },
  ];
}

export default function MemoryScreen() {
  const go = useGo();
  const name = useDisplayName();
  const [list, setList] = useState(() => startList(name));
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  const visible = list
    .filter((m) => (cat === 'All' || m.cat === cat) && m.text.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat));
  const doomed = list.find((m) => m.id === confirm);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton to="Profile" label="Back to Profile" />
        <Tap label="Add memory" onPress={() => go('TeachInstruction')} className="h-44 flex-row items-center gap-6 rounded-14 bg-navy px-14">
          <Icon name="plus" size={16} strokeWidth={2.4} color={palette.white} />
          <T className="text-14 font-bold text-white">Add memory</T>
        </Tap>
      </View>
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">What MIRA Remembers</T>
        <T className="text-15 text-ink-2">Everything MIRA learns is yours to control.</T>
      </View>

      <View className="flex-row items-center gap-12 rounded-20 bg-ink px-16 py-14">
        <IconTile name="phone" size={40} radius={13} fg={palette.mint.glow} bg="rgba(104,207,193,0.18)" />
        <View className="flex-1 gap-2">
          <T className="text-14 font-bold text-white">{`${list.length} memories · stored on this device`}</T>
          <T className="text-12 leading-[17.4px] text-peri-mist">Only what you teach or approve.</T>
        </View>
      </View>

      <SearchField label="Search memories" placeholder="Search what MIRA remembers" value={q} onChangeText={setQ} />
      <FilterPills label="Categories" value={cat} onChange={setCat} items={['All', ...CATS].map((c) => ({ id: c, label: c }))} />

      <View className="gap-10">
        {visible.map((m, i) => {
          const isEditing = editing === m.id;
          return (
            <Fragment key={m.id}>
              {i === 0 || visible[i - 1].cat !== m.cat ? (
                <T className="px-2 pt-6 text-12 font-bold tracking-[0.72px] text-ink-label">{m.cat.toUpperCase()}</T>
              ) : null}
              <Glass className="gap-10 rounded-20 p-14">
                {isEditing ? (
                  <View className="flex-row gap-8">
                    <Field
                      accessibilityLabel="Edit memory"
                      autoFocus
                      value={draft}
                      onChangeText={setDraft}
                      className="h-44 min-w-0 flex-1 rounded-12 border-[1.5px] border-peri-600 bg-white px-12 text-14 font-semibold"
                    />
                    <Tap
                      label="Save"
                      onPress={() => {
                        setList(list.map((x) => (x.id === m.id ? { ...x, text: draft.trim() || x.text, date: 'Edited just now' } : x)));
                        setEditing(null);
                      }}
                      className="h-44 justify-center rounded-12 bg-navy px-14"
                    >
                      <T className="text-13 font-bold text-white">Save</T>
                    </Tap>
                  </View>
                ) : (
                  <T className="text-15 font-bold leading-[21px]">{m.text}</T>
                )}
                <View className="flex-row items-center gap-8">
                  <Chip
                    label={m.taught ? 'You taught' : 'You approved'}
                    icon={m.taught ? 'pencil' : 'check'}
                    fg={m.taught ? palette.navy.pressed : palette.mint.ink}
                    bg={m.taught ? palette.peri.tonal : palette.mint.bg}
                  />
                  <T className="text-12 text-ink-muted">{m.date}</T>
                  <View className="flex-1" />
                  <Tap
                    label="Edit memory"
                    onPress={() => {
                      setEditing(isEditing ? null : m.id);
                      setDraft(m.text);
                    }}
                    className="h-40 w-40 items-center justify-center rounded-12 bg-white/55"
                  >
                    <Icon name="pencil" size={17} color={palette.navy.DEFAULT} />
                  </Tap>
                  <Tap label="Delete memory" onPress={() => setConfirm(m.id)} className="h-40 w-40 items-center justify-center rounded-12 bg-error-bg">
                    <Icon name="trash" size={17} color={palette.error.ink} />
                  </Tap>
                </View>
              </Glass>
            </Fragment>
          );
        })}
        {visible.length === 0 ? (
          <View className="rounded-20 border-[1.5px] border-dashed border-peri-200 p-24">
            <T className="text-center text-14 text-ink-2">No memories match. Try another word.</T>
          </View>
        ) : null}
      </View>

      <SecondaryButton label="Review saved memories with MIRA" onPress={() => go('Teach')} height={52} radius={16} />

      <Dialog visible={!!doomed} onClose={() => setConfirm(null)} label="Delete memory">
        <IconTile name="trash" size={48} radius={16} iconSize={24} fg={palette.error.ink} bg={palette.error.bg} />
        <T className="text-19 font-bold">Delete this memory?</T>
        <T className="text-14 leading-[21px] text-ink-body">{`“${doomed?.text ?? ''}” will be removed.`}</T>
        <View className="flex-row gap-8">
          <SecondaryButton label="Keep" onPress={() => setConfirm(null)} height={50} radius={16} className="flex-1" />
          <Tap
            label="Delete"
            onPress={() => {
              setList(list.filter((m) => m.id !== confirm));
              setConfirm(null);
            }}
            className="h-50 flex-1 items-center justify-center rounded-16 bg-error-ink"
          >
            <T className="text-15 font-bold text-white">Delete</T>
          </Tap>
        </View>
      </Dialog>
    </Screen>
  );
}
