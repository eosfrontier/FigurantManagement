<script>
  import Icon from 'fa-svelte'
  import { faList } from '@fortawesome/free-solid-svg-icons/faList'
  import { faWindowClose } from '@fortawesome/free-solid-svg-icons/faWindowClose'
  import { fade } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  import PersonaTable from './PersonaTable.svelte'

  let visible = false

  function showList() {
    visible = true
  }
  function closeList() {
    visible = false
  }

  function corner(node, { duration, delay }) {
    return {
      duration,
      css: (t) => {
        const eased = quintOut(t)

        return `
          transform-origin:top right;
					top: ${eased * 5}%;
					right: ${eased * 5}%;
          transform:  scale(${eased});
          opacity: ${eased + 0.1};
          background: rgb(
						${Math.min(66, 66 - 28 * eased)},
						${Math.min(73, 73 - 27 * eased)},
						${Math.min(89, 89 - 27 * eased)}
					);
					`
      },
    }
  }
</script>

<style>
  .openList {
    position: absolute;
    block-size: clamp(4.5rem, 6.25rem, 10vh);
    inline-size: clamp(4.5rem, 6.25rem, 10vh);
    top: 0;
    right: 0;
    font-size: 1.75em;
    border: none;
    color: #ccd1dd;
    background: none;
    z-index: 1;
    transition: 1s;
    padding: unset;
    margin: unset;
    box-shadow: unset;
  }
  .openList:active {
    background: none;
  }
  .personaList {
    will-change: transform;
    z-index: 4;
    position: fixed;
    block-size: 89vh;
    inline-size: 90vw;
    top: 5%;
    right: 5%;
    background-color: #262e3e;
    contain: paint;
    box-shadow: var(--materialElevation16boxShadow);
  }
  .backdrop {
    background-color: rgba(29, 32, 40, 0.6);
    block-size: 100vh;
    inline-size: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    content: '';
    z-index: 3;
  }
  .CloseX,
  .CloseX:hover,
  .CloseX:active {
    position: absolute;
    top: 0px;
    right: 0px;
    block-size: 2em;
    inline-size: 2em;
    background: rgba(0, 0, 0, 0);
    color: #838795;
    border: none;
    padding: 0;
    margin: 0;
    box-shadow: unset;
  }
</style>

{#if visible}
  <div
    class="backdrop"
    on:click={closeList}
    transition:fade={{ duration: 125 }} />
  <aside class="personaList" transition:corner={{ duration: 250 }}>
    <button class="CloseX" on:click={closeList}>
      <Icon class="faIcon" icon={faWindowClose} />
      <mat-ripple
        color="#28292c55"
        centered="true"
        unbounded="true"
        radius="15" />
    </button>
    <PersonaTable />
  </aside>
{:else}
  <button
    class="openList"
    on:click={showList}
    transition:fade={{ duration: 100 }}>
    <abbr title="Open figuranten list">
      <Icon class="faIcon" icon={faList} />
    </abbr>
    <mat-ripple
      color="#28292c44"
      centered="true"
      unbounded="true"
      radius="30" />
  </button>
{/if}
