import { describe, test, expect } from 'vitest';
import { filterStreams } from './streams';
import { paginate } from './pagination';

const streams = [
  { name: 'EVENTS_a1', config: { subjects: ['dev.orders.ready'] } },
  {
    name: 'EVENTS_b2',
    config: { subjects: ['dev.invoices.ready', 'prod.payments.*'] },
  },
  { name: 'KV_INBOX' },
  { name: 'MIRROR', config: { subjects: [] } },
];

describe('filterStreams', () => {
  test('matches stream names without configuration', () => {
    expect(filterStreams(streams, 'inbox')).toEqual([streams[2]]);
  });

  test('matches any configured subject, ignoring case and surrounding whitespace', () => {
    expect(filterStreams(streams, '  PROD.PAYMENTS  ')).toEqual([streams[1]]);
  });

  test('preserves all streams for an empty search', () => {
    expect(filterStreams(streams, '   ')).toBe(streams);
  });

  test('treats wildcard and punctuation characters literally', () => {
    expect(filterStreams(streams, 'payments.*')).toEqual([streams[1]]);
    expect(filterStreams(streams, 'dev.*')).toEqual([]);
  });

  test('returns no matches without failing on missing subjects', () => {
    expect(filterStreams(streams, 'missing')).toEqual([]);
  });

  test('filters all streams before pagination and preserves their order', () => {
    expect(paginate(filterStreams(streams, 'ready'), 1, 2)).toEqual([
      streams[1],
    ]);
    expect(streams.map((stream) => stream.name)).toEqual([
      'EVENTS_a1',
      'EVENTS_b2',
      'KV_INBOX',
      'MIRROR',
    ]);
  });
});
