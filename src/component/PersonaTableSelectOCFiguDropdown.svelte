<script>
  import environment from '../../environment.js'

  export let row
  export let ocFigurantenNames
  let selected

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
