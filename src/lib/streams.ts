/** Match stream names and configured subjects without interpreting NATS wildcards. */
export function filterStreams<
  T extends { name: string; config?: { subjects?: string[] } },
>(streams: T[], query: string): T[] {
  const search = query.trim().toLowerCase();
  if (!search) return streams;

  return streams.filter(
    (stream) =>
      stream.name.toLowerCase().includes(search) ||
      stream.config?.subjects?.some((subject) =>
        subject.toLowerCase().includes(search)
      )
  );
}

/** Consumer-delivery totals, not unique stored messages. Missing/partial data is unknown. */
export function pendingDeliveries(stream: {
  state?: { consumer_count?: number };
  consumer_detail?: { num_pending: number; num_ack_pending: number }[];
}): { pending: number; ackPending: number } | undefined {
  const consumers = stream.consumer_detail;
  const count = stream.state?.consumer_count;
  if (!consumers)
    return count === 0 ? { pending: 0, ackPending: 0 } : undefined;
  if (count !== undefined && count !== consumers.length)
    return undefined;
  if (
    consumers.some(
      (c) =>
        !Number.isFinite(c.num_pending) ||
        c.num_pending < 0 ||
        !Number.isFinite(c.num_ack_pending) ||
        c.num_ack_pending < 0
    )
  )
    return undefined;
  return consumers.reduce(
    (total, c) => ({
      pending: total.pending + c.num_pending,
      ackPending: total.ackPending + c.num_ack_pending,
    }),
    { pending: 0, ackPending: 0 }
  );
}
