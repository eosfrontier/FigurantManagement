<script>
  import { onMount } from 'svelte'
  import FigurantCard from './FigurantCard.svelte'
  import environment from '../../environment.js'
  let figurantsList
  let recurringFigurantsList
  let fakeList = [1, 2, 3, 4]

  onMount(() => {
    setTimeout(function () {
      getAllFigurants()
    }, 125)
  })

  async function getAllFigurants() {
    let response = await fetch(environment.getAllFigurants, {
      method: 'GET',
      mode: 'cors',
      headers: { token: environment.token,
                 'cache-control' : 'no-cache'
               },
    })
    let allFigurants = await response.json()
    figurantsList = allFigurants.filter(
      (figurant) => figurant.status == 'figurant',
    )
    recurringFigurantsList = allFigurants.filter(
      (figurant) => figurant.status == 'figurant-recurring',
    )
  }
</script>

<h1>Current Figurant Personas</h1>
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
  {:else}
    {#each fakeList as fakeItem}
      <FigurantCard
        characterID="0"
        character_name=""
        card_id=""
        faction=""
        status="" />
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
  {:else}
    {#each fakeList as fakeItem}
      <FigurantCard
        characterID="0"
        character_name=""
        card_id=""
        faction=""
        status="" />
    {/each}
  {/if}
</div>
