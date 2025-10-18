<script lang="ts">
  import { mockLogs } from "$lib/data/mockLogs";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import FilterSidebar from "$lib/components/FilterSidebar.svelte";
  import LogTable from "$lib/components/LogTable.svelte";
  import LogCards from "$lib/components/LogCards.svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  let filteredLogs: LogEntry[] = mockLogs;
  let searchQuery = "";
  let selectedLogId: string | null = null;
  let showFilters = false;

  // Responsive breakpoint detection
  let isDesktop = true;

  // Simple filtering function (will be enhanced later)
  function handleSearch(query: string) {
    searchQuery = query;
    if (!query) {
      filteredLogs = mockLogs;
      return;
    }

    const lowerQuery = query.toLowerCase();
    filteredLogs = mockLogs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      log.level.toLowerCase().includes(lowerQuery) ||
      log.userId?.toLowerCase().includes(lowerQuery)
    );
  }

  function handleLogSelect(logId: string) {
    selectedLogId = logId;
  }
</script>

<svelte:head>
  <title>BT Servant Log Viewer</title>
</svelte:head>

<!-- Main container with responsive layout -->
<div class="flex h-screen flex-col bg-background">
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-surface bg-background-secondary px-4 py-3 md:px-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold text-accent-cyan md:text-2xl">BT Servant Log Viewer</h1>
      <span class="rounded bg-surface px-2 py-1 text-xs text-text-muted">Phase 1a</span>
    </div>

    <!-- Desktop: show filter toggle, Mobile: hamburger menu -->
    <button
      on:click={() => showFilters = !showFilters}
      class="rounded bg-surface px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-hover md:px-4"
    >
      {showFilters ? 'Hide Filters' : 'Show Filters'}
    </button>
  </header>

  <!-- Search bar -->
  <div class="border-b border-surface bg-background-secondary px-4 py-3 md:px-6">
    <SearchBar on:search={(e) => handleSearch(e.detail)} />
  </div>

  <!-- Main content area with filter sidebar and log display -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Filter sidebar - collapsible on mobile -->
    {#if showFilters}
      <aside class="w-full border-r border-surface bg-background-secondary md:w-64 lg:w-80">
        <FilterSidebar />
      </aside>
    {/if}

    <!-- Log display area -->
    <main class="flex-1 overflow-auto">
      <!-- Desktop: Table view, Mobile: Card view -->
      <div class="hidden md:block">
        <LogTable
          logs={filteredLogs}
          selectedId={selectedLogId}
          on:select={(e) => handleLogSelect(e.detail)}
        />
      </div>

      <div class="block md:hidden">
        <LogCards
          logs={filteredLogs}
          selectedId={selectedLogId}
          on:select={(e) => handleLogSelect(e.detail)}
        />
      </div>

      <!-- Empty state -->
      {#if filteredLogs.length === 0}
        <div class="flex h-full items-center justify-center p-8">
          <div class="text-center">
            <p class="text-lg text-text-secondary">No logs found</p>
            <p class="mt-2 text-sm text-text-muted">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      {/if}
    </main>
  </div>

  <!-- Status bar -->
  <footer class="border-t border-surface bg-background-secondary px-4 py-2 text-xs text-text-muted md:px-6">
    Showing {filteredLogs.length} of {mockLogs.length} logs
    {#if searchQuery}
      · Search: "{searchQuery}"
    {/if}
  </footer>
</div>
