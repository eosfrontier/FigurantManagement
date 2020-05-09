<script>
  import Icon from 'fa-svelte'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'
  import { faCrown } from '@fortawesome/free-solid-svg-icons/faCrown'
  import { createEventDispatcher } from 'svelte'
  export let character_name
  export let faction

  const dispatch = createEventDispatcher()

  function generatePersona() {
    dispatch('generate', {
      faction: faction,
      character_name: character_name,
    })
  }
  function keyTest(event) {
    if (event.key === 'Enter') {
      generatePersona()
    }
  }
  function generateAsul() {
    let asulNames = [
      'Catambay',
      'Damolao',
      'Dagita',
      'Agati',
      'Bugaoisa',
      'Gonong',
    ]
    let asulName = asulNames[Math.floor(Math.random() * asulNames.length)]
    let splitName = character_name.split(' ')
    splitName[1] = asulName
    character_name = splitName.join(' ')
  }
</script>

<style>
  .aquila {
    --factionBanner: url('../images/AquilaTop.png');
    --bannerSize: 30%;
  }
  .dugo {
    --factionBanner: url('../images/DugoTop.png');
    --bannerSize: 11%;
  }
  .ekanesh {
    --factionBanner: url('../images/EkaneshTop.png');
    --bannerSize: 11%;
  }
  .pendzal {
    --factionBanner: url('../images/PendzalTop.png');
    --bannerSize: 48%;
  }
  .sona {
    --factionBanner: url('../images/SonaTop.png');
    --bannerSize: 30%;
  }
  section {
    background-size: var(--bannerSize, 10%);
    background-image: var(--factionBanner);
  }
  input[type='text'] {
    inline-size: 100%;
  }
  button.submit,
  button.makeAsul {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    cursor: pointer;
    color: #507ef2;
    background: none;
    border: 1px solid #4975e3;
    border-radius: 5px;
    padding: 0.2em 0.35rem;
    transition: 0.4s;
    margin-bottom: -1rem;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
      0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
    text-shadow: 0 3px 1px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14),
      0 1px 5px rgba(0, 0, 0, 0.12);
  }
  button.makeAsul {
    right: 3em;
  }
  button .tooltip {
    display: none;
    transition: opacity 0.4s;
  }
  button:hover .tooltip,
  button:focus .tooltip {
    display: inline;
  }
  button:hover,
  button:focus {
    background: #4975e3;
    color: #ccd1dd;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
      0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 5px rgba(0, 0, 0, 0.14),
      0 1px 10px rgba(0, 0, 0, 0.12);
  }
  button:active {
    background: #507ef2;
    border-color: #507ef2;
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
    text-shadow: 0 5px 5px rgba(0, 0, 0, 0.2), 0 8px 10px rgba(0, 0, 0, 0.14),
      0 3px 14px rgba(0, 0, 0, 0.12);
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

<section class="card {faction}">
  <input type="text" bind:value={character_name} on:keypress={keyTest} />
  {#if faction == 'dugo'}
    <button class="makeAsul" on:click={generateAsul}>
      <span class="tooltip">Make Asul</span>
      <Icon class="faIcon" icon={faCrown} />
    </button>
  {/if}
  <button class="submit" on:click={generatePersona}>
    <span class="tooltip">Save Persona</span>
    <Icon class="faIcon" icon={faCloudUploadAlt} />
  </button>
</section>
