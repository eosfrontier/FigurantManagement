<script>
  import Icon from 'fa-svelte'
  import { faList } from '@fortawesome/free-solid-svg-icons/faList'
  import { faWindowClose } from '@fortawesome/free-solid-svg-icons/faWindowClose'
  import { fade } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  import environment from '../../environment.js'
  import FigurantCard from './FigurantCard.svelte'
  let visible = false
  let figurantsList
  let recurringFigurantsList

  function showList() {
    visible = true
    getAllFigurants()
  }
  function closeList() {
    visible = false
  }

  function corner(node, { duration }) {
    return {
      duration,
      css: t => {
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
  async function getAllFigurants() {
    let response = await fetch(environment.checkICCID, {
      method: 'POST',
      body: JSON.stringify({ all_characters: true, token: environment.token }),
    })
    let allCharacters = await response.json()
    figurantsList = allCharacters.filter(
      figurant => figurant.status == 'figurant',
    )
    recurringFigurantsList = allCharacters.filter(
      figurant => figurant.status == 'figurant-recurring',
    )
  }
</script>

<style>
  .openList {
    position: fixed;
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
  }
  .openList::before {
    position: absolute;
    content: '';
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: radial-gradient(
      circle at center,
      #2c3445 0.98em,
      transparent 1em,
      transparent 100%
    );
    z-index: -1;
    transition: opacity 0.17s;
    opacity: 0;
  }
  .openList:active::before {
    opacity: 1;
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
    overflow-y: auto;
    overflow-x: hidden;
    top: 5%;
    right: 5%;
    background-color: #262e3e;
    box-shadow: 0 0.6875em 0.9375em -0.4375em rgba(0, 0, 0, 0.2),
      0 1.5em 2.375em 0.1875em rgba(0, 0, 0, 0.14),
      0 0.5625em 2.875em 0.5em rgba(0, 0, 0, 0.12);
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
  .CloseX:active,
  .CloseX:focus {
    position: absolute;
    right: 0px;
    background: rgba(0, 0, 0, 0);
    color: #838795;
    border: none;
  }
  .gridContainment {
    display: flex;
    flex-wrap: wrap;
    place-content: start center;
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 80.5em) {
    .gridContainment {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media screen and (max-width: 61.5em) {
    .gridContainment {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 35em) {
    .gridContainment {
      grid-template-columns: repeat(1, 1fr);
    }
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
    </button>
    <div class="gridContainment">
      {#if recurringFigurantsList}
        {#each recurringFigurantsList as reFigurant}
          <FigurantCard
            characterID={reFigurant.characterID}
            character_name={reFigurant.character_name}
            card_id={reFigurant.card_id}
            faction={reFigurant.faction}
            status="recurring" />
        {/each}
      {/if}
      {#if figurantsList}
        {#each figurantsList as figurant}
          <FigurantCard
            characterID={figurant.characterID}
            character_name={figurant.character_name}
            card_id={figurant.card_id}
            faction={figurant.faction}
            status="singleUse" />
        {/each}
      {/if}
    </div>
  </aside>
{:else}
  <button
    class="openList"
    on:click={showList}
    transition:fade={{ duration: 50 }}>
    <Icon class="faIcon" icon={faList} />
  </button>
{/if}
