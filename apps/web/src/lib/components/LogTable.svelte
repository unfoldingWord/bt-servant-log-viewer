<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";
  import LogDetailInline from "./LogDetailInline.svelte";

  export let logs: LogEntry[];
  export let selectedId: string | null = null;
  export let selectedLog: LogEntry | null = null;

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{ select: string }>();

  function handleRowClick(logId: string): void {
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

  function getLevelBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      TRACE: "bg-level-trace/10 text-level-trace border-level-trace/30",
      DEBUG: "bg-level-debug/10 text-level-debug border-level-debug/30",
      INFO: "bg-level-info/10 text-level-info border-level-info/30",
      WARN: "bg-level-warn/10 text-level-warn border-level-warn/30",
      ERROR: "bg-level-error/10 text-level-error border-level-error/30",
    };
    return classes[level] ?? "bg-surface text-text-muted border-surface";
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

<div
  class="h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-background to-background-secondary/20"
>
  <table class="w-full border-separate border-spacing-0">
    <thead class="sticky top-0 z-10">
      <tr
        class="bg-gradient-to-r from-background-secondary via-background-secondary to-background backdrop-blur-sm"
      >
        <th class="px-4 py-3.5 text-left">
          <div
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Timestamp
          </div>
        </th>
        <th class="px-4 py-3.5 text-left">
          <div
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted"
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Level
          </div>
        </th>
        <th class="px-4 py-3.5 text-left">
          <div
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted"
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
            User
          </div>
        </th>
        <th class="px-4 py-3.5 text-left">
          <div
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted"
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
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            Message
          </div>
        </th>
      </tr>
      <tr>
        <th
          colspan="4"
          class="h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent"
        ></th>
      </tr>
    </thead>
    <tbody class="text-sm">
      {#each logs as log, i (log.id)}
        <tr
          on:click={() => {
            handleRowClick(log.id);
          }}
          style="animation-delay: {i * 20}ms"
          class="log-row group relative cursor-pointer border-b border-surface/50 hover:bg-gradient-to-r hover:from-accent-cyan/5 hover:via-accent-teal/5 hover:to-transparent"
          class:selected-row={selectedId === log.id}
        >
          <td class="relative px-4 py-3.5">
            <div class="flex items-center gap-2">
              <div
                class="h-1.5 w-1.5 rounded-full bg-accent-cyan/50 group-hover:bg-accent-cyan"
              ></div>
              <span class="font-mono text-xs text-text-muted">
                {formatTimestamp(log.ts)}
              </span>
            </div>
          </td>

          <td class="relative px-4 py-3.5">
            <span
              class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold {getLevelBadgeClass(
                log.level
              )}"
            >
              <span class="text-sm leading-none">{getLevelIcon(log.level)}</span>
              {log.level}
            </span>
          </td>

          <td class="relative px-4 py-3.5">
            <div class="flex items-center gap-2">
              {#if log.userId}
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-teal/20 text-xs font-medium text-accent-cyan ring-1 ring-accent-cyan/30 group-hover:ring-accent-cyan/50"
                >
                  {log.userId.substring(0, 2).toUpperCase()}
                </div>
                <span class="font-mono text-xs text-text-secondary">
                  {log.userId}
                </span>
              {:else}
                <span class="text-text-dim">—</span>
              {/if}
            </div>
          </td>

          <td class="relative max-w-md px-4 py-3.5">
            <p class="leading-relaxed truncate text-text">
              {log.message}
            </p>
          </td>
        </tr>

        <!-- Inline detail row (expands below the clicked row) -->
        {#if selectedId === log.id && selectedLog}
          <tr class="detail-row">
            <td colspan="4" class="p-0">
              <LogDetailInline log={selectedLog} />
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  @keyframes glow {
    0%,
    100% {
      box-shadow: 0 0 5px rgba(34, 211, 238, 0.2);
    }
    50% {
      box-shadow:
        0 0 20px rgba(34, 211, 238, 0.4),
        0 0 30px rgba(6, 182, 212, 0.2);
    }
  }

  .selected-row {
    background: linear-gradient(to right, rgb(34 211 238 / 0.08), transparent);
    border-left: 3px solid rgb(34 211 238);
    box-shadow: inset 0 0 20px rgba(34, 211, 238, 0.1);
  }

  .selected-row td:first-child {
    padding-left: calc(1rem - 3px);
  }

  .log-row:hover {
    transform: scale(1.002);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(34, 211, 238, 0.1);
  }

  thead tr:first-child {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
</style>
