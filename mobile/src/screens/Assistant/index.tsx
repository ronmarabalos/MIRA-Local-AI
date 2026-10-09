/** Board 06-mira-assistant: ask about your messages. Every answer shows where it came from. */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AskMatch } from '../../core/ask';
import { Companion } from '../../components/Companion';
import { ReportItem } from '../../components/ReportItem';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Field, Tap } from '../../components/ui';
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
}

const EXAMPLES = [
  'When is the next deadline?',
  'How much do I need to pay?',
  'What did my professor announce?',
];

const MAX_QUESTION = 300;

const LINE: Partial<Record<State, string>> = {
  searching: 'Looking through your messages…',
  explaining: 'Reading your messages…',
  found: 'Here’s what I found',
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

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const service = () => {
    if (!askRef.current) {
      askRef.current = getStore().then(store => createAsk({ store, model }));
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
      { id, question, state: 'searching', answer: null, matches: [] },
      ...current,
    ]);
    setText('');
    try {
      const ask = await service();
      const matches = await ask.findSources(question);
      if (matches.length === 0) {
        update(id, { state: 'none' });
        return;
      }
      update(id, { state: 'explaining', matches });
      const answer = await ask.explain(question, matches);
      update(
        id,
        answer === null ? { state: 'found' } : { state: 'answered', answer },
      );
    } catch {
      update(id, { state: 'error' });
    }
  };

  const thinking = blocks.some(
    block => block.state === 'searching' || block.state === 'explaining',
  );
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
          Ask about the messages MIRA has read. Every answer shows where it came
          from.
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

      {blocks.map(block => (
        <View key={block.id} className="gap-10">
          <View className="self-end rounded-16 bg-navy px-14 py-10">
            <T className="text-14 font-semibold text-white">{block.question}</T>
          </View>
          <View
            accessibilityLiveRegion="polite"
            className="gap-4 rounded-22 border border-white/80 bg-white/46 p-16"
          >
            {block.state === 'answered' ? (
              <>
                <T className="text-12 font-bold tracking-[0.72px] text-ink-label">
                  MIRA’s answer
                </T>
                <T className="text-15 leading-[22px]">{block.answer}</T>
              </>
            ) : (
              <T className="text-14 font-semibold text-ink-body">
                {LINE[block.state]}
              </T>
            )}
          </View>
          {block.matches.map(match => (
            <ReportItem
              key={match.item.message.id}
              item={match.item}
              label={
                match.fact
                  ? `${match.fact.kind === 'date' ? 'Date' : 'Amount'}: ${
                      match.fact.text
                    }`
                  : undefined
              }
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
