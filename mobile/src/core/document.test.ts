import { pickPassages, splitPassages } from './document';

describe('splitPassages', () => {
  test('keeps paragraphs together, joining short ones up to the passage size', () => {
    const text = 'Intro line.\n\nSecond short.\n\n' + 'Long. '.repeat(200);
    const parts = splitPassages(text, 300);
    expect(parts[0]).toBe('Intro line.\nSecond short.');
    expect(parts.every(p => p.length <= 300)).toBe(true);
    expect(parts.join(' ').replace(/\s+/g, ' ')).toContain('Long. Long.');
  });

  test('drops empty lines and extra spaces', () => {
    expect(splitPassages('  a   b \n\n\n\n c  ', 100)).toEqual(['a b\nc']);
  });
});

describe('pickPassages', () => {
  const parts = [
    'Course outline for Biology 101.',
    'The midterm exam is on October 20 in room 301.',
    'Grading: quizzes 20%, labs 30%, exams 50%.',
    'The final project is due December 5.',
    'Office hours are Tuesdays.',
  ];

  test('a specific question gets the passages that match, in document order', () => {
    const picked = pickPassages('when is the exam?', parts, 2000);
    // "final" counts as an exam word, the same related words Ask MIRA uses.
    expect(picked).toEqual([
      'The midterm exam is on October 20 in room 301.',
      'Grading: quizzes 20%, labs 30%, exams 50%.',
      'The final project is due December 5.',
    ]);
    expect(picked).not.toContain('Office hours are Tuesdays.');
  });

  test('"summarise this" spreads across the whole document within the budget', () => {
    const picked = pickPassages('summarise this', parts, 100);
    expect(picked[0]).toBe(parts[0]);
    expect(picked.length).toBeGreaterThan(1);
    expect(picked.join('').length).toBeLessThanOrEqual(100);
    expect(picked).toContain(parts[parts.length - 1]);
  });

  test('a question nothing matches still gets a spread, so MIRA can say it is not there', () => {
    expect(pickPassages('what about basketball?', parts, 2000)).toEqual(parts);
  });
});
