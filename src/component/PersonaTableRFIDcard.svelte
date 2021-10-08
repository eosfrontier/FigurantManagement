<script>
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import environment from '../../environment.js'

  const dispatch = createEventDispatcher()
  export let row
  let sendTimer
  let changeCheckInterval = 4000
  let hasLoaded = false
  let disableTillLoad = true

  onMount(() => {
    setTimeout(function () {
      hasLoaded = true
      disableTillLoad = false
    }, 1500)
  })

  function saveSucces() {
    dispatch('saveSucces')
  }

  $: if (row.card_id) {
    checkCard()
  }

  function checkCard() {
    if (hasLoaded) {
      clearTimeout(sendTimer)
      sendTimer = setTimeout(getCurrentRFIDCard, changeCheckInterval)
    }
  }

  // Due to the way the datatable refreshes, we can't rely purely on a change event and need to confirm that it has indeed changed

  async function getCurrentRFIDCard() {
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        id: row.characterID,
        'cache-control': 'no-cache',
      },
    })
      .then(async function (response) {
        if (response.status == 200) {
          let character_data = await response.json()
          if (
            character_data.card_id != row.card_id &&
            !(character_data.card_id == null && row.card_id == '')
          ) {
            changeRFIDcard()
          }
        }
      })
      .catch((error) => {
        alert(
          'OOPS!\nSomething went horribly wrong, try again in a moment.\n\nIf this keeps happening get IT support.\nCARD_ID ' +
            error,
        )
      })
  }

  async function changeRFIDcard() {
    let serverResponse
    let figurantData = { figurant: {} }
    figurantData.figurant.card_id = row.card_id
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'PUT',
      mode: 'cors',
      headers: {
        token: environment.token,
        'cache-control': 'no-cache',
        id: row.characterID,
        figurant: JSON.stringify(figurantData.figurant),
      },
    })
      .then(async function (response) {
        if (response.status == 200) {
          let serverResponse = await response.json()
          if (serverResponse) {
            saveSucces()
          }
        } else {
          let warning = await response.json()
          alert(warning)
          // still call saveSuccess to refresh the datatable to remove faulty information
          saveSucces()
        }
      })
      .catch((error) => {
        alert(
          'OOPS!\nSomething went horribly wrong, try again in a moment.\n\nIf this keeps happening get IT support.\nPUT' +
            error,
        )
      })
  }
</script>

<style>
  input {
    margin-block-start: unset;
  }
  input:disabled {
    cursor: wait;
  }
</style>

<input
  class="rfidField"
  type="text"
  bind:value={row.card_id}
  disabled={disableTillLoad} />
