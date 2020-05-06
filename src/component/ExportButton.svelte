<script>
  import Icon from 'fa-svelte'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'
  import { createEventDispatcher } from 'svelte'
  import config from '../../config.js'
  export let card_id
  export let character_name
  export let faction
  export let ICC_number
  export let threat_assessment
  export let bastion_clearance
  export let douane_disposition
  export let ic_birthday
  export let homeplanet
  export let bloodtype
  export let recurring
  let exportFinishedDispatch = [{ succeeded: false, message: '' }]

  const dispatch = createEventDispatcher()

  function exportToOrthanc() {
    if (card_id == null || card_id == '') {
      exportFinishedDispatch.succeeded = false
      exportFinishedDispatch.message =
        'Scan your ID card. Without it your character cannot be exported.'
    } else if (character_name == null || character_name == '') {
      exportFinishedDispatch.succeeded = false
      exportFinishedDispatch.message =
        "You have removed the name and not entered a new one. You can't be nameless."
    } else if (!config.Factions.includes(faction)) {
      exportFinishedDispatch.succeeded = false
      exportFinishedDispatch.message =
        'You somehow you are part of ' +
        faction +
        '. Please choose a supported faction from the list.'
    } else if (!config.Factions.includes(faction)) {
      exportFinishedDispatch.succeeded = false
      exportFinishedDispatch.message =
        'We were unable to retrieve a unique ICC Number. Try again. If this is the second failure, get IT support.'
    } else {
      exportFinishedDispatch.succeeded = false
      exportFinishedDispatch.message =
        'The exporting to database function does not exist yet. Your persona has not been saved.'
    }
    dispatch('exportFinished', {
      succeeded: exportFinishedDispatch.succeeded,
      message: exportFinishedDispatch.message,
    })
  }
</script>

<style>
  button.submit {
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    float: right;
    color: #31e184;
    background: rgba(44, 52, 69, 0.8);
    border: 0.0625em solid #31e184;
    border-radius: 0.3125em;
    padding: 0.5em;
    margin: 0.5em;
    text-shadow: 0.0625em 0.0625em 0.25em rgba(38, 46, 62, 0.6);
  }

  button.submit:hover,
  button.submit:focus,
  button.submit:active {
    background: #31e184;
    border-color: #31e184;
    color: #ccd1dd;
    box-shadow: 0 0.0625em 0.1875em rgba(0, 0, 0, 0.12),
      0 0.0625em 0.125em rgba(0, 0, 0, 0.24);
  }
</style>

<button class="submit" on:click={exportToOrthanc}>
  <Icon class="faIcon" icon={faCloudUploadAlt} />
  Save Character
</button>
