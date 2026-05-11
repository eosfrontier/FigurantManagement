<script>
  import Icon from 'fa-svelte'
  import ripple from 'svelte-ripple'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'
  import { faCrown } from '@fortawesome/free-solid-svg-icons/faCrown'
  import { createEventDispatcher } from 'svelte'
  import { generateICCIDNumber } from './GenerateICCID.svelte'
  export let character_name
  export let faction
  export let userType

  import { allFactionsStore } from './SvelteStore.js'

  // The dollar-prefix creates a subscription to the store.
  // This ensures that we don't try to generate a persona before faction data is available.
  $: dataReady = !!$allFactionsStore
  let isGenerating = false
  const dispatch = createEventDispatcher()
  const backGroundBanner = 'url("images/' + faction + 'Banner.png")'

  async function generatePersona() {
    // The ICC ID needs to be generated before the dialog is opened.
    isGenerating = true
    let icc_number

    try {
      icc_number = await generateICCIDNumber(faction)
    } catch (error) {
      alert(error.message)
      return
    } finally {
      isGenerating = false
    }

    dispatch('generate', {
      faction: faction,
      character_name: character_name,
      icc_number: icc_number,
    })
  }
  function keyTest(event) {
    if (userType == 'spelleider') {
      if (event.key === 'Enter') {
        generatePersona()
      }
    } else {
      return
    }
  }
  // hard coded button regarding the Dugo faction. This exchanges the first last name with an 'Asul' lastname.
  // Adding this button in response of json data is not impossible, but feels too complex atm
  function generateAsul() {
    let asulNames = $allFactionsStore.dugo.asulNames
    let asulName = asulNames[Math.floor(Math.random() * asulNames.length)]
    let splitName = character_name.split(' ')
    splitName[1] = asulName
    character_name = splitName.join(' ')
  }
</script>

<style>
  section {
    background-size: auto 30%;
    inline-size: calc(100% - 0.8rem);
    box-sizing: border-box;
  }

  button.submit,
  button.makeAsul {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.2em 0.35rem;
  }
  button.makeAsul {
    right: 2.5em;
  }
  button .tooltip {
    display: none;
    transition: opacity 0.4s;
  }
  button:hover .tooltip,
  button:focus .tooltip {
    display: inline;
  }
</style>

<!-- The background image is inline css because if its in the <style> bit the images are fetched everytime at any interaction-->
<section
  class="card"
  style="background-image: {backGroundBanner}"
  aria-label={faction}>
  <input type="text" bind:value={character_name} on:keypress={keyTest} />
  {#if userType == 'spelleider' || userType == 'figurant'}
    {#if faction == 'dugo'}
      <button class="makeAsul" on:click={generateAsul} use:ripple={{ color: '#ccd1dd33' }}>
        <span class="tooltip">Make Asul</span>
        <Icon class="faIcon" icon={faCrown} />
      </button>
    {/if}
    <button
      class="submit"
      on:click={generatePersona}
      disabled={isGenerating || !dataReady}
      use:ripple={{ color: '#ccd1dd33' }}>
      <span class="tooltip">Save Persona</span>
      <Icon class="faIcon" icon={faCloudUploadAlt} spin={isGenerating} />
    </button>
  {/if}
</section>
