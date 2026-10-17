import { describe, expect, it } from 'vitest';
import {
  dateKey,
  doseSlots,
  doseStatus,
  isEmergency,
  parseState,
  reply,
  seed,
  summary,
  timeline,
  validateCheckIn,
} from './model';
const now = new Date(2026, 9, 17, 12);
describe('patient-only model', () => {
  it('keeps elapsed timeline separate from reports and caps it', () => {
    const state = seed(now);
    expect(timeline(state, now)).toEqual({ day: 8, percent: 67 });
    expect(timeline(state, new Date(2026, 10, 17)).percent).toBe(100);
    expect(summary(state, now)).toContain('not a measure of healing');
  });
  it('counts each dose once and does not infer ingestion', () => {
    const state = seed(now);
    state.doses[dateKey(now)] = ['morning'];
    expect(doseStatus(state, doseSlots[0], now)).toBe('Reported');
    expect(doseStatus(state, doseSlots[1], now)).toBe('Upcoming');
    expect(summary(state, now)).toContain('1 dose report across 1 day');
    expect(summary(state, now)).toContain('No dose report confirms ingestion');
  });
  it('marks a missed report only after the explicit demo window', () => {
    const state = seed(now);
    expect(doseStatus(state, doseSlots[0], new Date(2026, 9, 17, 10))).toBe('Due');
    expect(doseStatus(state, doseSlots[0], now)).toBe('Not reported');
  });
  it('detects emergency wording with straight and curly apostrophes', () => {
    for (const text of [
      "can't breathe",
      'I can’t breathe',
      'chest pain',
      'difficulty breathing',
      'cannot breathe',
    ])
      expect(isEmergency(text)).toBe(true);
    expect(isEmergency('When is my check-in?')).toBe(false);
  });
  it('rejects out-of-range reports and preserves the fixed scale', () => {
    const check = { date: dateKey(now), pain: 5, temperature: '36.8', feeling: 'Okay', notes: '' };
    expect(() => validateCheckIn(check)).not.toThrow();
    for (const pain of [-1, 11, NaN, 2.5])
      expect(() => validateCheckIn({ ...check, pain })).toThrow();
    expect(() => validateCheckIn({ ...check, temperature: '101' })).toThrow();
    expect(() => validateCheckIn({ ...check, feeling: '' })).toThrow();
  });
  it('quotes provided instructions and declines missing clinical answers', () => {
    const state = seed(now);
    state.instructions = 'Read the journal before your visit.';
    expect(reply(state, 'Tell me about my journal')).toContain(
      '“Read the journal before your visit.”',
    );
    expect(reply(state, 'Can I double my dose?')).toContain('cannot invent guidance');
    expect(reply(state, 'I took my pill')).toContain('confirm a report');
    expect(state.doses).toEqual({});
  });
  it('rejects corrupt persistence and unsafe attachment schemes', () => {
    expect(() => parseState('{}')).toThrow();
    const state = seed(now);
    expect(parseState(JSON.stringify(state))).toEqual(state);
    state.attachments = [{ name: 'bad', type: 'text/html', data: 'javascript:alert(1)', size: 1 }];
    expect(() => parseState(JSON.stringify(state))).toThrow();
  });
  it('builds a factual report without inventing history or email delivery', () => {
    const state = seed(now);
    const report = summary(state, now);
    expect(report).toContain('No check-ins recorded');
    expect(report).toContain('No doses reported');
    expect(report).toContain('No email sent');
    expect(report).not.toContain('12 out of 14');
  });
});

it('ignores common negated symptoms and still detects an affirmative emergency', () => {
  for (const text of [
    'no chest pain',
    "I don't have chest pain",
    'without shortness of breath',
    'not unconscious',
    'no chest pain or shortness of breath',
  ])
    expect(isEmergency(text)).toBe(false);
  expect(isEmergency('No chest pain, but I cannot breathe')).toBe(true);
  expect(isEmergency('I have chest pain')).toBe(true);
});
