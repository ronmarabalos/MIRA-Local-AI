import type { ReportItem } from './report';

/** Questions look at messages from the last 14 days. */
export const ASK_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
export const MAX_MATCHES = 5;
/** A question is a sentence, not a document: anything longer is cut. */
const MAX_QUESTION_CHARS = 300;

/** A stored fact the question asks for, taken from the record, not written by the model. */
export interface AskFact {
  kind: 'date' | 'amount';
  text: string;
}

export interface AskMatch {
  item: ReportItem;
  score: number;
  fact: AskFact | null;
}

/** Words that carry no meaning for a search, in English and Filipino. */
const FILLER = new Set(
  (
    'a an the is are was were be been am do does did has have had will would can could should may ' +
    'i me my mine you your we our us it its this that these those there here of in on at to for from with by about as ' +
    'and or but if so not no yes what which who whom whose where why how any some all ' +
    'please tell show give find know need want get got thing ' +
    // What is left of a contraction once its apostrophe is gone ("what's", "didn't").
    'don didn doesn isn wasn aren ll ve re ' +
    'next last say said ' +
    'ang ng mga sa si ni kay na pa ba po ho yung yun ito iyan iyon ko mo ka ako ikaw siya kami tayo sila ' +
    'ano anong anu sino saan bakit paano ilan sabi may meron wala at o pero kung din rin lang naman nga daw raw'
  ).split(' '),
);

const DATE_WORDS = new Set([
  'when',
  'kailan',
  'kelan',
  'time',
  'oras',
  'due',
  'deadline',
]);
const AMOUNT_WORDS = new Set([
  'much',
  'magkano',
  'amount',
  'price',
  'cost',
  'halaga',
]);
/** Question words that only say what is being asked for; they are not searched for. */
const INTENT_ONLY = new Set([
  'when',
  'kailan',
  'kelan',
  'time',
  'oras',
  'much',
  'magkano',
]);

/** Words that mean the same thing for a search, across both languages. */
const GROUPS = [
  [
    'pay',
    'payment',
    'paid',
    'fee',
    'bayad',
    'bayaran',
    'babayaran',
    'balance',
    'utang',
    'owe',
    'tuition',
    'bill',
  ],
  [
    'deadline',
    'due',
    'submit',
    'submission',
    'pasa',
    'ipasa',
    'ipapasa',
    'pass',
  ],
  ['class', 'klase', 'lecture', 'subject'],
  ['meeting', 'meet', 'pulong'],
  ['professor', 'prof', 'teacher', 'instructor', 'sir', 'maam'],
  ['announce', 'announcement', 'announced', 'notice', 'paalala', 'anunsyo'],
  ['exam', 'quiz', 'test', 'midterm', 'final'],
  ['project', 'proposal', 'report', 'paper', 'thesis'],
];

/** Folds a plural onto its singular. Applied to both sides, so it only has to be consistent. */
const stem = (word: string) =>
  word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;

const GROUP_OF = new Map<string, number>();
GROUPS.forEach((group, index) =>
  group.forEach(word => GROUP_OF.set(stem(word), index)),
);

function rawWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const same = (a: string, b: string) =>
  a === b || (GROUP_OF.has(a) && GROUP_OF.get(a) === GROUP_OF.get(b));

const hasWord = (words: string[], asked: string) =>
  words.some(word => same(word, asked));

/**
 * The stored messages that best match a question (Ask MIRA spec 3.1), with
 * no model call. A message needs at least one of the question's content
 * words; what the question asks for ("when", "how much") only adds weight.
 */
export function searchMessages(
  question: string,
  items: ReportItem[],
  now: number,
): AskMatch[] {
  const raw = rawWords(question.slice(0, MAX_QUESTION_CHARS));
  const wantsDate = raw.some(word => DATE_WORDS.has(word));
  const wantsAmount = raw.some(word => AMOUNT_WORDS.has(word));
  const asked = [
    ...new Set(
      raw
        .filter(
          word =>
            word.length > 1 && !FILLER.has(word) && !INTENT_ONLY.has(word),
        )
        .map(stem),
    ),
  ];
  if (asked.length === 0) return [];

  const matches: AskMatch[] = [];
  for (const item of items) {
    const { message, chat, record } = item;
    if (
      !record ||
      message.status !== 'processed' ||
      record.type === 'chatter' ||
      record.type === 'promotion' ||
      record.duplicateOf !== null ||
      record.instructionLike ||
      now - message.postedAt > ASK_WINDOW_MS
    ) {
      continue;
    }

    const text = rawWords(message.text).map(stem);
    const summary = rawWords(record.summary).map(stem);
    const names = rawWords(`${message.sender} ${chat.title}`).map(stem);
    let score = 0;
    for (const word of asked) {
      if (hasWord(text, word)) score += 3;
      else if (hasWord(summary, word) || hasWord(names, word)) score += 2;
    }
    if (score === 0) continue;

    let fact: AskFact | null = null;
    if (wantsDate && record.dateText)
      fact = { kind: 'date', text: record.dateText };
    else if (wantsAmount && record.amount)
      fact = { kind: 'amount', text: record.amount };
    if (fact) score += 2;

    matches.push({ item, score, fact });
  }

  return matches
    .sort(
      (a, b) =>
        b.score - a.score || b.item.message.postedAt - a.item.message.postedAt,
    )
    .slice(0, MAX_MATCHES);
}
