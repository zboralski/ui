<script lang="ts">
  export let href = '';
  export let label: string;
  export let active = false;
  export let disabled = false;
</script>

{#if href}
  <a
    class="tab"
    class:active
    class:disabled
    tabindex="0"
    {href}
    data-testid={$$props.testId}
  >
    {label}
    <slot />
  </a>
{:else}
  <div
    class="tab cursor-pointer"
    class:active
    class:disabled
    data-testid={$$props.testId}
    tabindex="0"
    on:click
    on:keypress
  >
    {label}
    <slot />
  </div>
{/if}

<style lang="postcss">
  .tab {
    @apply flex items-center gap-1 whitespace-nowrap border-b-2 text-sm hover:border-b-2 hover:border-blue-700 md:text-base;

    border-color: transparent;
  }

  a.active {
    @apply border-b-2 border-blue-700 font-medium text-blue-700;
  }

  a.disabled {
    @apply pointer-events-none text-gray-800 opacity-50;
  }

  div.active {
    @apply border-b-2 border-blue-700 font-medium text-blue-700;
  }

  div.disabled {
    @apply cursor-not-allowed text-gray-800 opacity-50;
  }

  div.disabled:hover {
    border-color: transparent;
  }
</style>
