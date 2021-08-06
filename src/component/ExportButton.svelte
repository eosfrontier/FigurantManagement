<script>
  import Icon from 'fa-svelte'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'
  import { createEventDispatcher } from 'svelte'
  import config from '../../config.js'
  import environment from '../../environment.js'
  export let card_id
  export let character_name
  export let faction
  export let icc_number
  export let threat_assessment
  export let bastion_clearance
  export let douane_disposition
  export let rank
  export let ic_birthday
  export let homeplanet
  export let bloodtype
  export let recurring
  let errorWait = false

  const dispatch = createEventDispatcher()

  function errorMessage(success, message) {
    dispatch('exportFinished', {
      succeeded: success,
      message: message,
    })
  }

  function checkForm() {
    if (card_id == null || card_id == '') {
      disableSending(5)
      errorMessage(
        false,
        'Scan your ID card. Without it your character cannot be exported.',
      )
    } else if (character_name == null || character_name == '') {
      disableSending(5)
      errorMessage(
        false,
        "You have removed the name and not entered a new one. You can't be nameless.",
      )
    } else if (!config.Factions.includes(faction)) {
      disableSending(5)
      errorMessage(
        false,
        'You somehow you are part of ' +
          faction +
          '. Please choose a supported faction from the list.',
      )
    } else {
      if (rank == null || rank == '') {
        rank = ''
      }
      exportToOrthanc()
    }
  }
  async function exportToOrthanc() {
    let serverResponse
    let figurantData = {
      figurant: {
        card_id: card_id,
        character_name: character_name,
        faction: faction,
        rank: rank,
        douane_notes: '',
        threat_assessment: threat_assessment,
        douane_disposition: douane_disposition,
        bastion_clearance: bastion_clearance,
        icc_number: icc_number,
        bloodtype: bloodtype,
        ic_birthday: ic_birthday,
        homeplanet: homeplanet,
        recurring: false,
      },
    }
    if (recurring == true) {
      figurantData.figurant.recurring = true
    }
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'POST',
      mode: 'cors',
      headers: {
        token: environment.token,
        'cache-control': 'no-cache',
        figurant: JSON.stringify(figurantData.figurant),
      },
    })
      .then((response) => response.json())
      .then(function (json) {
        return (serverResponse = json)
      })

      .catch((error) => {
        disableSending(12)
        errorMessage(
          false,
          'OOPS!\nSomething went horribly wrong, try again in a moment.\n\nIf this keeps happening get IT support.\nPOST' +
            error,
        )
      })
    if (serverResponse) {
      let name
      if (!rank == '') {
        name = [rank, character_name].join(' ')
      } else {
        name = character_name
      }
      errorMessage(
        true,
        'Your ' +
          faction +
          ' character: «' +
          name +
          '» has been saved to the database.',
      )
    }
  }
  function disableSending(waitTimeInSeconds) {
    errorWait = true
    setTimeout(function () {
      errorWait = false
    }, waitTimeInSeconds * 1000)
  }
</script>

<style>
  button {
    --buttonColor: #31e184;
    --buttonAccent: #31e184;
    --buttonText: #28292c;
  }
</style>

<button class="submit" on:click={checkForm} disabled={errorWait}>
  <Icon class="faIcon" icon={faCloudUploadAlt} />
  Save Character
  <mat-ripple color="#28292c33" />
</button>
