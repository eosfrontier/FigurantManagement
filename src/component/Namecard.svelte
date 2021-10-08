<script>
  import Icon from 'fa-svelte'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'
  import { faCrown } from '@fortawesome/free-solid-svg-icons/faCrown'
  import { createEventDispatcher } from 'svelte'
  export let character_name
  export let faction
  export let userType

  import { allFactionsStoreArray } from './SvelteStore.js'

  const dispatch = createEventDispatcher()
  const backGroundBanner = 'url("../images/' + faction + 'Banner.png")'

  async function generatePersona() {
    dispatch('generate', {
      faction: faction,
      character_name: character_name,
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
    let asulNames = $allFactionsStoreArray[0].dugo.asulNames
    let asulName = asulNames[Math.floor(Math.random() * asulNames.length)]
    let splitName = character_name.split(' ')
    splitName[1] = asulName
    character_name = splitName.join(' ')
  }
</script>

<style>
  section {
    background-size: auto 30%;
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
  /* Tablet size or smaller */
  @media screen and (max-width: 80.5em) {
    .card:nth-child(n + 4) {
      display: none;
    }
  }
  @media screen and (max-width: 61.5em) {
    .card:nth-child(n + 3) {
      display: none;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    .card:nth-child(n + 3) {
      display: none;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 35em) {
    .card:nth-child(n + 2) {
      display: none;
    }
  }
</style>

<!-- The background image is inline css because if its in the <style> bit the images are fetched everytime at any interaction-->
<section class="card" style="background-image: {backGroundBanner}">
  <input type="text" bind:value={character_name} on:keypress={keyTest} />
  {#if userType == 'spelleider' || userType == 'figurant'}
    {#if faction == 'dugo'}
      <button class="makeAsul" on:click={generateAsul}>
        <span class="tooltip">Make Asul</span>
        <Icon class="faIcon" icon={faCrown} />
        <mat-ripple color="#ccd1dd33" />
      </button>
    {/if}
    <button class="submit" on:click={generatePersona}>
      <span class="tooltip">Save Persona</span>
      <Icon class="faIcon" icon={faCloudUploadAlt} />
      <mat-ripple color="#ccd1dd33" />
    </button>
  {/if}
</section>
