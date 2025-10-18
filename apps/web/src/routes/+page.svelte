<script lang="ts">
  import { mockLogs } from "$lib/data/mockLogs";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import FiltersBar from "$lib/components/FiltersBar.svelte";
  import LogTable from "$lib/components/LogTable.svelte";
  import LogCards from "$lib/components/LogCards.svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  let filteredLogs: LogEntry[] = mockLogs;
  let searchQuery = "";
  let selectedLogId: string | null = null;

  $: selectedLog = selectedLogId
    ? (filteredLogs.find((log) => log.id === selectedLogId) ?? null)
    : null;

  // Simple filtering function (will be enhanced later)
  function handleSearch(query: string): void {
    searchQuery = query;
    if (!query) {
      filteredLogs = mockLogs;
      return;
    }

    const lowerQuery = query.toLowerCase();
    filteredLogs = mockLogs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerQuery) ||
        log.level.toLowerCase().includes(lowerQuery) ||
        log.userId?.toLowerCase().includes(lowerQuery)
    );
  }

  function handleLogSelect(logId: string): void {
    // Toggle selection: if clicking same log, deselect it
    selectedLogId = selectedLogId === logId ? null : logId;
  }
</script>

<svelte:head>
  <title>BT Servant Log Viewer</title>
</svelte:head>

<!-- Main container with responsive layout -->
<div class="flex h-screen flex-col bg-background">
  <!-- Header with gradient background and animations -->
  <header
    class="relative flex items-center justify-between gap-3 overflow-hidden border-b-2 border-accent-cyan/20 bg-gradient-to-r from-background-secondary via-background-secondary to-background px-4 py-4 shadow-lg shadow-black/5 md:px-6"
  >
    <!-- Animated gradient glow effect -->
    <div
      class="pointer-events-none absolute inset-0 animate-gradient bg-gradient-to-r from-accent-cyan/5 via-accent-teal/5 to-accent-cyan/5"
    ></div>

    <!-- Floating particles effect -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -left-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-accent-cyan/10 blur-2xl animate-float"
      ></div>
      <div
        class="absolute right-1/4 top-1/4 h-32 w-32 rounded-full bg-accent-teal/10 blur-3xl animate-float-delayed"
      ></div>
    </div>

    <!-- Left side: Logo and Title -->
    <div class="relative z-10 flex items-center gap-3">
      <!-- Logo/Icon with pulse animation -->
      <div
        class="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan via-accent-teal to-accent-cyan p-2 shadow-xl shadow-accent-cyan/30 transition-all duration-300 hover:scale-110 hover:shadow-accent-cyan/50 animate-logo-glow"
      >
        <div
          class="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-teal opacity-0 blur-md transition-opacity group-hover:opacity-50"
        ></div>
        <svg
          class="relative h-full w-full text-background transition-transform group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <!-- Title with shimmer animation -->
      <div class="hidden flex-col gap-0.5 md:flex">
        <h1
          class="relative bg-gradient-to-r from-accent-cyan via-accent-teal to-accent-cyan bg-clip-text text-lg font-bold tracking-tight text-transparent animate-shimmer"
          style="background-size: 200% 100%;"
        >
          BT Servant Log Viewer
        </h1>
        <span class="text-xs font-medium text-text-dim">Real-time telemetry viewer</span>
      </div>

      <span
        class="relative overflow-hidden rounded-full border border-accent-teal/40 bg-gradient-to-r from-accent-teal/10 to-accent-cyan/10 px-2.5 py-1 text-xs font-semibold text-accent-teal shadow-md shadow-accent-teal/10 transition-all hover:scale-105 hover:shadow-accent-teal/20"
      >
        <span class="relative z-10">v1.0-alpha</span>
        <div
          class="absolute inset-0 -translate-x-full animate-shimmer-badge bg-gradient-to-r from-transparent via-white/10 to-transparent"
        ></div>
      </span>
    </div>

    <!-- Right side: Search bar -->
    <div class="relative z-10 flex flex-1 items-center md:max-w-xl">
      <SearchBar
        on:search={(e) => {
          handleSearch(e.detail as string);
        }}
      />
    </div>
  </header>

  <!-- Filters bar -->
  <FiltersBar />

  <!-- Main content area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Log display area -->
    <main class="flex flex-1 flex-col overflow-hidden">
      <!-- Desktop: Table view, Mobile: Card view -->
      <div class="hidden h-full md:block">
        <LogTable
          logs={filteredLogs}
          selectedId={selectedLogId}
          {selectedLog}
          on:select={(e) => {
            handleLogSelect(e.detail as string);
          }}
        />
      </div>

      <div class="block h-full md:hidden">
        <LogCards
          logs={filteredLogs}
          selectedId={selectedLogId}
          {selectedLog}
          on:select={(e) => {
            handleLogSelect(e.detail as string);
          }}
        />
      </div>

      <!-- Empty state with animation -->
      {#if filteredLogs.length === 0}
        <div class="flex h-full items-center justify-center p-8 animate-fade-in">
          <div class="text-center">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-teal/20"
            >
              <svg
                class="h-8 w-8 text-accent-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p class="text-lg font-medium text-text-secondary">No logs found</p>
            <p class="mt-2 text-sm text-text-muted">Try adjusting your search or filters</p>
          </div>
        </div>
      {/if}
    </main>
  </div>

  <!-- Status bar with enhanced styling -->
  <footer
    class="relative flex items-center justify-between border-t border-accent-cyan/10 bg-gradient-to-r from-background-secondary to-background px-4 py-2.5 text-xs md:px-6"
  >
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <div class="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse"></div>
        <span class="font-medium text-text-secondary">
          {filteredLogs.length}
          <span class="text-text-muted">of</span>
          {mockLogs.length}
          <span class="text-text-muted">logs</span>
        </span>
      </div>
      {#if searchQuery}
        <span class="text-text-dim">·</span>
        <div
          class="flex items-center gap-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 px-2 py-0.5"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span class="text-accent-cyan">"{searchQuery}"</span>
        </div>
      {/if}
    </div>
    <span class="text-text-dim">Phase 1a · Live View</span>
  </footer>
</div>

<style>
  /* Header animations */
  @keyframes gradient {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
    }
  }

  .animate-gradient {
    animation: gradient 8s ease-in-out infinite;
  }

  @keyframes float {
    0%,
    100% {
      transform: translate(0, -50%) scale(1);
      opacity: 0.3;
    }
    50% {
      transform: translate(20px, calc(-50% - 10px)) scale(1.1);
      opacity: 0.5;
    }
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float 8s ease-in-out infinite;
    animation-delay: 2s;
  }

  @keyframes logo-glow {
    0%,
    100% {
      box-shadow:
        0 0 20px rgba(34, 211, 238, 0.3),
        0 0 40px rgba(34, 211, 238, 0.1);
    }
    50% {
      box-shadow:
        0 0 30px rgba(34, 211, 238, 0.5),
        0 0 60px rgba(34, 211, 238, 0.2);
    }
  }

  .animate-logo-glow {
    animation: logo-glow 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .animate-shimmer {
    animation: shimmer 8s linear infinite;
  }

  @keyframes shimmer-badge {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(300%);
    }
  }

  .animate-shimmer-badge {
    animation: shimmer-badge 3s ease-in-out infinite;
  }
</style>
