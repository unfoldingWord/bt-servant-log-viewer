<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  export let logs: LogEntry[];
  export let selectedId: string | null = null;

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{ select: string }>();

  function handleCardClick(logId: string): void {
    dispatch("select", logId);
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function getLevelBadgeClass(level: string): string {
    const colors: Record<string, string> = {
      TRACE: "bg-level-trace/10 text-level-trace border-level-trace/30",
      DEBUG: "bg-level-debug/10 text-level-debug border-level-debug/30",
      INFO: "bg-level-info/10 text-level-info border-level-info/30",
      WARN: "bg-level-warn/10 text-level-warn border-level-warn/30",
      ERROR: "bg-level-error/10 text-level-error border-level-error/30",
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

  function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }
</script>

<div class="space-y-3 p-3">
  {#each logs as log, i (log.id)}
    <div
      role="button"
      tabindex="0"
      on:click={() => {
        handleCardClick(log.id);
      }}
      on:keydown={(e) => {
        if (e.key === "Enter") handleCardClick(log.id);
      }}
      style="animation-delay: {i * 30}ms"
      class="log-card group relative overflow-hidden rounded-xl border border-surface-active bg-gradient-to-br from-surface to-surface/50 p-4 shadow-lg transition-all duration-300 active:scale-[0.98] cursor-pointer"
      class:selected-card={selectedId === log.id}
    >
      <!-- Gradient accent line at top -->
      <div
        class="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-accent-cyan via-accent-teal to-accent-cyan"
      ></div>

      <!-- Glow effect on selection -->
      {#if selectedId === log.id}
        <div
          class="absolute inset-0 -z-10 bg-gradient-to-br from-accent-cyan/10 to-accent-teal/5"
        ></div>
      {/if}

      <!-- Header: Level Badge and Timestamp -->
      <div class="mb-3 flex items-start justify-between gap-3">
        <span
          class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all group-active:scale-95 {getLevelBadgeClass(
            log.level
          )}"
        >
          <span class="text-sm leading-none">{getLevelIcon(log.level)}</span>
          {log.level}
        </span>

        <div class="flex flex-col items-end gap-1">
          <div class="flex items-center gap-1.5">
            <div
              class="h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_4px_rgba(34,211,238,0.6)]"
            ></div>
            <span class="font-mono text-xs text-text-muted">
              {formatTimestamp(log.ts)}
            </span>
          </div>
        </div>
      </div>

      <!-- Message with gradient fade -->
      <div class="relative mb-3">
        <p class="text-sm leading-relaxed text-text">
          {truncate(log.message, 120)}
        </p>
        {#if log.message.length > 120}
          <div
            class="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-surface to-transparent"
          ></div>
        {/if}
      </div>

      <!-- Metadata Grid -->
      <div class="mb-3 grid grid-cols-2 gap-2">
        {#if log.userId}
          <div class="flex items-center gap-2 rounded-lg bg-background/50 p-2">
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-teal/20 text-xs font-bold text-accent-cyan ring-1 ring-accent-cyan/30"
            >
              {log.userId.substring(0, 2).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-text-dim">User</div>
              <div class="truncate font-mono text-xs text-text-secondary">
                {log.userId}
              </div>
            </div>
          </div>
        {/if}

        {#if log.language}
          <div class="flex items-center gap-2 rounded-lg bg-background/50 p-2">
            <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center">
              <svg
                class="h-5 w-5 text-accent-teal"
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
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-text-dim">Language</div>
              <div class="truncate text-xs font-medium text-text-secondary">
                {log.language}
              </div>
            </div>
          </div>
        {/if}

        {#if log.location}
          <div class="flex items-center gap-2 rounded-lg bg-background/50 p-2">
            <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-text-dim">Location</div>
              <div class="truncate text-xs font-medium text-text-secondary">
                {log.location.city ?? log.location.region ?? log.location.country ?? "Unknown"}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Intents -->
      {#if log.intents && log.intents.length > 0}
        <div class="mb-3 rounded-lg bg-gradient-to-br from-accent-cyan/5 to-accent-teal/5 p-3">
          <div class="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-muted">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Intents
          </div>
          <div class="flex flex-wrap gap-1.5">
            {#each log.intents.slice(0, 3) as intent}
              <span
                class="inline-flex items-center gap-1 rounded-md bg-accent-cyan/10 px-2 py-1 text-xs font-medium text-accent-cyan ring-1 ring-accent-cyan/20"
              >
                {intent.name}
                {#if intent.confidence !== undefined}
                  <span class="rounded-full bg-accent-cyan/20 px-1.5 text-xs">
                    {Math.round(intent.confidence * 100)}%
                  </span>
                {/if}
              </span>
            {/each}
            {#if log.intents.length > 3}
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal/20 text-xs font-medium text-accent-teal"
              >
                +{log.intents.length - 3}
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Footer: Tap indicator with chevron -->
      <div class="flex items-center justify-between border-t border-surface pt-2.5">
        <span class="text-xs font-medium text-accent-cyan">Tap for full details</span>
        <svg
          class="h-4 w-4 text-accent-cyan transition-transform group-active:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  {/each}
</div>

<style>
  @keyframes cardSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .log-card {
    animation: cardSlideIn 0.4s ease-out forwards;
  }

  .selected-card {
    border-color: rgb(34 211 238 / 0.5);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 0 0 2px rgba(34, 211, 238, 0.2),
      inset 0 0 30px rgba(34, 211, 238, 0.05);
  }

  .log-card:active {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
</style>
