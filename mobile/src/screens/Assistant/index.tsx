/**
 * Board 06-mira-assistant: ask about your messages. MIRA sums up what it
 * found in a reply; every reply shows the messages it came from.
 */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AskMatch } from '../../core/ask';
import { Companion } from '../../components/Companion';
import { FadeIn, PulseDot } from '../../components/motion';
import { ReportItem } from '../../components/ReportItem';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Icon } from '../../components/Icon';
import { BackButton, Field, Tap } from '../../components/ui';
import palette from '../../theme/palette';
import { model } from '../../services';
import { type Ask, createAsk } from '../../services/ask';
import { getStore } from '../../services/db';

type State =
  | 'searching'
  | 'explaining'
  | 'answered'
  | 'found'
  | 'none'
  | 'error';

interface Block {
  id: number;
  question: string;
  state: State;
  answer: string | null;
  matches: AskMatch[];
  /** Sources unfolded under the reply. */
  open: boolean;
}

const EXAMPLES = [
  'What do I need to do today?',
  'When is the next deadline?',
  'How much do I need to pay?',
];

const MAX_QUESTION = 300;

/** MIRA is still working on this question. */
const busy = (state: State) => state === 'searching' || state === 'explaining';

const LINE: Partial<Record<State, string>> = {
  searching: 'Looking through your messages…',
  explaining: 'Thinking it over…',
  found: 'I couldn’t sum this up, but here’s what I found.',
  none: 'I couldn’t find that in your messages.',
  error: 'Something went wrong reading your messages. Try again.',
};

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const nextId = useRef(1);
  const live = useRef(true);
  const askRef = useRef<Promise<Ask> | null>(null);
  /** App names by package, so a source reads "Messenger" and never a package id. */
  const [appLabels, setAppLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const service = () => {
    if (!askRef.current) {
      askRef.current = getStore().then(async store => {
        const channels = await store.getChannels();
        if (live.current) {
          setAppLabels(
            Object.fromEntries(channels.map(c => [c.packageName, c.label])),
          );
        }
        return createAsk({ store, model });
      });
      // A failed open is tried again on the next question.
      askRef.current.catch(() => {
        askRef.current = null;
      });
    }
    return askRef.current;
  };

  /** Changes one question's block, and only while the screen is still open. */
  const update = (id: number, change: Partial<Block>) => {
    if (live.current) {
      setBlocks(current =>
        current.map(block =>
          block.id === id ? { ...block, ...change } : block,
        ),
      );
    }
  };

  const question = text.trim();
  const canSend = question !== '';

  const send = async () => {
    if (!canSend) return;
    const id = nextId.current++;
    // Newest first, so an answer never arrives below the fold.
    setBlocks(current => [
      { id, question, state: 'searching', answer: null, matches: [], open: false },
      ...current,
    ]);
    setText('');
    try {
      const ask = await service();
      const { matches, exact } = await ask.findSources(question);
      if (matches.length === 0) {
        update(id, { state: 'none' });
        return;
      }
      // Messages picked without a keyword match are shown only if MIRA can use them.
      update(id, { state: 'explaining', matches: exact ? matches : [] });
      const answer = await ask.explain(question, matches);
      if (answer !== null) {
        update(id, { state: 'answered', answer, matches });
      } else {
        update(id, exact ? { state: 'found', open: true } : { state: 'none' });
      }
    } catch {
      update(id, { state: 'error' });
    }
  };

  const thinking = blocks.some(block => busy(block.state));
  const mode = thinking
    ? 'thinking'
    : blocks[0]?.state === 'answered'
    ? 'responding'
    : 'idle';

  const bar = (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row items-end gap-8 border-t border-white/80 bg-silk-base px-20 pt-10"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <Field
        accessibilityLabel="Your question"
        placeholder="Ask about your messages"
        value={text}
        onChangeText={setText}
        maxLength={MAX_QUESTION}
        multiline
        className="min-h-48 flex-1 rounded-16 border border-white/80 bg-white/60 px-14 py-12 text-15"
      />
      <Tap
        label="Ask"
        disabled={!canSend}
        onPress={send}
        className={`h-48 items-center justify-center rounded-16 bg-navy px-16 ${
          canSend ? '' : 'opacity-50'
        }`}
      >
        <T className="text-15 font-bold text-white">Ask</T>
      </Tap>
    </View>
  );

  return (
    <Screen bottom={140} overlay={bar}>
      <View className="flex-row items-center justify-between">
        <BackButton to="Home" label="Back to Home" />
        <Companion size={44} mode={mode} />
      </View>
      <View className="gap-4">
        <T
          accessibilityRole="header"
          className="text-30 font-medium tracking-[-0.9px]"
        >
          Ask MIRA
        </T>
        <T className="text-15 text-ink-2">
          Ask about your messages. I’ll sum up what matters.
        </T>
      </View>

      {blocks.length === 0 ? (
        <View className="gap-8">
          <T className="text-12 font-bold tracking-[0.72px] text-ink-label">
            TRY ASKING
          </T>
          {EXAMPLES.map(example => (
            <Tap
              key={example}
              label={example}
              onPress={() => setText(example)}
              className="min-h-48 justify-center rounded-16 border border-white/80 bg-white/60 px-14 py-12"
            >
              <T className="text-14 font-semibold">{example}</T>
            </Tap>
          ))}
        </View>
      ) : null}

      {blocks.map(block => {
        const sources = block.matches;
        const apps = [
          ...new Set(
            sources.map(
              ({ item }) =>
                `${appLabels[item.message.packageName] ?? 'Another app'} · ${item.chat.title}`,
            ),
          ),
        ];
        return (
          <View key={block.id} className="gap-10">
            <View className="max-w-[85%] self-end rounded-18 rounded-br-6 bg-navy px-14 py-10">
              <T className="text-14 font-semibold text-white">{block.question}</T>
            </View>

            <View className="flex-row items-start gap-8">
              <Companion size={36} mode={busy(block.state) ? 'thinking' : 'idle'} />
              <View
                accessibilityLiveRegion="polite"
                className="flex-1 gap-8 rounded-18 rounded-tl-6 border border-white/80 bg-white/60 p-14"
              >
                {block.state === 'answered' ? (
                  <FadeIn className="gap-8">
                    <T className="text-15 leading-[22px]">{block.answer}</T>
                    <T className="text-12 text-ink-muted">
                      {`MIRA’s summary · from ${apps.slice(0, 2).join(', ')}${
                        apps.length > 2 ? ` and ${apps.length - 2} more` : ''
                      }`}
                    </T>
                  </FadeIn>
                ) : busy(block.state) ? (
                  <View className="flex-row items-center gap-10">
                    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row gap-5">
                      {[0, 200, 400].map(delay => (
                        <PulseDot key={delay} delay={delay} duration={1400} scale className="h-8 w-8 rounded-full bg-peri-600" />
                      ))}
                    </View>
                    <T className="text-14 font-semibold text-ink-body">{LINE[block.state]}</T>
                  </View>
                ) : (
                  <T className="text-14 font-semibold text-ink-body">{LINE[block.state]}</T>
                )}
                {sources.length > 0 && block.state !== 'searching' ? (
                  <Tap
                    label={block.open ? 'Hide sources' : 'Show sources'}
                    accessibilityState={{ expanded: block.open }}
                    onPress={() => update(block.id, { open: !block.open })}
                    className="min-h-36 flex-row items-center gap-6 self-start"
                  >
                    <T className="text-13 font-bold text-navy">
                      {block.open
                        ? 'Hide sources'
                        : `Show ${sources.length} source${sources.length === 1 ? '' : 's'}`}
                    </T>
                    <View style={{ transform: [{ rotate: block.open ? '-90deg' : '90deg' }] }}>
                      <Icon name="chevronRight" size={14} color={palette.navy.DEFAULT} />
                    </View>
                  </Tap>
                ) : null}
              </View>
            </View>

            {block.open
              ? sources.map(match => (
                  <ReportItem
                    key={match.item.message.id}
                    item={match.item}
                    appLabel={appLabels[match.item.message.packageName] ?? 'Another app'}
                    label={
                      match.fact
                        ? `${match.fact.kind === 'date' ? 'Date' : 'Amount'}: ${match.fact.text}`
                        : undefined
                    }
                  />
                ))
              : null}
          </View>
        );
      })}
    </Screen>
  );
}
