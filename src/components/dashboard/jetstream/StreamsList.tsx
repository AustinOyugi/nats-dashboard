import { createMemo, createSignal, For, Show } from 'solid-js';

import { useSettings } from '~/components/context/settings';
import type { StreamDetail } from '~/types';
import { formatStream } from '~/lib/format';
import { paginate } from '~/lib/pagination';
import { filterStreams } from '~/lib/streams';
import Dropdown from '~/components/Dropdown';
import Badge, { greenIfPositive } from '~/components/Badge';
import {
  StackedListContainer,
  Header,
  HeaderTitle,
  HeaderControls,
  HeaderButton,
  StackedList,
  ListItem,
  ListPagination,
  PrevButton,
  NextButton,
  PaginationRange,
} from '~/components/dashboard/StackedList';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '~/components/icons';
import SlideOver from '~/components/SlideOver';

import StreamItem from './StreamItem';
import StreamDetails from './StreamDetails';
import { pageSizeOptions } from './options';

/** Sort streams by creation time. */
function byCreationTime(a: StreamDetail, b: StreamDetail) {
  return new Date(a.created).getTime() - new Date(b.created).getTime();
}

interface Props {
  streams: StreamDetail[];
}

export default function StreamsList(props: Props) {
  const [settings, actions] = useSettings();

  const streams = createMemo(() =>
    (props.streams.slice().sort(byCreationTime) ?? []).map(formatStream)
  );

  const [search, setSearch] = createSignal('');
  const filteredStreams = createMemo(() => filterStreams(streams(), search()));
  const [requestedPage, setCurrentPage] = createSignal(1);

  const totalPages = createMemo(() =>
    Math.max(1, Math.ceil(filteredStreams().length / settings.jsz.pageSize))
  );
  // Polling and page-size changes can remove the current page.
  const currentPage = createMemo(() => Math.min(requestedPage(), totalPages()));

  const next = () => setCurrentPage(Math.min(currentPage() + 1, totalPages()));
  const prev = () => setCurrentPage(Math.max(currentPage() - 1, 1));

  const isFirstPage = () => currentPage() === 1;
  const isLastPage = () => currentPage() === totalPages();

  const pageStreams = createMemo(() =>
    paginate(filteredStreams(), settings.jsz.pageSize, currentPage())
  );

  const [selectedName, setSelectedName] = createSignal<string>();
  const selectedStream = createMemo(() =>
    streams().find((s) => s.name === selectedName())
  );

  const numStreams = () => {
    const total = streams().length;
    if (search().trim()) return `${filteredStreams().length} of ${total}`;
    const current = pageStreams().length;

    if (total > 0 && total !== current) {
      return `${current} of ${total}`;
    }

    return total;
  };

  return (
    <>
      <StackedListContainer>
        <Header>
          <HeaderTitle>
            Streams
            <Badge
              type="pill"
              color={greenIfPositive(filteredStreams().length)}
              class="ml-3"
            >
              {numStreams()}
            </Badge>
          </HeaderTitle>

          <HeaderControls>
            <div class="hidden sm:flex items-center gap-2">
              <Show when={totalPages() > 1}>
                <span class="text-xs leading-6 text-gray-900 dark:text-white">
                  Page {currentPage()} of {totalPages()}
                </span>
              </Show>
              <button
                type="button"
                class="flex flex-none items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 disabled:pointer-events-none"
                onClick={prev}
                disabled={isFirstPage()}
              >
                <ChevronLeftIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="flex flex-none items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 disabled:pointer-events-none"
                onClick={next}
                disabled={isLastPage()}
              >
                <ChevronRightIcon class="h-4 w-4" />
              </button>
            </div>

            <Dropdown
              width="20"
              options={pageSizeOptions}
              active={settings.jsz.pageSize}
              onChange={actions.setJszStreamsPageSize}
            >
              <HeaderButton class="flex items-center gap-x-1">
                Display
                <ChevronDownIcon class="h-4 w-4 text-gray-500" />
              </HeaderButton>
            </Dropdown>
          </HeaderControls>
        </Header>

        <div class="border-b border-gray-200 dark:border-white/5 px-4 py-4 sm:px-6 lg:px-8">
          <label for="stream-search" class="sr-only">
            Filter streams by name or subject
          </label>
          <input
            id="stream-search"
            type="search"
            spellcheck={false}
            placeholder="Filter by stream name or subject"
            aria-describedby="stream-search-help"
            class="block w-full rounded-md border-gray-300 text-sm text-gray-900 placeholder:text-gray-500 focus:border-sky-500 focus:ring-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-400"
            value={search()}
            onInput={(e) => {
              setSearch(e.currentTarget.value);
              setCurrentPage(1);
            }}
          />
          <p
            id="stream-search-help"
            class="mt-2 text-xs text-gray-500 dark:text-gray-400"
          >
            <Show
              when={settings.jsz.query.config}
              fallback="Enable Config above to display and filter configured subjects."
            >
              Filter across all streams and their configured subjects.
            </Show>
          </p>
        </div>

        <StackedList>
          <For
            each={pageStreams()}
            fallback={
              <ListItem>
                {search().trim()
                  ? 'No streams match your filter.'
                  : 'No streams to display.'}
              </ListItem>
            }
          >
            {(stream) => (
              <StreamItem stream={stream} onClick={setSelectedName} />
            )}
          </For>
        </StackedList>

        <Show when={totalPages() > 1}>
          <ListPagination>
            <PrevButton onClick={prev} disabled={isFirstPage()} />
            <PaginationRange
              totalPages={totalPages()}
              currentPage={currentPage()}
              onChange={setCurrentPage}
            />
            <NextButton onClick={next} disabled={isLastPage()} />
          </ListPagination>
        </Show>
      </StackedListContainer>

      {/* Slide over for stream details. */}
      <Show when={selectedStream()}>
        {(stream) => (
          <SlideOver
            title="Stream Info"
            onClose={() => setSelectedName(undefined)}
            size="xl"
          >
            <StreamDetails stream={stream()} />
          </SlideOver>
        )}
      </Show>
    </>
  );
}
