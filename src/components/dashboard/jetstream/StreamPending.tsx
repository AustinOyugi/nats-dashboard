import { createMemo, createSignal, For, Show } from 'solid-js';
import type { StreamDetail } from '~/types';
import { pendingDeliveries } from '~/lib/streams';
import Badge, { redIfPositive } from '~/components/Badge';

export default function StreamPending(props: {
  stream: StreamDetail;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
}) {
  const [localExpanded, setLocalExpanded] = createSignal(false);
  const totals = createMemo(() => pendingDeliveries(props.stream));
  return (
    <div class="relative z-10 mt-3 text-xs leading-5 text-gray-600 dark:text-gray-300">
      <div
        class="flex flex-wrap gap-2 sm:gap-3"
        aria-label="Pending consumer deliveries"
      >
        <Badge
          border={false}
          color={redIfPositive(totals()?.pending ?? 0)}
          title="Messages not yet delivered, summed across consumers."
        >
          <span class="text-gray-900 dark:text-white mr-1.5">
            Pending
          </span>
          {totals()?.pending.toLocaleString() ?? 'Unavailable'}
        </Badge>
        <Badge
          border={false}
          color={redIfPositive(totals()?.ackPending ?? 0)}
          title="Delivered but not acknowledged, including delayed retries; summed across consumers."
        >
          <span class="text-gray-900 dark:text-white mr-1.5">
            Ack Pending
          </span>
          {totals()?.ackPending.toLocaleString() ?? 'Unavailable'}
        </Badge>
      </div>
      <Show
        when={totals()}
        fallback={
          <p class="mt-2">
            Complete consumer details are required to calculate pending
            totals.
          </p>
        }
      >
        <p class="mt-2">
          Consumer deliveries, not unique messages. Pending = not
          delivered; Ack Pending = awaiting acknowledgment, including
          delayed retries.
        </p>
      </Show>
      <Show when={props.stream.consumer_detail?.length}>
        <details
          class="mt-2"
          open={props.expanded ?? localExpanded()}
          onToggle={(event) => {
            const open = event.currentTarget.open;
            if (props.onExpandedChange) props.onExpandedChange(open);
            else setLocalExpanded(open);
          }}
        >
          <summary class="cursor-pointer font-medium text-gray-900 dark:text-white">
            Per-consumer pending deliveries
          </summary>
          <div class="mt-2 overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr>
                  <th scope="col" class="py-1 pr-4">
                    Consumer
                  </th>
                  <th
                    scope="col"
                    class="py-1 pr-4 text-right whitespace-nowrap"
                  >
                    Pending
                  </th>
                  <th
                    scope="col"
                    class="py-1 text-right whitespace-nowrap"
                  >
                    Ack Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={props.stream.consumer_detail}>
                  {(consumer) => (
                    <tr class="border-t border-gray-200 dark:border-white/10">
                      <th scope="row" class="py-2 pr-4 font-normal">
                        <code class="break-all">{consumer.name}</code>
                      </th>
                      <td class="py-2 pr-4 text-right">
                        {consumer.num_pending?.toLocaleString() ??
                          'Unavailable'}
                      </td>
                      <td class="py-2 text-right">
                        {consumer.num_ack_pending?.toLocaleString() ??
                          'Unavailable'}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </details>
      </Show>
    </div>
  );
}
