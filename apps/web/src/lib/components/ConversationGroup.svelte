<script lang="ts">
  import type { LogEntry, PerfReport } from "@bt-log-viewer/domain";
  import IntentGraph from "./IntentGraph.svelte";
  import LogDetailInline from "./LogDetailInline.svelte";

  export let logs: LogEntry[];
  export let firstLog: LogEntry;
  export let perfReport: PerfReport | undefined;

  let expanded = false;
  let selectedLogId: string | null = null;

  $: selectedLog = selectedLogId ? (logs.find((log) => log.id === selectedLogId) ?? null) : null;

  function handleLogClick(logId: string): void {
    // Toggle selection: if clicking same log, deselect it
    selectedLogId = selectedLogId === logId ? null : logId;
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

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function formatCost(cost: number | undefined): string {
    if (cost === undefined || cost === 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
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

<div class="border-b border-surface/50 bg-background transition-all">
  <!-- Collapsed header -->
  <button
    type="button"
    on:click={() => {
      expanded = !expanded;
    }}
    class="group w-full px-6 py-4 text-left transition-all hover:bg-gradient-to-r hover:from-accent-cyan/5 hover:via-accent-teal/5 hover:to-transparent md:px-8"
  >
    <div class="flex items-center gap-4">
      <!-- Expand/collapse icon -->
      <div class="flex-shrink-0">
        <svg
          class="h-5 w-5 text-accent-cyan transition-transform duration-200 {expanded
            ? 'rotate-90'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <!-- Conversation info -->
      <div class="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <!-- First message preview -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-text group-hover:text-text transition-colors truncate">
            {firstLog.message}
          </p>
        </div>

        <!-- Metadata -->
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <!-- Timestamp -->
          <div class="flex items-center gap-1.5">
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
            <span class="font-mono text-text-muted">{formatTimestamp(firstLog.ts)}</span>
          </div>

          <!-- Duration -->
          {#if perfReport?.total_ms !== undefined}
            <div class="flex items-center gap-1.5">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span class="font-mono text-text-secondary"
                >{formatDuration(perfReport.total_ms)}</span
              >
            </div>
          {/if}

          <!-- Cost -->
          {#if perfReport?.total_cost_usd !== undefined}
            <div class="flex items-center gap-1.5">
              <svg
                class="h-3.5 w-3.5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="font-mono text-green-400">{formatCost(perfReport.total_cost_usd)}</span>
            </div>
          {/if}

          <!-- Log count -->
          <div
            class="flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 px-2.5 py-0.5"
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
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span class="font-medium text-accent-cyan"
              >{logs.length} log{logs.length !== 1 ? "s" : ""}</span
            >
          </div>
        </div>
      </div>
    </div>
  </button>

  <!-- Expanded content -->
  {#if expanded}
    <div class="border-t border-surface/30 bg-background-secondary/30">
      <!-- Intent Flow Visualization -->
      {#if perfReport}
        <IntentGraph perfReports={[perfReport]} {logs} />
      {/if}

      <!-- Log entries table -->
      <div class="overflow-x-auto px-6 pb-4 md:px-8">
        <table class="w-full border-separate border-spacing-0">
          <thead>
            <tr class="bg-background-secondary/50">
              <th class="px-4 py-2 text-left">
                <div class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Timestamp
                </div>
              </th>
              <th class="px-4 py-2 text-left">
                <div class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Level
                </div>
              </th>
              <th class="px-4 py-2 text-left">
                <div class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Message
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="text-sm">
            {#each logs as log}
              <tr
                on:click={() => {
                  handleLogClick(log.id);
                }}
                class="cursor-pointer border-b border-surface/30 hover:bg-surface/20 transition-colors"
                class:selected-row={selectedLogId === log.id}
              >
                <td class="px-4 py-2.5">
                  <span class="font-mono text-xs text-text-muted">
                    {formatTimestamp(log.ts)}
                  </span>
                </td>
                <td class="px-4 py-2.5">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold {getLevelBadgeClass(
                      log.level
                    )}"
                  >
                    <span class="text-sm leading-none">{getLevelIcon(log.level)}</span>
                    {log.level}
                  </span>
                </td>
                <td class="px-4 py-2.5 max-w-md">
                  <p class="text-text leading-relaxed truncate">{log.message}</p>
                </td>
              </tr>

              <!-- Inline detail row (expands below the clicked row) -->
              {#if selectedLogId === log.id && selectedLog}
                <tr class="detail-row">
                  <td colspan="3" class="p-0">
                    <LogDetailInline log={selectedLog} />
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .selected-row {
    background: linear-gradient(to right, rgb(34 211 238 / 0.08), transparent);
    border-left: 3px solid rgb(34 211 238);
    box-shadow: inset 0 0 20px rgba(34, 211, 238, 0.1);
  }

  .selected-row td:first-child {
    padding-left: calc(1rem - 3px);
  }
</style>
