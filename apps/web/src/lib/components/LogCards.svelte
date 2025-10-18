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

  function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }
</script>

<div class="space-y-2 p-4">
  {#each logs as log (log.id)}
    <div
      role="button"
      tabindex="0"
      on:click={() => {
        handleCardClick(log.id);
      }}
      on:keydown={(e) => {
        if (e.key === "Enter") handleCardClick(log.id);
      }}
      class="animate-fade-in rounded-lg border bg-surface p-4 transition
             hover:bg-surface-hover active:scale-98 cursor-pointer"
      class:ring-2={selectedId === log.id}
      class:ring-accent-cyan={selectedId === log.id}
    >
      <!-- Header: Level and Timestamp -->
      <div class="mb-2 flex items-center justify-between">
        <span
          class="rounded border px-2 py-0.5 text-xs font-medium {getLevelColorClass(log.level)}"
        >
          {log.level}
        </span>
        <span class="text-xs text-text-muted">
          {formatTimestamp(log.ts)}
        </span>
      </div>

      <!-- Message -->
      <p class="mb-3 text-sm text-text">
        {truncate(log.message, 150)}
      </p>

      <!-- Metadata -->
      <div class="space-y-1 text-xs">
        {#if log.userId}
          <div class="flex items-center gap-2">
            <span class="text-text-muted">User:</span>
            <span class="text-text-secondary">{log.userId}</span>
          </div>
        {/if}

        {#if log.language}
          <div class="flex items-center gap-2">
            <span class="text-text-muted">Language:</span>
            <span class="text-text-secondary">{log.language}</span>
          </div>
        {/if}

        {#if log.intents && log.intents.length > 0}
          <div class="flex items-center gap-2">
            <span class="text-text-muted">Intent:</span>
            <div class="flex flex-wrap gap-1">
              {#each log.intents.slice(0, 2) as intent}
                <span class="rounded bg-tag-blue px-2 py-0.5 text-xs text-text">
                  {intent.name}
                </span>
              {/each}
              {#if log.intents.length > 2}
                <span class="text-text-dim">
                  +{log.intents.length - 2} more
                </span>
              {/if}
            </div>
          </div>
        {/if}

        {#if log.location}
          <div class="flex items-center gap-2">
            <span class="text-text-muted">Location:</span>
            <span class="text-text-secondary">
              {log.location.region ?? log.location.country ?? "Unknown"}
            </span>
          </div>
        {/if}
      </div>

      <!-- Tap to expand indicator -->
      <div class="mt-2 pt-2 border-t border-surface">
        <span class="text-xs text-text-dim">Tap for details</span>
      </div>
    </div>
  {/each}
</div>
