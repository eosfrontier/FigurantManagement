<script>
  import environment from '../../environment.js'

  export let row
  export let ocFigurantenNames
  // Initialize `selected` with the current value from the row.
  let selected = row.figu_accountID || 'null'

  async function asignOCFigurant() {
    try {
      const response = await fetch(environment.orthanc + 'chars_figu/', {
        method: 'PUT',
        mode: 'cors',
        headers: {
          token: environment.token,
          id: row.characterID, // Use characterID for consistency with other components
          figurant: JSON.stringify({ figu_accountID: selected }),
          'cache-control': 'no-cache',
        },
      })
      if (response.ok) {
        console.log(
          '[asignOCFigurant]: altered asignment of figurant ' + row.characterID,
        )
      } else {
        console.log(
          '[asignOCFigurant]: altering the asignment of figurant ' +
            row.characterID +
            ' went wrong',
        )
      }
    } catch (error) {
      console.error('[asignOCFigurant] Fetch failed:', error)
    }
  }
</script>

<style>
  select {
    cursor: pointer;
    width: auto;
    background: none;
    border: 0;
    border-block-end: 0.125em solid #838795;
    color: #ccd1dd;
  }
  select:hover,
  select:active {
    border: 0;
    color: #ccd1dd;
    border-block-end: 0.125em solid #386ae8;
  }
  option {
    color: #ccd1dd;
    background: #3b414e;
  }
</style>

<select
  id={row.characterID}
  bind:value={selected}
  on:change={asignOCFigurant}>
  <option value="null" />
  {#each ocFigurantenNames as figurant}
    <option value={figurant.id}>{figurant.name}</option>
  {/each}
</select>
