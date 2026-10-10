/**
 * Which messages MIRA keeps: words to look for in notifications ("keep
 * anything that says announcement"), and the apps MIRA reads.
 */
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Field, Glass, PrimaryButton, SecondaryButton, Tap } from '../../components/ui';
import { addKeepWord } from '../../core/keep';
import { getStore } from '../../services/db';
import { useChannels, useKeepWords } from '../../services/db/hooks';
import palette from '../../theme/palette';

const SUGGESTIONS = ['announcement', 'deadline', 'payment', 'exam', 'meeting', 'urgent'];

export default function KeepWordsScreen() {
  const go = useGo();
  const { data: words, error, retry } = useKeepWords();
  const { data: channels } = useChannels();
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const list = words ?? [];
  const apps = (channels ?? []).filter(c => c.enabled).map(c => c.label);

  const save = async (next: string[]) => {
    if (busy.current || next === list) return;
    busy.current = true;
    try {
      await (await getStore()).setKeepWords(next);
      setNotice('');
    } catch {
      setNotice('Couldn’t save that. Try again.');
    } finally {
      busy.current = false;
    }
  };
  const add = async (word: string) => {
    await save(addKeepWord(list, word));
    setDraft('');
  };

  return (
    <Screen top={56} px={20} gap={18} bottom={40}>
      <View className="flex-row items-center">
        <BackButton to="Home" label="Back to Today" />
      </View>
      <View className="gap-4">
        <T accessibilityRole="header" className="text-28 font-bold leading-[33.6px] tracking-[-0.56px]">
          Which messages should I keep?
        </T>
      </View>

      <Glass className="gap-12 rounded-22 p-16">
        <View className="flex-row items-center gap-8">
          <Field
            accessibilityLabel="A word to look for"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => add(draft)}
            placeholder="Type a word, like announcement"
            autoCapitalize="none"
            returnKeyType="done"
            maxLength={40}
            className="h-48 flex-1 rounded-14 border border-white/80 bg-white/60 px-14 text-15"
          />
          <Tap
            label="Add word"
            disabled={draft.trim() === ''}
            onPress={() => add(draft)}
            className={`h-48 items-center justify-center rounded-14 bg-navy px-16 ${
              draft.trim() === '' ? 'opacity-50' : ''
            }`}
          >
            <T className="text-15 font-bold text-white">Add</T>
          </Tap>
        </View>

        {error ? (
          <View className="gap-8">
            <T className="text-14 text-ink-2">Couldn’t load your words.</T>
            <SecondaryButton label="Try again" onPress={retry} />
          </View>
        ) : list.length === 0 ? (
          <T className="text-14 leading-[20px] text-ink-2">
            No words yet. I keep everything.
          </T>
        ) : (
          <View className="gap-8">
            <T className="text-13 font-bold text-ink-label">I keep messages that say</T>
            <View className="flex-row flex-wrap gap-8">
              {list.map(word => (
                <Tap
                  key={word}
                  label={`Remove ${word}`}
                  onPress={() => save(list.filter(w => w !== word))}
                  className="min-h-40 flex-row items-center gap-6 rounded-full bg-peri-tonal px-14"
                >
                  <T className="text-14 font-semibold text-navy">{word}</T>
                  <Icon name="x" size={14} color={palette.navy.DEFAULT} />
                </Tap>
              ))}
            </View>
            <T className="text-12 text-ink-muted">Others aren’t saved.</T>
          </View>
        )}

        {notice ? (
          <T accessibilityRole="alert" className="text-14 font-semibold text-error-ink">
            {notice}
          </T>
        ) : null}

        {SUGGESTIONS.some(s => !list.includes(s)) ? (
          <View className="gap-8">
            <T className="text-13 font-bold text-ink-label">Try</T>
            <View className="flex-row flex-wrap gap-8">
              {SUGGESTIONS.filter(s => !list.includes(s)).map(word => (
                <Tap
                  key={word}
                  label={`Add ${word}`}
                  onPress={() => add(word)}
                  className="min-h-40 flex-row items-center gap-6 rounded-full border border-white/80 bg-white/60 px-14"
                >
                  <Icon name="plus" size={14} color={palette.ink.muted} />
                  <T className="text-14 text-ink-body">{word}</T>
                </Tap>
              ))}
            </View>
          </View>
        ) : null}
      </Glass>

      <View className="gap-10">
        <T accessibilityRole="header" className="text-18 font-semibold">
          From these apps
        </T>
        <Glass className="gap-6 rounded-22 p-16">
          <T className="text-15 font-semibold">
            {apps.length === 0 ? 'No apps yet' : apps.join(', ')}
          </T>
        </Glass>
        <PrimaryButton
          label="Add an app"
          onPress={() => go('ConnectedApps')}
          left={<Icon name="plus" size={18} color={palette.white} />}
        />
      </View>
    </Screen>
  );
}
