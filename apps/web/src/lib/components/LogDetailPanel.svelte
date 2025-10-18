<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  export let log: LogEntry | null = null;
  export let isOpen = false;

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{ close: void }>();

  function handleClose(): void {
    dispatch("close");
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  function getLevelColorClass(level: string): string {
    const colors: Record<string, string> = {
      TRACE: "bg-level-trace/10 text-level-trace border-level-trace",
      DEBUG: "bg-level-debug/10 text-level-debug border-level-debug",
      INFO: "bg-level-info/10 text-level-info border-level-info",
      WARN: "bg-level-warn/10 text-level-warn border-level-warn",
      ERROR: "bg-level-error/10 text-level-error border-level-error",
    };
    return colors[level] ?? "bg-surface text-text-muted border-surface";
  }
</script>

{#if isOpen && log}
  <!-- Overlay for mobile -->
  <div
    on:click={handleClose}
    on:keydown={(e) => {
      if (e.key === "Escape") handleClose();
    }}
    role="button"
    tabindex="0"
    class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
  ></div>

  <!-- Detail Panel -->
  <aside
    class="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t-2 border-accent-cyan/30 bg-background-secondary shadow-2xl animate-slide-up
           md:bottom-auto md:right-0 md:top-0 md:w-96 md:rounded-none md:rounded-l-2xl md:border-l-2 md:border-t-0 md:animate-slide-left lg:w-[28rem]"
  >
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex items-center justify-between border-b border-surface bg-gradient-to-r from-background-secondary to-background px-4 py-3 backdrop-blur-sm md:px-5"
    >
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 class="text-lg font-semibold text-text">Log Details</h2>
      </div>
      <button
        type="button"
        on:click={handleClose}
        class="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-accent-cyan"
        aria-label="Close panel"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="space-y-4 p-4 md:p-5">
      <!-- Level Badge -->
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium {getLevelColorClass(
            log.level
          )}"
        >
          <span class="h-2 w-2 rounded-full bg-current animate-pulse"></span>
          {log.level}
        </span>
        <span class="text-xs text-text-dim">{formatTimestamp(log.ts)}</span>
      </div>

      <!-- Message -->
      <div class="rounded-lg border border-surface-active bg-surface p-4">
        <h3 class="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Message</h3>
        <p class="text-sm leading-relaxed text-text">{log.message}</p>
      </div>

      <!-- Metadata Grid -->
      <div class="grid gap-3">
        {#if log.userId}
          <div class="rounded-lg border border-surface-active bg-surface p-3">
            <h3 class="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
              User ID
            </h3>
            <p class="font-mono text-sm text-accent-cyan">{log.userId}</p>
          </div>
        {/if}

        {#if log.language}
          <div class="rounded-lg border border-surface-active bg-surface p-3">
            <h3 class="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
              Language
            </h3>
            <p class="text-sm text-text-secondary">{log.language}</p>
          </div>
        {/if}

        {#if log.logger}
          <div class="rounded-lg border border-surface-active bg-surface p-3">
            <h3 class="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
              Logger
            </h3>
            <p class="font-mono text-xs text-text-secondary">{log.logger}</p>
          </div>
        {/if}
      </div>

      <!-- Intents -->
      {#if log.intents && log.intents.length > 0}
        <div class="rounded-lg border border-surface-active bg-surface p-4">
          <h3 class="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Intents</h3>
          <div class="space-y-2">
            {#each log.intents as intent}
              <div class="rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 p-3">
                <div class="mb-1 flex items-center justify-between">
                  <span class="font-medium text-accent-cyan">{intent.name}</span>
                  {#if intent.confidence !== undefined}
                    <span
                      class="rounded-full bg-accent-cyan/20 px-2 py-0.5 text-xs font-medium text-accent-cyan"
                    >
                      {Math.round(intent.confidence * 100)}%
                    </span>
                  {/if}
                </div>
                {#if intent.parameters && Object.keys(intent.parameters).length > 0}
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    {#each Object.entries(intent.parameters) as [key, value]}
                      <span class="rounded bg-accent-teal/20 px-2 py-0.5 text-xs text-accent-teal">
                        {key}: {value}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Location -->
      {#if log.location}
        <div class="rounded-lg border border-surface-active bg-surface p-3">
          <h3 class="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
            Location
          </h3>
          <div class="space-y-1 text-sm text-text-secondary">
            {#if log.location.country}
              <p>Country: {log.location.country}</p>
            {/if}
            {#if log.location.region}
              <p>Region: {log.location.region}</p>
            {/if}
            {#if log.location.city}
              <p>City: {log.location.city}</p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Session Info -->
      {#if log.cid || log.traceId}
        <div class="rounded-lg border border-surface-active bg-surface p-3">
          <h3 class="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Session</h3>
          <div class="space-y-1 font-mono text-xs text-text-secondary">
            {#if log.cid}
              <p>Conversation: {log.cid}</p>
            {/if}
            {#if log.traceId}
              <p>Trace: {log.traceId}</p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Raw JSON (expandable) -->
      <details class="group rounded-lg border border-surface-active bg-surface">
        <summary
          class="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted transition hover:text-accent-cyan"
        >
          <span class="inline-flex items-center gap-2">
            <svg
              class="h-4 w-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            Raw JSON
          </span>
        </summary>
        <div class="border-t border-surface-active p-4">
          <pre
            class="overflow-x-auto rounded bg-background p-3 font-mono text-xs text-text-secondary"><code
              >{JSON.stringify(log, null, 2)}</code
            ></pre>
        </div>
      </details>
    </div>
  </aside>
{/if}

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slide-left {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  .animate-slide-left {
    animation: slide-left 0.3s ease-out;
  }
</style>
