import { describe, test, expect } from 'vitest';
import { filterStreams, pendingDeliveries } from './streams';
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
    expect(filterStreams(streams, '  PROD.PAYMENTS  ')).toEqual([
      streams[1],
    ]);
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

describe('pendingDeliveries', () => {
  test('sums consumer deliveries independently of retained messages', () => {
    expect(
      pendingDeliveries({
        state: { consumer_count: 2 },
        consumer_detail: [
          { num_pending: 3, num_ack_pending: 1 },
          { num_pending: 3, num_ack_pending: 2 },
        ],
      })
    ).toEqual({ pending: 6, ackPending: 3 });
  });
  test('does not report missing or partial consumer data as zero', () => {
    expect(pendingDeliveries({})).toBeUndefined();
    expect(
      pendingDeliveries({ state: { consumer_count: 1 } })
    ).toBeUndefined();
    expect(
      pendingDeliveries({
        state: { consumer_count: 1 },
        consumer_detail: [],
      })
    ).toBeUndefined();
  });
  test('reports zero for a stream known to have no consumers', () => {
    expect(pendingDeliveries({ state: { consumer_count: 0 } })).toEqual(
      {
        pending: 0,
        ackPending: 0,
      }
    );
    expect(pendingDeliveries({ consumer_detail: [] })).toEqual({
      pending: 0,
      ackPending: 0,
    });
  });
  test('distinguishes an idle consumer from delayed acknowledgments', () => {
    expect(
      pendingDeliveries({
        consumer_detail: [{ num_pending: 0, num_ack_pending: 1 }],
      })
    ).toEqual({ pending: 0, ackPending: 1 });
    expect(
      pendingDeliveries({
        consumer_detail: [{ num_pending: 0, num_ack_pending: 0 }],
      })
    ).toEqual({ pending: 0, ackPending: 0 });
  });
  test('rejects invalid or missing counters rather than showing misleading totals', () => {
    expect(
      pendingDeliveries({
        consumer_detail: [{ num_pending: NaN, num_ack_pending: 0 }],
      })
    ).toBeUndefined();
    expect(
      pendingDeliveries({
        consumer_detail: [{ num_pending: 0, num_ack_pending: -1 }],
      })
    ).toBeUndefined();
  });
});
