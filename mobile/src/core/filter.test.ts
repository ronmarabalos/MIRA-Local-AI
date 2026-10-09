import { quickFilter } from './filter';
import { FIXTURES, fixtureText } from './__fixtures__/messages';

describe('quickFilter', () => {
  it.each(FIXTURES.map(f => [f.id, f] as const))('routes %s', (_id, fixture) => {
    expect(quickFilter(fixture.notification, fixtureText(fixture))).toBe(fixture.route);
  });

  const base = FIXTURES.find(f => f.id === 'meeting-move')!.notification;

  it('drops ongoing notifications whatever their category', () => {
    expect(quickFilter({ ...base, isOngoing: true }, 'Can we move our group meeting?')).toBe('drop');
  });

  it('treats a message of three words or fewer as chatter', () => {
    expect(quickFilter(base, 'see you later')).toBe('chatter');
    expect(quickFilter(base, '')).toBe('chatter');
  });

  it('sends a four-word message to the model', () => {
    expect(quickFilter(base, 'pay me back tomorrow')).toBe('model');
  });

  it('keeps email without a reply box for the model', () => {
    const email = FIXTURES.find(f => f.id === 'tuition')!.notification;
    expect(email.canReply).toBe(false);
    expect(quickFilter(email, email.text!)).toBe('model');
  });
});
