<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ search: string }>();

  let searchValue = "";

  function handleInput() {
    dispatch('search', searchValue);
  }

  function clearSearch() {
    searchValue = "";
    dispatch('search', "");
  }
</script>

<div class="relative">
  <input
    type="text"
    bind:value={searchValue}
    on:input={handleInput}
    placeholder="Search logs by message, level, user..."
    class="w-full rounded-lg bg-surface px-4 py-2 pl-10 text-text placeholder-text-dim transition
           focus:outline-none focus:ring-2 focus:ring-accent-cyan"
  />

  <!-- Search icon -->
  <svg
    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
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

  <!-- Clear button -->
  {#if searchValue}
    <button
      on:click={clearSearch}
      class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
