<script>
  import environment from '../../environment.js'
  import { createEventDispatcher } from 'svelte'
  export let row

  const dispatch = createEventDispatcher()

  async function editCharacterData(characterData) {
    dispatch('editCharacter', characterData)
  }

  async function retrieveCharacterData() {
    if (environment.mockPersonaData) {
      editCharacterData(row)
      return
    }

    let jsonData
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        id: row.characterID,
        'cache-control': 'no-cache',
      },
    }).then(async function (response) {
      if (response.status == 200) {
        jsonData = await response.json()
        editCharacterData(jsonData)
      }
    })
  }
</script>

<style>
  button {
    float: unset;
    padding: 0 0.9rem;
    margin: 0.25rem 0;
  }
</style>

<button on:click={retrieveCharacterData}>
  Edit
  <mat-ripple color="#ccd1dd33"></mat-ripple>
</button>
