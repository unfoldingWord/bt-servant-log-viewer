<script lang="ts">
  // Filter states (will be enhanced in later iterations)
  // TODO: Wire up to parent component filter logic
  let selectedLevels: string[] = [];
  let selectedLanguages: string[] = [];
  let dateRange = { start: "", end: "" };

  // Satisfy unused variable warnings - these will be wired up in next iteration
  $: void selectedLevels;
  $: void selectedLanguages;
  $: void dateRange;

  const logLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
  const languages = ["en", "es", "fr", "pt", "sw", "ar"];
</script>

<div class="flex h-full flex-col overflow-y-auto p-4">
  <h2 class="mb-4 text-lg font-semibold text-text">Filters</h2>

  <!-- Log Level Filter -->
  <div class="mb-6">
    <h3 class="mb-2 text-sm font-medium text-text-secondary">Log Level</h3>
    <div class="space-y-2">
      {#each logLevels as level}
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            value={level}
            bind:group={selectedLevels}
            class="rounded border-surface-active bg-surface text-accent-cyan
                   focus:ring-2 focus:ring-accent-cyan focus:ring-offset-0"
          />
          <span
            class="text-sm text-text-secondary"
            class:text-level-trace={level === "TRACE"}
            class:text-level-debug={level === "DEBUG"}
            class:text-level-info={level === "INFO"}
            class:text-level-warn={level === "WARN"}
            class:text-level-error={level === "ERROR"}
          >
            {level}
          </span>
        </label>
      {/each}
    </div>
  </div>

  <!-- Language Filter -->
  <div class="mb-6">
    <h3 class="mb-2 text-sm font-medium text-text-secondary">Language</h3>
    <div class="space-y-2">
      {#each languages as lang}
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            value={lang}
            bind:group={selectedLanguages}
            class="rounded border-surface-active bg-surface text-accent-teal
                   focus:ring-2 focus:ring-accent-teal focus:ring-offset-0"
          />
          <span class="text-sm text-text-secondary">{lang}</span>
        </label>
      {/each}
    </div>
  </div>

  <!-- Date Range Filter -->
  <div class="mb-6">
    <h3 class="mb-2 text-sm font-medium text-text-secondary">Date Range</h3>
    <div class="space-y-2">
      <input
        type="date"
        bind:value={dateRange.start}
        class="w-full rounded bg-surface px-3 py-2 text-sm text-text
               focus:outline-none focus:ring-2 focus:ring-accent-blue"
        placeholder="Start date"
      />
      <input
        type="date"
        bind:value={dateRange.end}
        class="w-full rounded bg-surface px-3 py-2 text-sm text-text
               focus:outline-none focus:ring-2 focus:ring-accent-blue"
        placeholder="End date"
      />
    </div>
  </div>

  <!-- Quick Date Presets -->
  <div class="mb-6">
    <h3 class="mb-2 text-sm font-medium text-text-secondary">Quick Select</h3>
    <div class="grid grid-cols-2 gap-2">
      <button
        class="rounded bg-surface px-3 py-2 text-xs text-text-secondary transition
                     hover:bg-surface-hover hover:text-text"
      >
        Last Hour
      </button>
      <button
        class="rounded bg-surface px-3 py-2 text-xs text-text-secondary transition
                     hover:bg-surface-hover hover:text-text"
      >
        Last 24h
      </button>
      <button
        class="rounded bg-surface px-3 py-2 text-xs text-text-secondary transition
                     hover:bg-surface-hover hover:text-text"
      >
        Last 7d
      </button>
      <button
        class="rounded bg-surface px-3 py-2 text-xs text-text-secondary transition
                     hover:bg-surface-hover hover:text-text"
      >
        Last 30d
      </button>
    </div>
  </div>

  <!-- Clear Filters -->
  <button
    on:click={() => {
      selectedLevels = [];
      selectedLanguages = [];
      dateRange = { start: "", end: "" };
    }}
    class="w-full rounded bg-surface px-4 py-2 text-sm text-text-secondary transition
           hover:bg-surface-hover hover:text-text"
  >
    Clear All Filters
  </button>
</div>
