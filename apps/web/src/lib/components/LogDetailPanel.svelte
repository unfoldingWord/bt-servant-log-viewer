<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  export let log: LogEntry | null = null;
  export let isOpen = false;
  export let isSplitView = false; // true for desktop split pane, false for mobile overlay

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{ close: null }>();

  function handleClose(): void {
    dispatch("close", null);
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

  function getLevelIcon(level: string): string {
    const icons: Record<string, string> = {
      TRACE: "○",
      DEBUG: "◐",
      INFO: "●",
      WARN: "▲",
      ERROR: "✕",
    };
    return icons[level] ?? "○";
  }
</script>

{#if isOpen && log}
  {#if !isSplitView}
    <!-- Overlay for mobile with fade-in -->
    <div
      on:click={handleClose}
      on:keydown={(e) => {
        if (e.key === "Escape") handleClose();
      }}
      role="button"
      tabindex="0"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-fade-in"
    ></div>
  {/if}

  <!-- Detail Panel - adapts to split view or overlay mode -->
  <aside
    class={isSplitView
      ? "h-full overflow-y-auto bg-background"
      : "fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t-2 border-accent-cyan/40 bg-gradient-to-b from-background-secondary to-background shadow-2xl shadow-black/20 animate-slide-up"}
  >
    <!-- Gradient accent line (only for overlay mode) -->
    {#if !isSplitView}
      <div
        class="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-accent-cyan via-accent-teal to-accent-cyan"
      ></div>
    {/if}

    <!-- Header with better styling -->
    <div
      class="sticky top-0 z-10 flex items-center justify-between border-b-2 border-surface/50 bg-gradient-to-r from-background-secondary via-background-secondary to-background px-5 py-4 shadow-md backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-teal/20 shadow-md shadow-accent-cyan/10"
        >
          <svg
            class="h-5 w-5 text-accent-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-text">Log Details</h2>
      </div>
      <button
        type="button"
        on:click={handleClose}
        class="group rounded-xl border border-surface-active bg-surface p-2 text-text-muted shadow-sm transition-colors transition-shadow duration-200 hover:border-accent-cyan/50 hover:bg-accent-cyan/10 hover:text-accent-cyan hover:shadow-md hover:shadow-accent-cyan/20"
        aria-label="Close panel"
      >
        <svg
          class="h-5 w-5 transition-transform group-hover:rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Content with staggered animations -->
    <div class="space-y-4 p-5">
      <!-- Level Badge with enhanced styling -->
      <div class="flex flex-wrap items-center gap-3 animate-fade-in" style="animation-delay: 50ms">
        <span
          class="inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold shadow-md transition-colors transition-shadow {getLevelColorClass(
            log.level
          )}"
        >
          <span class="text-base leading-none">{getLevelIcon(log.level)}</span>
          {log.level}
          <span class="ml-1 h-2 w-2 rounded-full bg-current animate-pulse"></span>
        </span>
        <span class="text-xs font-medium text-text-dim">{formatTimestamp(log.ts)}</span>
      </div>

      <!-- Message with gradient border -->
      <div
        class="group rounded-xl border-2 border-accent-cyan/20 bg-gradient-to-br from-surface to-surface/50 p-4 shadow-md transition-all hover:border-accent-cyan/40 hover:shadow-lg animate-fade-in"
        style="animation-delay: 100ms"
      >
        <h3
          class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-cyan"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          Message
        </h3>
        <p class="text-sm leading-relaxed text-text">{log.message}</p>
      </div>

      <!-- Metadata Grid with staggered animations -->
      <div class="grid gap-3">
        {#if log.userId}
          <div
            class="group rounded-xl border border-surface-active bg-surface p-3.5 shadow-sm transition-all hover:border-accent-cyan/30 hover:bg-surface-hover hover:shadow-md animate-fade-in"
            style="animation-delay: 150ms"
          >
            <h3
              class="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
            >
              <svg
                class="h-3.5 w-3.5 text-accent-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              User ID
            </h3>
            <p class="font-mono text-sm font-medium text-accent-cyan">{log.userId}</p>
          </div>
        {/if}

        {#if log.language}
          <div
            class="group rounded-xl border border-surface-active bg-surface p-3.5 shadow-sm transition-all hover:border-accent-teal/30 hover:bg-surface-hover hover:shadow-md animate-fade-in"
            style="animation-delay: 175ms"
          >
            <h3
              class="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
            >
              <svg
                class="h-3.5 w-3.5 text-accent-teal"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              Language
            </h3>
            <p class="text-sm font-medium uppercase text-text-secondary">{log.language}</p>
          </div>
        {/if}

        {#if log.logger}
          <div
            class="group rounded-xl border border-surface-active bg-surface p-3.5 shadow-sm transition-all hover:border-accent-cyan/30 hover:bg-surface-hover hover:shadow-md animate-fade-in"
            style="animation-delay: 200ms"
          >
            <h3
              class="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
            >
              <svg
                class="h-3.5 w-3.5 text-accent-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Logger
            </h3>
            <p class="font-mono text-xs font-medium text-text-secondary">{log.logger}</p>
          </div>
        {/if}
      </div>

      <!-- Intents with enhanced styling -->
      {#if log.intents && log.intents.length > 0}
        <div
          class="rounded-xl border-2 border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/5 to-accent-teal/5 p-4 shadow-md animate-fade-in"
          style="animation-delay: 225ms"
        >
          <h3
            class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-cyan"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Intents ({log.intents.length})
          </h3>
          <div class="space-y-2.5">
            {#each log.intents as intent, i}
              <div
                class="group rounded-xl border border-accent-cyan/30 bg-background p-3.5 shadow-sm transition-all hover:border-accent-cyan/50 hover:shadow-md"
                style="animation-delay: {250 + i * 25}ms"
              >
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-bold text-accent-cyan">{intent.name}</span>
                  {#if intent.confidence !== undefined}
                    <span
                      class="rounded-full bg-gradient-to-r from-accent-cyan/20 to-accent-teal/20 px-2.5 py-1 text-xs font-bold text-accent-cyan shadow-sm"
                    >
                      {Math.round(intent.confidence * 100)}%
                    </span>
                  {/if}
                </div>
                {#if intent.parameters && Object.keys(intent.parameters).length > 0}
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    {#each Object.entries(intent.parameters) as [key, value]}
                      <span
                        class="rounded-lg bg-accent-teal/20 px-2.5 py-1 text-xs font-medium text-accent-teal shadow-sm"
                      >
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
        <div
          class="group rounded-xl border border-surface-active bg-surface p-3.5 shadow-sm transition-all hover:border-accent-teal/30 hover:bg-surface-hover hover:shadow-md animate-fade-in"
          style="animation-delay: 250ms"
        >
          <h3
            class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
          >
            <svg
              class="h-3.5 w-3.5 text-accent-teal"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Location
          </h3>
          <div class="space-y-1 text-sm font-medium text-text-secondary">
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
      {#if log.cid ?? log.traceId}
        <div
          class="group rounded-xl border border-surface-active bg-surface p-3.5 shadow-sm transition-all hover:border-accent-cyan/30 hover:bg-surface-hover hover:shadow-md animate-fade-in"
          style="animation-delay: 275ms"
        >
          <h3
            class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
          >
            <svg
              class="h-3.5 w-3.5 text-accent-cyan"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Session
          </h3>
          <div class="space-y-1.5 font-mono text-xs font-medium text-text-secondary">
            {#if log.cid}
              <p>Conversation: {log.cid}</p>
            {/if}
            {#if log.traceId}
              <p>Trace: {log.traceId}</p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Raw JSON (expandable) with enhanced styling -->
      <details
        class="group rounded-xl border-2 border-surface-active bg-surface shadow-sm transition-all hover:border-accent-cyan/30 hover:shadow-md animate-fade-in"
        style="animation-delay: 300ms"
      >
        <summary
          class="cursor-pointer px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-text-muted transition-all hover:text-accent-cyan"
        >
          <span class="inline-flex items-center gap-2">
            <svg
              class="h-4 w-4 transition-all duration-300 group-open:rotate-90 group-open:text-accent-cyan"
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
            Raw JSON Data
          </span>
        </summary>
        <div class="border-t-2 border-surface-active p-4">
          <pre
            class="overflow-x-auto rounded-lg bg-background p-4 font-mono text-xs text-text-secondary shadow-inner"><code
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
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slide-left {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-slide-left {
    animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
    opacity: 0;
  }
</style>
