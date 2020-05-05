<script>
  import Icon from 'fa-svelte'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'
  import { createEventDispatcher } from 'svelte'
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

  const dispatch = createEventDispatcher()

  function exportToOrthanc() {
    dispatch('exportFinished', {
      succeeded: true,
    })
    console.log(card_id)
    console.log(character_name)
    console.log(faction)
    console.log(ICC_number)
    console.log(threat_assessment)
    console.log(bastion_clearance)
    console.log(douane_disposition)
    console.log(ic_birthday)
    console.log(homeplanet)
    console.log(bloodtype)
    console.log(recurring)
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
