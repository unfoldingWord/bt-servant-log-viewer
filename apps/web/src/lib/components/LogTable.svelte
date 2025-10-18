<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  export let logs: LogEntry[];
  export let selectedId: string | null = null;

  const dispatch = createEventDispatcher<{ select: string }>();

  function handleRowClick(logId: string) {
    dispatch("select", logId);
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }

  function getLevelColorClass(level: string): string {
    const colors: Record<string, string> = {
      TRACE: "text-level-trace",
      DEBUG: "text-level-debug",
      INFO: "text-level-info",
      WARN: "text-level-warn",
      ERROR: "text-level-error",
    };
    return colors[level] || "text-text-muted";
  }

  function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }
</script>

<div class="h-full overflow-auto">
  <table class="w-full">
    <thead class="sticky top-0 bg-background-secondary text-left text-xs text-text-muted">
      <tr class="border-b border-surface">
        <th class="px-4 py-3 font-medium">Timestamp</th>
        <th class="px-4 py-3 font-medium">Level</th>
        <th class="px-4 py-3 font-medium">User</th>
        <th class="px-4 py-3 font-medium">Message</th>
        <th class="px-4 py-3 font-medium">Language</th>
        <th class="px-4 py-3 font-medium">Intent</th>
      </tr>
    </thead>
    <tbody class="text-sm">
      {#each logs as log (log.id)}
        <tr
          on:click={() => handleRowClick(log.id)}
          class="cursor-pointer border-b border-surface transition
                 hover:bg-surface-hover"
          class:bg-surface={selectedId === log.id}
        >
          <td class="whitespace-nowrap px-4 py-3 text-text-muted">
            {formatTimestamp(log.ts)}
          </td>
          <td class="whitespace-nowrap px-4 py-3 font-medium {getLevelColorClass(log.level)}">
            {log.level}
          </td>
          <td class="whitespace-nowrap px-4 py-3 text-text-secondary">
            {log.userId || "-"}
          </td>
          <td class="max-w-md px-4 py-3 text-text">
            {truncate(log.message, 100)}
          </td>
          <td class="whitespace-nowrap px-4 py-3 text-text-muted">
            {log.language || "-"}
          </td>
          <td class="max-w-xs px-4 py-3 text-text-secondary">
            {#if log.intents && log.intents.length > 0}
              <span class="rounded bg-tag-blue px-2 py-0.5 text-xs">
                {log.intents[0]?.name}
              </span>
              {#if log.intents.length > 1}
                <span class="ml-1 text-xs text-text-dim">
                  +{log.intents.length - 1}
                </span>
              {/if}
            {:else}
              -
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
