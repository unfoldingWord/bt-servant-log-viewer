<script lang="ts">
  import type { LogEntry } from "@bt-log-viewer/domain";

  export let log: LogEntry;

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    }).format(date);
  }
</script>

<div class="inline-detail animate-expand bg-gradient-to-r from-accent-cyan/5 to-transparent">
  <div class="border-l-4 border-accent-cyan/50 bg-background/95 p-4">
    <!-- Compact grid layout -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Left column: Message & Metadata -->
      <div class="space-y-3 lg:col-span-2">
        <!-- Full message -->
        <div>
          <div class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-text-dim">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            Message
          </div>
          <p class="text-sm leading-relaxed text-text">{log.message}</p>
        </div>

        <!-- Metadata grid -->
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-surface-active bg-surface/50 p-2">
            <div class="mb-0.5 text-xs font-medium text-text-dim">Timestamp</div>
            <div class="font-mono text-xs text-text-secondary">{formatTimestamp(log.ts)}</div>
          </div>

          {#if log.userId}
            <div class="rounded-lg border border-surface-active bg-surface/50 p-2">
              <div class="mb-0.5 text-xs font-medium text-text-dim">User ID</div>
              <div class="font-mono text-xs text-text-secondary">{log.userId}</div>
            </div>
          {/if}

          {#if log.language}
            <div class="rounded-lg border border-surface-active bg-surface/50 p-2">
              <div class="mb-0.5 text-xs font-medium text-text-dim">Language</div>
              <div class="text-xs text-text-secondary">{log.language}</div>
            </div>
          {/if}

          {#if log.location}
            <div class="rounded-lg border border-surface-active bg-surface/50 p-2">
              <div class="mb-0.5 text-xs font-medium text-text-dim">Location</div>
              <div class="text-xs text-text-secondary">
                {log.location.city ?? log.location.region ?? log.location.country ?? "Unknown"}
                {#if log.location.lat !== undefined && log.location.lon !== undefined}
                  <span class="text-text-dim">
                    ({log.location.lat.toFixed(2)}, {log.location.lon.toFixed(2)})
                  </span>
                {/if}
              </div>
            </div>
          {/if}

          {#if log.traceId}
            <div class="rounded-lg border border-surface-active bg-surface/50 p-2">
              <div class="mb-0.5 text-xs font-medium text-text-dim">Trace ID</div>
              <div class="truncate font-mono text-xs text-text-secondary">{log.traceId}</div>
            </div>
          {/if}

          {#if log.node}
            <div class="rounded-lg border border-surface-active bg-surface/50 p-2">
              <div class="mb-0.5 text-xs font-medium text-text-dim">Node</div>
              <div class="text-xs text-text-secondary">{log.node}</div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Right column: Intents & Resources -->
      <div class="space-y-3">
        {#if log.intents && log.intents.length > 0}
          <div class="rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 p-3">
            <div
              class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-text-dim"
            >
              <svg
                class="h-3 w-3 text-accent-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Intents
            </div>
            <div class="space-y-1.5">
              {#each log.intents as intent}
                <div
                  class="flex items-center justify-between rounded-md bg-background/50 px-2 py-1"
                >
                  <span class="text-xs font-medium text-text">{intent.name}</span>
                  {#if intent.confidence !== undefined}
                    <span class="text-xs text-accent-cyan">
                      {Math.round(intent.confidence * 100)}%
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if log.reference_extracted}
          <div class="rounded-lg border border-accent-teal/20 bg-accent-teal/5 p-3">
            <div
              class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-text-dim"
            >
              <svg
                class="h-3 w-3 text-accent-teal"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Bible Reference
            </div>
            <div class="rounded-md bg-background/50 px-2 py-1">
              <span class="text-xs font-medium text-text"
                >{log.reference_extracted.book}
                {log.reference_extracted.chapter}:{log.reference_extracted
                  .startVerse}{#if log.reference_extracted.endVerse && log.reference_extracted.endVerse !== log.reference_extracted.startVerse}-{log
                    .reference_extracted.endVerse}{/if}</span
              >
            </div>
          </div>
        {/if}

        {#if log.resources_searched && log.resources_searched.length > 0}
          <div class="rounded-lg border border-surface-active bg-surface/50 p-3">
            <div
              class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-text-dim"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              Resources
            </div>
            <div class="space-y-1">
              {#each log.resources_searched.slice(0, 5) as resource}
                <div class="rounded-md bg-background/50 px-2 py-1 text-xs text-text-secondary">
                  {resource.name}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes expand {
    from {
      opacity: 0;
      max-height: 0;
      transform: scaleY(0.8);
    }
    to {
      opacity: 1;
      max-height: 500px;
      transform: scaleY(1);
    }
  }

  .animate-expand {
    animation: expand 0.2s ease-out forwards;
    transform-origin: top;
  }
</style>
