<script lang="ts">
  import MenuButton from './primitives/menu/menu-button.svelte';
  import MenuContainer from './primitives/menu/menu-container.svelte';
  import Menu from './primitives/menu/menu.svelte';

  let show = false;
  export let id: string;
  export let position: 'right' | 'left' = 'left';
</script>

<MenuContainer>
  <MenuButton controls={id} bind:show class={$$restProps.buttonClass}>
    <slot name="trigger" />
  </MenuButton>
  <Menu {position} class="min-w-fit {$$restProps.menuClass}" {show} {id}>
    <slot name="items" {show} />
  </Menu>
</MenuContainer>
