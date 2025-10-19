<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { mockLogs } from "$lib/data/mockLogs";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import FiltersBar from "$lib/components/FiltersBar.svelte";
  import LogTable from "$lib/components/LogTable.svelte";
  import LogCards from "$lib/components/LogCards.svelte";
  import ConversationGroup from "$lib/components/ConversationGroup.svelte";
  import type { LogEntry } from "@bt-log-viewer/domain";

  type Server = "qa" | "prod";

  let filteredLogs: LogEntry[] = mockLogs;
  let searchQuery = "";
  let selectedLogId: string | null = null;
  let filterLevels: string[] = [];
  let filterLanguages: string[] = [];
  let filterUserId: string | null = null;
  let groupByConversation = false;
  let selectedServer: Server = "qa";

  // Load saved server preference from localStorage
  onMount(() => {
    if (browser && typeof window !== "undefined") {
      const saved = window.localStorage.getItem("bt-servant-server");
      if (saved === "qa" || saved === "prod") {
        selectedServer = saved;
      }
    }
  });

  // Save server preference to localStorage
  function handleServerChange(server: Server): void {
    selectedServer = server;
    if (browser && typeof window !== "undefined") {
      window.localStorage.setItem("bt-servant-server", server);
    }
    // TODO: Fetch logs from the selected server
  }

  $: selectedLog = selectedLogId
    ? (filteredLogs.find((log) => log.id === selectedLogId) ?? null)
    : null;

  // Extract available users from logs
  $: availableUsers = Array.from(
    new Set(mockLogs.map((log) => log.userId).filter(Boolean))
  ).sort() as string[];

  // Group logs by CID when in conversation mode
  $: groupedLogs = filteredLogs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    if (log.cid) {
      acc[log.cid] ??= [];
      const logArray = acc[log.cid];
      if (logArray) {
        logArray.push(log);
      }
    }
    return acc;
  }, {});

  // Get conversation groups sorted by timestamp
  $: conversationGroups = Object.entries(groupedLogs)
    .filter(([, logs]) => logs.length > 0)
    .map(([cid, logs]) => {
      const firstLog = logs[0];
      if (!firstLog) return null;
      return {
        cid,
        logs,
        firstLog,
        perfReport: logs.find((l) => l.perfReport)?.perfReport,
      };
    })
    .filter((group): group is NonNullable<typeof group> => group !== null)
    .sort((a, b) => b.firstLog.ts.getTime() - a.firstLog.ts.getTime());

  // Apply all filters
  $: {
    let logs = mockLogs;

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(lowerQuery) ||
          log.level.toLowerCase().includes(lowerQuery) ||
          log.userId?.toLowerCase().includes(lowerQuery)
      );
    }

    // Level filter
    if (filterLevels.length > 0) {
      logs = logs.filter((log) => filterLevels.includes(log.level));
    }

    // Language filter
    if (filterLanguages.length > 0) {
      logs = logs.filter((log) => log.language && filterLanguages.includes(log.language));
    }

    // User filter
    if (filterUserId) {
      logs = logs.filter((log) => log.userId === filterUserId);
    }

    filteredLogs = logs;
  }

  // Simple filtering function (will be enhanced later)
  function handleSearch(query: string): void {
    searchQuery = query;
  }

  function handleFilterChange(
    event: CustomEvent<{
      levels: string[];
      languages: string[];
      userId: string | null;
      timeRange: string;
    }>
  ): void {
    const { levels, languages, userId } = event.detail;
    filterLevels = levels;
    filterLanguages = languages;
    filterUserId = userId;
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

    <!-- Right side: Search bar and Server selector -->
    <div class="relative z-10 ml-auto flex items-center gap-3">
      <div class="w-full md:w-96 lg:w-[500px]">
        <SearchBar
          on:search={(e) => {
            handleSearch(e.detail as string);
          }}
        />
      </div>

      <!-- Server selector with All Users dropdown styling -->
      <div class="relative flex items-center">
        <button
          type="button"
          on:click={(e) => {
            const select = e.currentTarget.nextElementSibling;
            if (select instanceof HTMLSelectElement) {
              select.click();
            }
          }}
          class="flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-all hover:scale-105 border-surface-active bg-surface/30 text-text-dim hover:bg-surface"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
          {selectedServer === "qa" ? "QA" : "Production"}
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <select
          bind:value={selectedServer}
          on:change={() => {
            handleServerChange(selectedServer);
          }}
          class="absolute inset-0 opacity-0 cursor-pointer"
        >
          <option value="qa">QA</option>
          <option value="prod">Production</option>
        </select>
      </div>
    </div>
  </header>

  <!-- Filters bar -->
  <FiltersBar {availableUsers} on:filterChange={handleFilterChange} />

  <!-- Grouping toggle (shown when user is selected) -->
  {#if filterUserId}
    <div class="border-b border-surface/50 bg-background-secondary/30 px-6 py-3 md:px-8">
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-text-dim">View:</span>
        <div class="flex gap-1.5">
          <button
            type="button"
            on:click={() => {
              groupByConversation = false;
            }}
            class="rounded border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105
              {!groupByConversation
              ? 'border-2 border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
              : 'border-surface-active bg-surface/30 text-text-dim hover:bg-surface'}"
          >
            <div class="flex items-center gap-1.5">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              All Logs
            </div>
          </button>
          <button
            type="button"
            on:click={() => {
              groupByConversation = true;
            }}
            class="rounded border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105
              {groupByConversation
              ? 'border-2 border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
              : 'border-surface-active bg-surface/30 text-text-dim hover:bg-surface'}"
          >
            <div class="flex items-center gap-1.5">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Group by Conversation
            </div>
          </button>
        </div>
        <span class="text-xs text-text-muted">
          ({conversationGroups.length} conversation{conversationGroups.length !== 1 ? "s" : ""})
        </span>
      </div>
    </div>
  {/if}

  <!-- Main content area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Log display area -->
    <main class="flex flex-1 flex-col overflow-hidden">
      {#if filterUserId && groupByConversation}
        <!-- Grouped conversation view -->
        <div
          class="h-full overflow-auto bg-gradient-to-b from-background to-background-secondary/20"
        >
          {#each conversationGroups as group (group.cid)}
            <ConversationGroup
              logs={group.logs}
              firstLog={group.firstLog}
              perfReport={group.perfReport}
            />
          {/each}
        </div>
      {:else}
        <!-- Flat log view (Desktop: Table view, Mobile: Card view) -->
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
      {/if}

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
