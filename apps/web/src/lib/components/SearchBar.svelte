<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{ search: string }>();

  let searchValue = "";

  function handleInput(): void {
    dispatch("search", searchValue);
  }

  function clearSearch(): void {
    searchValue = "";
    dispatch("search", "");
  }
</script>

<div class="relative group">
  <input
    type="text"
    bind:value={searchValue}
    on:input={handleInput}
    placeholder="Search logs by message, level, user..."
    class="w-full rounded-lg border border-surface-active bg-surface px-4 py-2.5 pl-10 pr-10 text-text placeholder-text-dim shadow-sm transition-all
           focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 focus:shadow-md focus:shadow-accent-cyan/10"
  />

  <!-- Search icon with animation -->
  <svg
    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent-cyan"
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

  <!-- Clear button with slide-in animation -->
  {#if searchValue}
    <button
      type="button"
      on:click={clearSearch}
      aria-label="Clear search"
      class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface-hover p-1 text-text-muted transition-all hover:bg-accent-cyan/20 hover:text-accent-cyan animate-fade-in"
    >
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  {/if}
</div>
