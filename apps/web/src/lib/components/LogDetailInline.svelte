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

<div class="animate-expand border-l-2 border-accent-cyan/30 bg-surface/30 px-4 py-3">
  <!-- Minimalistic outlined box with all data -->
  <div class="rounded border border-surface-active/50 bg-background/50 p-3">
    <!-- Compact grid of label-value pairs -->
    <div class="grid grid-cols-1 gap-x-6 gap-y-2 text-xs md:grid-cols-2 lg:grid-cols-3">
      <!-- Timestamp -->
      <div class="flex items-center gap-2">
        <span class="font-medium text-text-dim">Timestamp:</span>
        <span class="font-mono text-text-muted">{formatTimestamp(log.ts)}</span>
      </div>

      <!-- User ID -->
      {#if log.userId}
        <div class="flex items-center gap-2">
          <span class="font-medium text-text-dim">User:</span>
          <span class="font-mono text-text-muted">{log.userId}</span>
        </div>
      {/if}

      <!-- Language -->
      {#if log.language}
        <div class="flex items-center gap-2">
          <span class="font-medium text-text-dim">Language:</span>
          <span class="text-text-muted">{log.language}</span>
        </div>
      {/if}

      <!-- Location -->
      {#if log.location}
        <div class="flex items-center gap-2">
          <span class="font-medium text-text-dim">Location:</span>
          <span class="text-text-muted">
            {log.location.city ?? log.location.region ?? log.location.country ?? "Unknown"}
            {#if log.location.lat !== undefined && log.location.lon !== undefined}
              ({log.location.lat.toFixed(2)}, {log.location.lon.toFixed(2)})
            {/if}
          </span>
        </div>
      {/if}

      <!-- Trace ID -->
      {#if log.traceId}
        <div class="flex items-center gap-2">
          <span class="font-medium text-text-dim">Trace ID:</span>
          <span class="truncate font-mono text-text-muted">{log.traceId}</span>
        </div>
      {/if}

      <!-- Node -->
      {#if log.node}
        <div class="flex items-center gap-2">
          <span class="font-medium text-text-dim">Node:</span>
          <span class="text-text-muted">{log.node}</span>
        </div>
      {/if}

      <!-- Intents -->
      {#if log.intents && log.intents.length > 0}
        <div class="flex items-center gap-2 md:col-span-2 lg:col-span-3">
          <span class="font-medium text-text-dim">Intents:</span>
          <div class="flex flex-wrap gap-1.5">
            {#each log.intents as intent}
              <span class="rounded bg-accent-cyan/10 px-1.5 py-0.5 font-mono text-accent-cyan">
                {intent.name}
                {#if intent.confidence !== undefined}
                  ({Math.round(intent.confidence * 100)}%)
                {/if}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Bible Reference -->
      {#if log.reference_extracted}
        <div class="flex items-center gap-2">
          <span class="font-medium text-text-dim">Reference:</span>
          <span class="text-text-muted">
            {log.reference_extracted.book}
            {log.reference_extracted.chapter}:{log.reference_extracted
              .startVerse}{#if log.reference_extracted.endVerse && log.reference_extracted.endVerse !== log.reference_extracted.startVerse}-{log
                .reference_extracted.endVerse}{/if}
          </span>
        </div>
      {/if}

      <!-- Resources -->
      {#if log.resources_searched && log.resources_searched.length > 0}
        <div class="flex items-center gap-2 md:col-span-2 lg:col-span-3">
          <span class="font-medium text-text-dim">Resources:</span>
          <div class="flex flex-wrap gap-1.5">
            {#each log.resources_searched.slice(0, 5) as resource}
              <span class="rounded bg-surface px-1.5 py-0.5 text-text-muted">
                {resource.name}
              </span>
            {/each}
            {#if log.resources_searched.length > 5}
              <span class="text-text-dim">+{log.resources_searched.length - 5} more</span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Full Message -->
      <div class="flex items-start gap-2 md:col-span-2 lg:col-span-3">
        <span class="flex-shrink-0 font-medium text-text-dim">Message:</span>
        <span class="text-text-muted">{log.message}</span>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes expand {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-expand {
    animation: expand 0.2s ease-out;
  }
</style>
