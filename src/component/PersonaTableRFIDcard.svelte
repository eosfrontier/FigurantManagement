<script>
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import environment from '../../environment.js'

  const dispatch = createEventDispatcher()
  export let row
  let sendTimer
  let changeCheckInterval = 5000
  let hasLoaded = false
  let internalCardID = row.card_id

  onMount(() => {
    setTimeout(function () {
      hasLoaded = true
    }, 1000)
  })

  function saveSucces() {
    dispatch('saveSucces')
  }

  $: if (internalCardID) {
    checkCard()
  }

  function checkCard() {
    if (hasLoaded) {
      clearTimeout(sendTimer)
      sendTimer = setTimeout(changeRFIDcard, changeCheckInterval)
    }
  }

  async function changeRFIDcard() {
    let serverResponse
    let figurantData = { figurant: {} }
    figurantData.figurant.card_id = internalCardID
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
      .then((response) => response.json())
      .then(function (json) {
        return (serverResponse = json)
      })
      .catch((error) => {
        alert(
          'OOPS!\nSomething went horribly wrong, try again in a moment.\n\nIf this keeps happening get IT support.\nPUT ' +
            error,
        )
      })
    if (serverResponse) {
      saveSucces()
    }
  }
</script>

<style>
  input {
    margin-block-start: unset;
  }
</style>

<input type="text" bind:value={internalCardID} />
