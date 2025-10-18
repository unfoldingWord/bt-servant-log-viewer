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
  <!-- Animated glow effect when focused -->
  {#if isFocused}
    <div
      class="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-accent-cyan via-accent-teal to-accent-cyan opacity-20 blur-sm animate-pulse"
    ></div>
  {/if}

  <div class="relative">
    <input
      type="text"
      bind:value={searchValue}
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      placeholder="Search logs by message, level, user..."
      class="w-full rounded-xl border-2 border-surface-active bg-gradient-to-r from-surface to-surface/80 px-4 py-3 pl-11 pr-11 text-text placeholder-text-dim shadow-md transition-all duration-300
             focus:border-accent-cyan/50 focus:outline-none focus:ring-4 focus:ring-accent-cyan/10 focus:shadow-xl focus:shadow-accent-cyan/20 focus:scale-[1.01]"
    />

    <!-- Search icon with pulse animation -->
    <div
      class="absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-300"
      class:animate-pulse={isFocused && !searchValue}
    >
      <svg
        class="h-5 w-5 text-text-muted transition-all duration-300"
        class:text-accent-cyan={isFocused}
        class:scale-110={isFocused}
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

    <!-- Clear button with rotation and scale animation -->
    {#if searchValue}
      <button
        type="button"
        on:click={clearSearch}
        aria-label="Clear search"
        class="search-clear absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-surface-hover to-surface-active p-1.5 text-text-muted shadow-md transition-all duration-200 hover:bg-gradient-to-br hover:from-accent-cyan/20 hover:to-accent-teal/20 hover:text-accent-cyan hover:scale-110 hover:rotate-90 active:scale-95"
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

  <!-- Search suggestions badge (shows when typing) -->
  {#if searchValue && isFocused}
    <div
      class="absolute -bottom-8 left-0 flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-gradient-to-r from-accent-cyan/10 to-accent-teal/10 px-3 py-1 text-xs font-medium text-accent-cyan shadow-lg animate-slide-up"
    >
      <svg class="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      Searching...
    </div>
  {/if}
</div>

<style>
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.2s ease-out;
  }

  .search-clear {
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 0 0 0 rgba(34, 211, 238, 0);
    transition:
      all 0.2s ease,
      box-shadow 0.3s ease;
  }

  .search-clear:hover {
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.15),
      0 0 12px rgba(34, 211, 238, 0.3);
  }

  /* Enhanced focus animation */
  input:focus {
    animation: focus-pulse 0.3s ease-out;
  }

  @keyframes focus-pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(1.01);
    }
  }
</style>
