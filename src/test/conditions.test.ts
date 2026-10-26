import { describe, it, expect } from 'vitest';
import { moonKey, moonPhase, dayPart, topOf } from '@/lib/conditions';

describe('conditions', () => {
  it('full moon on 2024-04-23', () => {
    expect(moonKey(moonPhase(new Date(Date.UTC(2024, 3, 23, 23))))).toBe('full');
  });
  it('new moon on 2024-04-08', () => {
    expect(moonKey(moonPhase(new Date(Date.UTC(2024, 3, 8, 18))))).toBe('new');
  });
  it('6am is dawn, 22 is night', () => {
    expect(dayPart(6)).toBe('dawn');
    expect(dayPart(22)).toBe('night');
  });
  it('topOf picks most frequent', () => {
    expect(topOf(['a', 'b', 'b', null])).toEqual({ value: 'b', count: 2 });
  });
});
