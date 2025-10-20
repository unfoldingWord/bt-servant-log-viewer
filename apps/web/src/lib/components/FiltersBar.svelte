<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let availableUsers: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{
    filterChange: {
      levels: string[];
      languages: string[];
      userId: string | null;
      timeRange: string;
    };
    refresh: Record<string, never>;
  }>();

  let selectedLevels: string[] = [];
  let selectedUserId: string | null = null;
  let selectedTimeRange = "all";
  let showUserDropdown = false;

  const logLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];

  function getLevelColorClass(level: string): string {
    const colors: Record<string, string> = {
      TRACE: "text-level-trace border-level-trace/30 bg-level-trace/10",
      DEBUG: "text-level-debug border-level-debug/30 bg-level-debug/10",
      INFO: "text-level-info border-level-info/30 bg-level-info/10",
      WARN: "text-level-warn border-level-warn/30 bg-level-warn/10",
      ERROR: "text-level-error border-level-error/30 bg-level-error/10",
    };
    return colors[level] ?? "text-text-secondary border-surface";
  }

  function toggleLevel(level: string): void {
    if (selectedLevels.includes(level)) {
      selectedLevels = selectedLevels.filter((l) => l !== level);
    } else {
      selectedLevels = [...selectedLevels, level];
    }
    emitFilterChange();
  }

  function selectUser(userId: string | null): void {
    selectedUserId = userId;
    showUserDropdown = false;
    emitFilterChange();
  }

  function clearAll(): void {
    selectedLevels = [];
    selectedUserId = null;
    emitFilterChange();
  }

  function selectTimeRange(range: string): void {
    selectedTimeRange = range;
    emitFilterChange();
  }

  function handleRefresh(): void {
    dispatch("refresh", {});
  }

  function emitFilterChange(): void {
    dispatch("filterChange", {
      levels: selectedLevels,
      languages: [],
      userId: selectedUserId,
      timeRange: selectedTimeRange,
    });
  }

  function formatUserId(userId: string): string {
    return userId.replace("user_", "").replace(/_/g, " ");
  }

  $: hasActiveFilters = selectedLevels.length > 0 || selectedUserId !== null;
</script>

<div class="border-b border-surface/50 bg-background-secondary/50 px-6 py-4 md:px-8">
  <div class="flex flex-wrap items-center gap-3">
    <!-- Level filters -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-medium text-text-dim">Level:</span>
      <div class="flex gap-1.5">
        {#each logLevels as level}
          <button
            type="button"
            on:click={() => {
              toggleLevel(level);
            }}
            class="rounded border px-2 py-1 text-xs font-medium transition-colors {selectedLevels.includes(
              level
            )
              ? getLevelColorClass(level) + ' border-2'
              : 'border-surface-active bg-surface/30 text-text-dim hover:bg-surface'}"
          >
            {level}
          </button>
        {/each}
      </div>
    </div>

    <div class="h-4 w-px bg-surface"></div>

    <!-- User filter dropdown -->
    <div class="relative flex items-center gap-2">
      <span class="text-xs font-medium text-text-dim">User:</span>
      <div class="relative">
        <button
          type="button"
          on:click={() => {
            showUserDropdown = !showUserDropdown;
          }}
          class="flex items-center gap-1.5 rounded border-2 border-accent-cyan/50 bg-accent-cyan/10 px-2.5 py-1 text-xs font-medium text-accent-cyan transition-colors"
        >
          {selectedUserId ? formatUserId(selectedUserId) : "All Users"}
          <svg
            class="h-3 w-3 transition-transform"
            class:rotate-180={showUserDropdown}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {#if showUserDropdown}
          <div
            class="absolute right-0 top-full z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border border-surface-active bg-background-secondary shadow-xl"
          >
            <button
              type="button"
              on:click={() => {
                selectUser(null);
              }}
              class="w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-surface
                {selectedUserId === null
                ? 'bg-accent-cyan/10 text-accent-cyan'
                : 'text-text-secondary'}"
            >
              All Users
            </button>
            {#each availableUsers as userId}
              <button
                type="button"
                on:click={() => {
                  selectUser(userId);
                }}
                class="w-full px-3 py-2 text-left text-xs transition-colors hover:bg-surface
                  {selectedUserId === userId
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-secondary'}"
              >
                {formatUserId(userId)}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="h-4 w-px bg-surface"></div>

    <!-- Time range filter -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-medium text-text-dim">Time:</span>
      <div class="flex gap-1.5">
        {#each ["1h", "6h", "24h", "7d", "all"] as range}
          <button
            type="button"
            on:click={() => {
              selectTimeRange(range);
            }}
            class="rounded border px-2 py-1 text-xs font-medium transition-colors
              {selectedTimeRange === range
              ? 'border-2 border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
              : 'border-surface-active bg-surface/30 text-text-dim hover:bg-surface'}"
          >
            {range}
          </button>
        {/each}
      </div>
    </div>

    <!-- Refresh button -->
    <button
      type="button"
      on:click={handleRefresh}
      class="flex items-center gap-1.5 rounded border border-surface-active bg-surface/30 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent-teal/50 hover:bg-accent-teal/5 hover:text-accent-teal"
      title="Refresh logs"
    >
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      Refresh
    </button>

    <!-- Clear button -->
    {#if hasActiveFilters}
      <button
        type="button"
        on:click={clearAll}
        class="ml-auto flex items-center gap-1.5 rounded border border-surface-active bg-surface/30 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent-cyan/50 hover:bg-accent-cyan/5 hover:text-accent-cyan"
      >
        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Clear
      </button>
    {/if}
  </div>
</div>
