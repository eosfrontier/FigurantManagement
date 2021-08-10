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
            '[asignOCFigurant]: linked figurant' + row.id + ' with a person',
          )
        } else {
          console.log(
            '[asignOCFigurant]: things went wrong trying to asign ' + row.id,
          )
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
</script>

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
