<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import type { PerfReport, Span } from "@bt-log-viewer/domain";
  import type { Core, EventObject } from "cytoscape";

  export let perfReports: PerfReport[] = [];
  export let logs: import("@bt-log-viewer/domain").LogEntry[] = [];

  let selectedNode: Span | null = null;
  let cy: Core | null = null;
  let containerRef: HTMLDivElement | undefined;

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

  // Extract unique intents from logs
  $: intents = Array.from(
    new Set(logs.flatMap((log) => (log.intents ?? []).map((intent) => intent.name)))
  ).sort();

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function formatTokens(tokens: number | undefined): string {
    if (!tokens) return "0";
    return tokens.toLocaleString();
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

  function calculateCostRaw(
    inputTokens: number | undefined,
    outputTokens: number | undefined
  ): number {
    // Using Claude 3.5 Sonnet pricing as example: $3/MTok input, $15/MTok output
    const inputCost = ((inputTokens ?? 0) / 1_000_000) * 3;
    const outputCost = ((outputTokens ?? 0) / 1_000_000) * 15;
    return inputCost + outputCost;
  }

  // Calculate total cost across all nodes
  $: totalCost = nodes.reduce((sum, node) => {
    return sum + calculateCostRaw(node.input_tokens_expended, node.output_tokens_expended);
  }, 0);

  // Calculate cost percentage for selected node
  $: selectedNodeCostPercentage =
    selectedNode && totalCost > 0
      ? (
          (calculateCostRaw(
            selectedNode.input_tokens_expended,
            selectedNode.output_tokens_expended
          ) /
            totalCost) *
          100
        ).toFixed(1)
      : null;

  // Check if we should show the percentage line
  $: showPercentages = Boolean(selectedNode?.duration_percentage ?? selectedNodeCostPercentage);

  async function initializeCytoscape(): Promise<void> {
    if (!browser || !containerRef || nodes.length === 0) return;

    // Dynamic import of Cytoscape libraries (client-side only)
    const [{ default: cytoscape }, { default: dagre }] = await Promise.all([
      import("cytoscape"),
      import("cytoscape-dagre"),
    ]);

    // Register dagre layout
    cytoscape.use(dagre as never);

    // Clean up existing instance
    if (cy) {
      cy.destroy();
    }

    // Convert nodes to cytoscape format
    const cytoscapeNodes = nodes.map((node, index) => ({
      data: {
        id: node.name,
        label: node.name.split(":")[1]?.replace(/_/g, " ") ?? node.name.replace(/_/g, " "),
        nodeData: node,
        index,
      },
    }));

    // Create edges between consecutive nodes
    const cytoscapeEdges = nodes.slice(0, -1).map((node, index) => {
      const nextNode = nodes[index + 1];
      return {
        data: {
          source: node.name,
          target: nextNode?.name ?? "",
        },
      };
    });

    cy = cytoscape({
      container: containerRef,
      elements: [...cytoscapeNodes, ...cytoscapeEdges],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#6b7280", // gray-500
            "background-fill": "linear-gradient",
            "background-gradient-stop-colors": ["#d1d5db", "#374151"], // gray-300 to gray-700 (enhanced depth)
            "background-gradient-direction": "to-bottom-right",
            width: 40,
            height: 40,
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 8,
            "font-size": 10,
            color: "#9ca3af", // text-secondary
            "font-weight": 500,
            "text-max-width": "120px",
            "text-wrap": "wrap",
            "text-overflow-wrap": "whitespace",
          },
        },
        {
          selector: "node:selected",
          style: {
            "background-color": "#22d3ee", // accent-cyan
            "background-fill": "linear-gradient",
            "background-gradient-stop-colors": ["#67e8f9", "#0d9488"], // bright cyan to darker teal (enhanced contrast)
            "background-gradient-direction": "to-bottom-right",
            "border-width": 4,
            "border-color": "#22d3ee",
            "border-opacity": 0.5,
            color: "#22d3ee",
          },
        },
        {
          selector: "edge",
          style: {
            width: 4,
            "line-color": "#22d3ee", // accent-cyan
            "target-arrow-color": "#22d3ee",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.6,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR", // Left to right
        nodeSep: 160,
        rankSep: 100,
        padding: 50,
      } as never,
      userZoomingEnabled: false,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    // Handle node selection
    cy.on("tap", "node", (evt: EventObject) => {
      const target = evt.target as {
        data: (key: string) => Span;
      };
      const nodeData: Span = target.data("nodeData");
      if (selectedNode?.name === nodeData.name) {
        selectedNode = null;
        cy?.nodes().unselect();
      } else {
        selectedNode = nodeData;
      }
    });

    // Deselect when clicking background
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        selectedNode = null;
        cy?.nodes().unselect();
      }
    });

    // Fit the graph to the container with padding
    cy.fit(undefined, 50);
  }

  onMount(() => {
    void initializeCytoscape();

    // Handle window resize to make graph responsive
    const handleResize = (): void => {
      if (cy && browser) {
        cy.resize();
        cy.fit(undefined, 50); // Fit with 50px padding
      }
    };

    if (browser && typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (browser && typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  });

  onDestroy(() => {
    if (cy) {
      cy.destroy();
    }
  });

  // Reinitialize when nodes change
  $: if (browser && nodes.length > 0 && containerRef) {
    // Use Promise for async initialization
    void initializeCytoscape();
  }
</script>

{#if nodes.length > 0}
  <div
    class="animate-slide-in border-t-2 border-accent-cyan/20 bg-gradient-to-b from-background-secondary/30 to-background/30 p-6"
  >
    <div class="mb-4">
      <div class="flex items-center gap-3">
        <div class="h-1 w-1 rounded-full bg-gray-500 animate-pulse"></div>
        <h3 class="text-sm font-semibold text-gray-300">Graph Path</h3>
        <span class="text-xs text-text-dim">
          ({nodes.length} nodes · {perfReports.length} traces)
        </span>
      </div>
      {#if intents.length > 0}
        <div class="ml-4 mt-1.5 text-xs">
          <span class="text-text-muted">Intents:</span>
          {#each intents as intent, i}
            <span class="text-accent-teal">{intent}</span>{#if i < intents.length - 1}<span
                class="text-text-dim"
                >,
              </span>{/if}
          {/each}
        </div>
      {/if}
    </div>

    <!-- Cytoscape graph container -->
    <div bind:this={containerRef} class="h-64 w-full rounded-lg bg-background/50"></div>

    <!-- Metrics panel for selected node -->
    {#if selectedNode}
      <div
        class="mt-6 animate-expand rounded-lg border border-gray-600/30 bg-background/50 p-4 backdrop-blur-sm"
      >
        <div class="mb-3 flex items-center gap-2">
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

        {#if showPercentages}
          <div class="mt-3 text-xs text-text-muted">
            {#if selectedNode.duration_percentage && selectedNodeCostPercentage}
              Represents {selectedNode.duration_percentage} of total execution time and {selectedNodeCostPercentage}%
              of total cost
            {:else if selectedNode.duration_percentage}
              Represents {selectedNode.duration_percentage} of total execution time
            {:else if selectedNodeCostPercentage}
              Represents {selectedNodeCostPercentage}% of total cost
            {/if}
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

  .animate-slide-in {
    animation: slide-in 0.4s ease-out;
  }
</style>
