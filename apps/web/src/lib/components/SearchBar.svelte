<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const dispatch = createEventDispatcher<{ search: string }>();

  let searchValue = "";
  let isFocused = false;

  function handleInput(): void {
    dispatch("search", searchValue);
  }

  function clearSearch(): void {
    searchValue = "";
    dispatch("search", "");
  }

  function handleFocus(): void {
    isFocused = true;
  }

  function handleBlur(): void {
    isFocused = false;
  }
</script>

<div class="relative group">
  <div class="relative">
    <input
      type="text"
      bind:value={searchValue}
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      placeholder="Search logs..."
      class="w-full rounded-lg border border-surface-active bg-background-secondary/80 px-3 py-2 pl-9 pr-9 text-sm text-text placeholder-text-secondary shadow-sm transition-all duration-200
             focus:border-accent-cyan focus:outline-none focus:bg-background-secondary"
    />

    <!-- Search icon -->
    <div class="absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200">
      <svg
        class="h-4 w-4 transition-colors duration-200"
        class:text-text-muted={!isFocused}
        class:text-accent-cyan={isFocused}
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
    </div>

    <!-- Clear button -->
    {#if searchValue}
      <button
        type="button"
        on:click={clearSearch}
        aria-label="Clear search"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-surface-active p-1 text-text-muted transition-colors duration-200 hover:bg-accent-cyan/20 hover:text-accent-cyan"
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
</div>
