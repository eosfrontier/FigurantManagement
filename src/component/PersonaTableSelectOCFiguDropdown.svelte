<script>
  import { onMount } from 'svelte'
  import environment from '../../environment.js'

  export let row
  export let ocFigurantenNames
  let selected

  // onMount(() => {
  //   setTimeout(function () {
  //     console.log(row.characterID)
  //   }, 125)
  // })

  function nameSelectEvent(row) {
    console.log(selected)
    console.log(row.id)
  }

  async function asignOCFigurant(row) {
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'PUT',
      mode: 'cors',
      headers: {
        token: environment.token,
        id: row.id,
        figurant: JSON.stringify({ figu_accountID: selected }),
        'cache-control': 'no-cache',
      },
    })
      .then(function (response) {
        if (response.status == 200 || response.status == 204) {
          console.log(
            '[asignOCFigurant]: altered asignment of figurant ' + row.id,
          )
        } else {
          console.log(
            '[asignOCFigurant]: altering the asignment of figurant ' +
              row.id +
              ' went wrong',
          )
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
</script>

<style>
  img {
    width: 2rem;
    height: 2rem;
    position: relative;
    top: 0.5rem;
  }
  img:active {
    width: 10rem;
    height: 10rem;
    position: absolute;
    top: 25%;
    left: 75%;
    z-index: 20;
    border: 0.5rem solid var(--buttonColor);
    box-shadow: var(--materialElevation12boxShadow);
    background-color: black;
  }
</style>

<select
  id={row.characterID}
  bind:value={selected}
  on:change={asignOCFigurant(this, row, 'assignment')}>
  <option value="null" />
  {#each ocFigurantenNames as figurant}
    {#if row.figu_accountID == figurant.id}
      <option id={row.characterID} value={figurant.id} selected>
        {figurant.name}
      </option>
    {:else}
      <option value={figurant.id}>{figurant.name}</option>
    {/if}
  {/each}
</select>
<img
  src="{environment.eoschargen}/img/passphoto/npc/{selected}.jpg"
  onerror="this.src='{environment.eoschargen}/img/passphoto/npc/default.jpg'"
  alt="figurant {selected}" />
