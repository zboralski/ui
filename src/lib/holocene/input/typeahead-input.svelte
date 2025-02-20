<script lang="ts">
  import { writable } from 'svelte/store';
  import { onDestroy, setContext } from 'svelte';
  import type { IconName } from '$lib/holocene/icon/paths';
  import { clickOutside } from '$lib/holocene/outside-click';

  import type { SelectContext } from '$lib/holocene/select/select.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import Menu from '$lib/holocene/primitives/menu/menu.svelte';
  import MenuContainer from '$lib/holocene/primitives/menu/menu-container.svelte';
  import { noop } from 'svelte/internal';
  import Option from '../select/option.svelte';

  export let id: string;
  export let options: { label: string; value: string }[] = [];
  export let placeholder = '';
  export let icon: IconName = null;
  export let autoFocus = false;
  export let unroundRight: boolean = false;
  export let unroundLeft: boolean = false;

  export let onChange: (value: string) => void = noop;

  let value = '';
  let showMenu = false;
  let filterOptions = options;

  $: {
    if (value) {
      filterOptions = options.filter((o) =>
        o.label.toLowerCase().includes(value.toLowerCase()),
      );
    } else {
      filterOptions = options;
    }
  }

  const context = writable<SelectContext<string>>({
    value: value,
    label: value,
    onChange: () => {
      onChange(value);
      showMenu = false;
    },
  });

  const unsubscribe = context.subscribe((ctx) => {
    value = ctx.value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  $: {
    if (value) {
      context.update((previous) => ({ ...previous, value: value }));
    }

    setContext('select-value', context);
  }
</script>

<div
  class="relative"
  use:clickOutside
  on:click-outside={() => (showMenu = false)}
>
  <MenuContainer class={$$props.class}>
    <Input
      {id}
      {icon}
      class={$$props.class}
      bind:value
      {placeholder}
      {autoFocus}
      {unroundRight}
      {unroundLeft}
      on:focus={() => (showMenu = true)}
    />
    <Menu show={showMenu} id={`menu-${id}`} class="h-auto max-h-80 w-64">
      {#each filterOptions as { label, value }}
        <Option {value}>{label}</Option>
      {:else}
        <Option value={null}>No Results</Option>
      {/each}
    </Menu>
  </MenuContainer>
</div>
