/**
 * Board 06-mira-assistant: ask about your messages, or about a document you
 * attach. MIRA sums up what it found; every reply shows where it came from.
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
import {
  askDocument,
  type OpenDocument,
  pickDocument,
} from '../../services/documents';

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
  /** Set when the question was about an attached document: its name and the passages used. */
  doc?: { name: string; passages: string[] };
}

const EXAMPLES = [
  'What do I need to do today?',
  'When is the next deadline?',
  'How much do I need to pay?',
];

const DOC_EXAMPLES = [
  'Summarise this',
  'What are the deadlines?',
  'Make a short reviewer',
];

/** What went wrong reading a document, by the native error code. */
const DOC_ERRORS: Record<string, string> = {
  unsupported: 'I can read PDFs, Word files, text, and photos.',
  too_big: 'That file is too big to read on this phone.',
  empty: 'I couldn’t find any text in that file.',
  no_picker: 'Documents can only be added on the phone.',
};

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
  const [doc, setDoc] = useState<OpenDocument | null>(null);
  const [reading, setReading] = useState(false);
  const [docProblem, setDocProblem] = useState('');
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

  const attach = async () => {
    setDocProblem('');
    setReading(true);
    try {
      const picked = await pickDocument();
      if (live.current && picked) setDoc(picked);
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      if (live.current)
        setDocProblem(
          DOC_ERRORS[code] ?? 'That file couldn’t be read. Try another.',
        );
    } finally {
      if (live.current) setReading(false);
    }
  };

  const sendToDocument = async (open: OpenDocument) => {
    const id = nextId.current++;
    setBlocks(current => [
      {
        id,
        question,
        state: 'explaining',
        answer: null,
        matches: [],
        open: false,
        doc: { name: open.name, passages: [] },
      },
      ...current,
    ]);
    setText('');
    const { answer, passages } = await askDocument(question, open, model);
    const docInfo = { name: open.name, passages };
    update(
      id,
      answer !== null
        ? { state: 'answered', answer, doc: docInfo }
        : { state: 'found', open: true, doc: docInfo },
    );
  };

  const send = async () => {
    if (!canSend) return;
    if (doc) {
      await sendToDocument(doc);
      return;
    }
    const id = nextId.current++;
    // Newest first, so an answer never arrives below the fold.
    setBlocks(current => [
      {
        id,
        question,
        state: 'searching',
        answer: null,
        matches: [],
        open: false,
      },
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
      className="absolute bottom-0 left-0 right-0 gap-8 border-t border-white/80 bg-silk-base px-20 pt-10"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {reading ? (
        <View className="flex-row items-center gap-8 self-start rounded-full bg-white/70 px-12 py-8">
          <View className="flex-row gap-4">
            {[0, 200, 400].map(delay => (
              <PulseDot
                key={delay}
                delay={delay}
                duration={1400}
                scale
                className="h-6 w-6 rounded-full bg-peri-600"
              />
            ))}
          </View>
          <T className="text-13 font-semibold text-ink-body">
            Reading the document…
          </T>
        </View>
      ) : doc ? (
        <View className="flex-row items-center gap-8 self-start rounded-full bg-peri-tonal py-6 pl-12 pr-6">
          <Icon name="file" size={16} color={palette.navy.DEFAULT} />
          <T
            className="max-w-220 text-13 font-semibold text-navy"
            numberOfLines={1}
          >
            {`${doc.name}${doc.pages > 1 ? ` · ${doc.pages} pages` : ''}`}
          </T>
          <Tap
            label="Remove document"
            onPress={() => setDoc(null)}
            className="h-28 w-28 items-center justify-center rounded-full"
          >
            <Icon name="x" size={14} color={palette.navy.DEFAULT} />
          </Tap>
        </View>
      ) : null}
      {docProblem ? (
        <T
          accessibilityRole="alert"
          className="text-13 font-semibold text-error-ink"
        >
          {docProblem}
        </T>
      ) : null}
      <View className="flex-row items-end gap-8">
        <Tap
          label="Attach a document"
          disabled={reading}
          onPress={attach}
          className="h-48 w-48 items-center justify-center rounded-16 border border-white/80 bg-white/60"
        >
          <Icon name="file" size={20} color={palette.navy.DEFAULT} />
        </Tap>
        <Field
          accessibilityLabel="Your question"
          placeholder={
            doc ? 'Ask about this document' : 'Ask about your messages'
          }
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
      </View>

      {blocks.length === 0 ? (
        <View className="gap-8">
          <T className="text-12 font-bold tracking-[0.72px] text-ink-label">
            TRY ASKING
          </T>
          {(doc ? DOC_EXAMPLES : EXAMPLES).map(example => (
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
        if (block.doc)
          return (
            <DocumentBlock
              key={block.id}
              block={block}
              onToggle={() => update(block.id, { open: !block.open })}
            />
          );
        const sources = block.matches;
        const apps = [
          ...new Set(
            sources.map(
              ({ item }) =>
                `${appLabels[item.message.packageName] ?? 'Another app'} · ${
                  item.chat.title
                }`,
            ),
          ),
        ];
        return (
          <View key={block.id} className="gap-10">
            <View className="max-w-[85%] self-end rounded-18 rounded-br-6 bg-navy px-14 py-10">
              <T className="text-14 font-semibold text-white">
                {block.question}
              </T>
            </View>

            <View className="flex-row items-start gap-8">
              <Companion
                size={36}
                mode={busy(block.state) ? 'thinking' : 'idle'}
              />
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
                    <View
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      className="flex-row gap-5"
                    >
                      {[0, 200, 400].map(delay => (
                        <PulseDot
                          key={delay}
                          delay={delay}
                          duration={1400}
                          scale
                          className="h-8 w-8 rounded-full bg-peri-600"
                        />
                      ))}
                    </View>
                    <T className="text-14 font-semibold text-ink-body">
                      {LINE[block.state]}
                    </T>
                  </View>
                ) : (
                  <T className="text-14 font-semibold text-ink-body">
                    {LINE[block.state]}
                  </T>
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
                        : `Show ${sources.length} source${
                            sources.length === 1 ? '' : 's'
                          }`}
                    </T>
                    <View
                      style={{
                        transform: [
                          { rotate: block.open ? '-90deg' : '90deg' },
                        ],
                      }}
                    >
                      <Icon
                        name="chevronRight"
                        size={14}
                        color={palette.navy.DEFAULT}
                      />
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
                    appLabel={
                      appLabels[match.item.message.packageName] ?? 'Another app'
                    }
                    label={
                      match.fact
                        ? `${match.fact.kind === 'date' ? 'Date' : 'Amount'}: ${
                            match.fact.text
                          }`
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

/** A reply about an attached document, with the passages it came from. */
function DocumentBlock({
  block,
  onToggle,
}: {
  block: Block;
  onToggle(): void;
}) {
  const doc = block.doc!;
  return (
    <View className="gap-10">
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
              <T className="text-12 text-ink-muted">{`MIRA’s answer · from ${doc.name}`}</T>
            </FadeIn>
          ) : busy(block.state) ? (
            <View className="flex-row items-center gap-10">
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="flex-row gap-5"
              >
                {[0, 200, 400].map(delay => (
                  <PulseDot
                    key={delay}
                    delay={delay}
                    duration={1400}
                    scale
                    className="h-8 w-8 rounded-full bg-peri-600"
                  />
                ))}
              </View>
              <T className="text-14 font-semibold text-ink-body">
                Reading the document…
              </T>
            </View>
          ) : (
            <T className="text-14 font-semibold text-ink-body">
              I couldn’t answer that from the document. Here’s what I read.
            </T>
          )}
          {doc.passages.length > 0 && !busy(block.state) ? (
            <Tap
              label={block.open ? 'Hide passages' : 'Show passages'}
              accessibilityState={{ expanded: block.open }}
              onPress={onToggle}
              className="min-h-36 flex-row items-center gap-6 self-start"
            >
              <T className="text-13 font-bold text-navy">
                {block.open
                  ? 'Hide passages'
                  : `Show ${doc.passages.length} passage${
                      doc.passages.length === 1 ? '' : 's'
                    }`}
              </T>
            </Tap>
          ) : null}
        </View>
      </View>
      {block.open
        ? doc.passages.map((passage, i) => (
            <View
              key={i}
              className="gap-4 rounded-18 border border-white/80 bg-white/46 p-14"
            >
              <T className="text-12 font-bold text-ink-label">{`From ${doc.name}`}</T>
              <T className="text-14 leading-[21px] text-ink-deep">{`“${passage}”`}</T>
            </View>
          ))
        : null}
    </View>
  );
}
