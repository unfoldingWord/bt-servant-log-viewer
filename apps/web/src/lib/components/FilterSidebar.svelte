<script lang="ts">
  // Filter states (will be enhanced in later iterations)
  // TODO: Wire up to parent component filter logic
  let selectedLevels: string[] = [];
  let selectedLanguages: string[] = [];
  let dateRange = { start: "", end: "" };

  // Collapsible section states
  let levelsExpanded = true;
  let languagesExpanded = true;
  let dateExpanded = true;

  // Satisfy unused variable warnings - these will be wired up in next iteration
  $: void selectedLevels;
  $: void selectedLanguages;
  $: void dateRange;

  const logLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
  const languages = ["en", "es", "fr", "pt", "sw", "ar"];

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

  function getLevelColorClass(level: string): string {
    const colors: Record<string, string> = {
      TRACE: "text-level-trace",
      DEBUG: "text-level-debug",
      INFO: "text-level-info",
      WARN: "text-level-warn",
      ERROR: "text-level-error",
    };
    return colors[level] ?? "text-text-secondary";
  }

  function clearAllFilters(): void {
    selectedLevels = [];
    selectedLanguages = [];
    dateRange = { start: "", end: "" };
  }

  $: activeFilterCount =
    selectedLevels.length + selectedLanguages.length + (dateRange.start || dateRange.end ? 1 : 0);
</script>

<div
  class="flex h-full flex-col overflow-y-auto bg-gradient-to-b from-background-secondary to-background p-4"
>
  <!-- Header -->
  <div class="mb-5 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <svg class="h-5 w-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
      <h2 class="text-lg font-bold text-text">Filters</h2>
    </div>
    {#if activeFilterCount > 0}
      <span
        class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan to-accent-teal text-xs font-bold text-background shadow-lg shadow-accent-cyan/20"
      >
        {activeFilterCount}
      </span>
    {/if}
  </div>

  <!-- Log Level Filter -->
  <div
    class="mb-4 overflow-hidden rounded-xl border border-surface-active bg-surface/50 backdrop-blur-sm"
  >
    <button
      type="button"
      on:click={() => {
        levelsExpanded = !levelsExpanded;
      }}
      class="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-surface-hover"
    >
      <div class="flex items-center gap-2">
        <svg
          class="h-4 w-4 text-accent-teal transition-transform {levelsExpanded ? 'rotate-90' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="font-semibold text-text">Log Level</span>
      </div>
      {#if selectedLevels.length > 0}
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan/20 text-xs font-bold text-accent-cyan"
        >
          {selectedLevels.length}
        </span>
      {/if}
    </button>

    {#if levelsExpanded}
      <div class="border-t border-surface-active p-3.5 transition-all">
        <div class="space-y-2.5">
          {#each logLevels as level}
            <label
              class="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-all hover:bg-background/50"
            >
              <input
                type="checkbox"
                value={level}
                bind:group={selectedLevels}
                class="peer h-4 w-4 cursor-pointer rounded border-2 border-surface-active bg-background text-accent-cyan transition-all focus:ring-2 focus:ring-accent-cyan focus:ring-offset-0 focus:ring-offset-surface"
              />
              <div class="flex flex-1 items-center gap-2">
                <span class="text-sm font-medium {getLevelColorClass(level)}">
                  {getLevelIcon(level)}
                </span>
                <span class="text-sm font-medium {getLevelColorClass(level)}">
                  {level}
                </span>
              </div>
            </label>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Language Filter -->
  <div
    class="mb-4 overflow-hidden rounded-xl border border-surface-active bg-surface/50 backdrop-blur-sm"
  >
    <button
      type="button"
      on:click={() => {
        languagesExpanded = !languagesExpanded;
      }}
      class="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-surface-hover"
    >
      <div class="flex items-center gap-2">
        <svg
          class="h-4 w-4 text-accent-teal transition-transform {languagesExpanded
            ? 'rotate-90'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="font-semibold text-text">Language</span>
      </div>
      {#if selectedLanguages.length > 0}
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-teal/20 text-xs font-bold text-accent-teal"
        >
          {selectedLanguages.length}
        </span>
      {/if}
    </button>

    {#if languagesExpanded}
      <div class="border-t border-surface-active p-3.5 transition-all">
        <div class="grid grid-cols-2 gap-2">
          {#each languages as lang}
            <label
              class="group flex cursor-pointer items-center gap-2 rounded-lg border border-surface-active bg-background/30 p-2.5 transition-all hover:border-accent-teal/50 hover:bg-accent-teal/5"
            >
              <input
                type="checkbox"
                value={lang}
                bind:group={selectedLanguages}
                class="peer h-4 w-4 cursor-pointer rounded border-2 border-surface-active bg-background text-accent-teal transition-all focus:ring-2 focus:ring-accent-teal focus:ring-offset-0 focus:ring-offset-surface"
              />
              <span class="text-sm font-medium uppercase text-text-secondary group-hover:text-text">
                {lang}
              </span>
            </label>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Date Range Filter -->
  <div
    class="mb-4 overflow-hidden rounded-xl border border-surface-active bg-surface/50 backdrop-blur-sm"
  >
    <button
      type="button"
      on:click={() => {
        dateExpanded = !dateExpanded;
      }}
      class="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-surface-hover"
    >
      <div class="flex items-center gap-2">
        <svg
          class="h-4 w-4 text-accent-teal transition-transform {dateExpanded ? 'rotate-90' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="font-semibold text-text">Date Range</span>
      </div>
      {#if dateRange.start || dateRange.end}
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan/20 text-xs font-bold text-accent-cyan"
        >
          1
        </span>
      {/if}
    </button>

    {#if dateExpanded}
      <div class="border-t border-surface-active p-3.5 transition-all">
        <div class="space-y-3">
          <div>
            <div class="mb-1.5 block text-xs font-medium text-text-muted">Start Date</div>
            <input
              type="date"
              bind:value={dateRange.start}
              class="w-full rounded-lg border border-surface-active bg-background px-3 py-2 text-sm text-text transition-all focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
            />
          </div>
          <div>
            <div class="mb-1.5 block text-xs font-medium text-text-muted">End Date</div>
            <input
              type="date"
              bind:value={dateRange.end}
              class="w-full rounded-lg border border-surface-active bg-background px-3 py-2 text-sm text-text transition-all focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
            />
          </div>

          <!-- Quick Date Presets -->
          <div>
            <div class="mb-2 block text-xs font-medium text-text-muted">Quick Select</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="group rounded-lg border border-surface-active bg-background/50 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-cyan/50 hover:bg-accent-cyan/5 hover:text-accent-cyan"
              >
                <div class="flex items-center justify-center gap-1.5">
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Last Hour
                </div>
              </button>
              <button
                type="button"
                class="group rounded-lg border border-surface-active bg-background/50 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-cyan/50 hover:bg-accent-cyan/5 hover:text-accent-cyan"
              >
                Last 24h
              </button>
              <button
                type="button"
                class="group rounded-lg border border-surface-active bg-background/50 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-teal/50 hover:bg-accent-teal/5 hover:text-accent-teal"
              >
                Last 7d
              </button>
              <button
                type="button"
                class="group rounded-lg border border-surface-active bg-background/50 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-teal/50 hover:bg-accent-teal/5 hover:text-accent-teal"
              >
                Last 30d
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Clear Filters Button -->
  {#if activeFilterCount > 0}
    <button
      type="button"
      on:click={clearAllFilters}
      class="group relative w-full overflow-hidden rounded-xl border border-surface-active bg-gradient-to-br from-surface to-surface/50 px-4 py-3 font-semibold text-text-secondary shadow-lg transition-shadow hover:border-accent-cyan/50 hover:shadow-accent-cyan/10"
    >
      <div class="relative flex items-center justify-center gap-2">
        <svg
          class="h-4 w-4 transition-transform group-hover:rotate-180 group-hover:text-accent-cyan"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span class="group-hover:text-accent-cyan">Clear All Filters</span>
      </div>
    </button>
  {/if}
</div>

<style>
  /* Custom checkbox styling */
  input[type="checkbox"]:checked {
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
  }
</style>
