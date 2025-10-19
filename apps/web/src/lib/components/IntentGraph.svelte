<script lang="ts">
  import type { PerfReport, Span } from "@bt-log-viewer/domain";

  export let perfReports: PerfReport[] = [];

  let selectedNode: Span | null = null;

  // Aggregate all spans from all perfReports for this user
  $: allSpans = perfReports.flatMap((report) => report.spans ?? []);

  // Create unique list of spans (by name) with aggregated metrics, filtering only nodes ending in "_node"
  $: nodes = allSpans
    .filter((span) => span.name.endsWith("_node"))
    .reduce<(Span & { count?: number })[]>((acc, span) => {
      const existing = acc.find((s) => s.name === span.name);
      if (existing) {
        existing.duration_ms += span.duration_ms;
        existing.input_tokens_expended =
          (existing.input_tokens_expended ?? 0) + (span.input_tokens_expended ?? 0);
        existing.output_tokens_expended =
          (existing.output_tokens_expended ?? 0) + (span.output_tokens_expended ?? 0);
        existing.count = (existing.count ?? 1) + 1;
      } else {
        acc.push({
          ...span,
          count: 1,
        });
      }
      return acc;
    }, []);

  function selectNode(span: Span): void {
    selectedNode = selectedNode?.name === span.name ? null : span;
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function formatTokens(tokens: number | undefined): string {
    if (!tokens) return "0";
    return tokens.toLocaleString();
  }

  function getNodeColor(index: number, isSelected: boolean): string {
    if (isSelected) {
      return "from-accent-cyan to-accent-teal";
    }
    const colors = [
      "from-gray-500 to-gray-600",
      "from-gray-600 to-gray-700",
      "from-gray-400 to-gray-500",
      "from-gray-500 to-gray-700",
    ];
    return colors[index % colors.length] ?? "from-gray-500 to-gray-600";
  }

  function calculateCost(
    inputTokens: number | undefined,
    outputTokens: number | undefined
  ): string {
    // Using Claude 3.5 Sonnet pricing as example: $3/MTok input, $15/MTok output
    const inputCost = ((inputTokens ?? 0) / 1_000_000) * 3;
    const outputCost = ((outputTokens ?? 0) / 1_000_000) * 15;
    const total = inputCost + outputCost;

    if (total < 0.01) {
      return `$${total.toFixed(4)}`;
    }
    return `$${total.toFixed(2)}`;
  }
</script>

{#if nodes.length > 0}
  <div
    class="animate-slide-in border-t-2 border-accent-cyan/20 bg-gradient-to-b from-background-secondary/30 to-background/30 p-6"
  >
    <div class="mb-4 flex items-center gap-3">
      <div class="h-1 w-1 rounded-full bg-gray-500 animate-pulse"></div>
      <h3 class="text-sm font-semibold text-gray-300">Intent Flow</h3>
      <span class="text-xs text-text-dim">
        ({nodes.length} nodes · {perfReports.length} traces)
      </span>
    </div>

    <!-- Graph visualization -->
    <div class="relative flex items-center justify-center gap-16 overflow-x-auto px-8 py-4">
      {#each nodes as node, i}
        <div class="relative flex flex-col items-center">
          <button
            type="button"
            on:click={() => {
              selectNode(node);
            }}
            class="group relative flex flex-col items-center transition-all duration-300 hover:scale-110"
            style="animation-delay: {i * 100}ms"
          >
            <!-- Node circle with gradient -->
            <div
              class="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all duration-300 animate-fade-in-scale
              {getNodeColor(i, selectedNode?.name === node.name)}
              {selectedNode?.name === node.name
                ? 'ring-4 ring-accent-cyan/50 scale-110 shadow-accent-cyan/50'
                : 'hover:shadow-gray-500/30'}"
            >
              <!-- Pulsing background effect for selected node -->
              {#if selectedNode?.name === node.name}
                <div
                  class="absolute inset-0 rounded-full bg-gradient-to-br from-accent-cyan to-accent-teal opacity-30 blur-lg animate-pulse"
                ></div>
              {/if}

              <!-- Count badge -->
              {#if node.count && node.count > 1}
                <span
                  class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] font-bold text-gray-400 ring-2 ring-gray-500/50"
                >
                  {node.count}
                </span>
              {/if}

              <!-- Connecting line with arrow (except for last node) - positioned relative to circle -->
              {#if i < nodes.length - 1}
                <div
                  class="absolute left-full top-1/2 -translate-y-1/2 flex items-center"
                  style="width: 4rem;"
                >
                  <div class="h-1 flex-1 bg-gray-600"></div>
                  <svg class="h-3 w-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    />
                  </svg>
                </div>
              {/if}
            </div>

            <!-- Node label -->
            <span
              class="mt-2 max-w-[120px] truncate text-[10px] font-medium transition-colors
                {selectedNode?.name === node.name
                ? 'text-accent-cyan'
                : 'text-text-secondary group-hover:text-gray-300'}"
              title={node.name}
            >
              {node.name.split(":")[1]?.replace(/_/g, " ") ?? node.name.replace(/_/g, " ")}
            </span>
          </button>
        </div>
      {/each}
    </div>

    <!-- Metrics panel for selected node -->
    {#if selectedNode}
      <div
        class="mt-6 animate-expand rounded-lg border border-gray-600/30 bg-background/50 p-4 backdrop-blur-sm"
      >
        <div class="mb-3 flex items-center gap-2">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h4 class="text-sm font-semibold text-gray-300">
            {selectedNode.name.replace(/_/g, " ")}
          </h4>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs md:grid-cols-3 lg:grid-cols-5">
          <div
            class="rounded-lg border border-surface-active bg-background-secondary/50 p-3 transition-all hover:border-gray-500/50"
          >
            <div class="text-text-dim">Duration</div>
            <div class="mt-1 font-mono text-lg font-bold text-gray-400">
              {formatDuration(selectedNode.duration_ms)}
            </div>
          </div>

          <div
            class="rounded-lg border border-surface-active bg-background-secondary/50 p-3 transition-all hover:border-gray-500/50"
          >
            <div class="text-text-dim">Input Tokens</div>
            <div class="mt-1 font-mono text-lg font-bold text-gray-400">
              {formatTokens(selectedNode.input_tokens_expended)}
            </div>
          </div>

          <div
            class="rounded-lg border border-surface-active bg-background-secondary/50 p-3 transition-all hover:border-gray-500/50"
          >
            <div class="text-text-dim">Output Tokens</div>
            <div class="mt-1 font-mono text-lg font-bold text-gray-400">
              {formatTokens(selectedNode.output_tokens_expended)}
            </div>
          </div>

          <div
            class="rounded-lg border border-surface-active bg-background-secondary/50 p-3 transition-all hover:border-gray-500/50"
          >
            <div class="text-text-dim">Total Tokens</div>
            <div class="mt-1 font-mono text-lg font-bold text-gray-400">
              {formatTokens(selectedNode.total_tokens_expended)}
            </div>
          </div>

          <div
            class="rounded-lg border border-accent-teal/30 bg-accent-teal/5 p-3 transition-all hover:border-accent-teal/50"
          >
            <div class="text-text-dim">Est. Cost</div>
            <div class="mt-1 font-mono text-lg font-bold text-accent-teal">
              {calculateCost(
                selectedNode.input_tokens_expended,
                selectedNode.output_tokens_expended
              )}
            </div>
          </div>
        </div>

        {#if selectedNode.duration_percentage}
          <div class="mt-3 text-xs text-text-muted">
            Represents {selectedNode.duration_percentage} of total execution time
          </div>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <div
    class="flex items-center gap-3 border-t border-surface/30 bg-background-secondary/20 px-6 py-4"
  >
    <svg class="h-5 w-5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p class="text-xs text-text-muted">
      No performance data available for this user. Select a log entry to see details.
    </p>
  </div>
{/if}

<style>
  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in-scale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-slide-in {
    animation: slide-in 0.4s ease-out;
  }

  .animate-fade-in-scale {
    animation: fade-in-scale 0.3s ease-out forwards;
  }
</style>
