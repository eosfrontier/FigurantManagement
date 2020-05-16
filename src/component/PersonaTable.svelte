<script>
  import { onMount } from 'svelte'
  import FigurantCard from './FigurantCard.svelte'
  import environment from '../../environment.js'
  let figurantsList
  let recurringFigurantsList
  let missingFiguranten = false

  onMount(() => {
    setTimeout(function () {
      getAllFigurants()
    }, 125)
  })

  async function getAllFigurants() {
    await fetch(environment.figurantsAPI, {
      method: 'GET',
      mode: 'cors',
      headers: { token: environment.token, 'cache-control': 'no-cache' },
    }).then(async function (response) {
      if (response.status == 200) {
        let allFigurants = await response.json()
        figurantsList = allFigurants.filter(
          (figurant) => figurant.status == 'figurant',
        )
        recurringFigurantsList = allFigurants.filter(
          (figurant) => figurant.status == 'figurant-recurring',
        )
      } else {
        missingFiguranten = true
      }
    })
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
  {#if missingFiguranten}
    <p>
      This is where we would list figuranten, if we had any. (gonna make a joke
      missing poster here one day...)
    </p>
  {/if}
</div>
