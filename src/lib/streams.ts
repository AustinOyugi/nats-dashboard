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
