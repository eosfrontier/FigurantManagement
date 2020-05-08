<script>
  export let characterID
  export let character_name
  export let card_id
  export let faction
  export let status
  let singleUse = false
  import Icon from 'fa-svelte'
  import { faIdCard } from '@fortawesome/free-solid-svg-icons/faIdCard'
  import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
  if (status == 'singleUse') {
    singleUse = true
  } else {
    singleUse = false
  }
</script>

<style>
  .aquila {
    --factionBanner: url('../images/AquilaTop.png');
  }
  .dugo {
    --factionBanner: url('../images/DugoTop.png');
  }
  .ekanesh {
    --factionBanner: url('../images/EkaneshTop.png');
  }
  .pendzal {
    --factionBanner: url('../images/PendzalTop.png');
  }
  .sona {
    --factionBanner: url('../images/SonaTop.png');
  }
  section {
    position: relative;
    place-content: center center;
    background-color: #2c3445;
    background-repeat: no-repeat;
    background-size: auto 30%;
    background-image: var(--factionBanner);
    block-size: clamp(4.5em, 6.25em, calc(15vh - 2.8rem));
    min-inline-size: 17.5vw;
    font-weight: normal;
    color: #ccd1dd;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 1rem;
    margin: 0.4rem;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
      0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12);
  }
  .databaseNumber {
    position: absolute;
    top: 0.2em;
    left: 1.5em;
    font-size: large;
    font-weight: bolder;
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: #2c3445;
  }
</style>

<section class="card {faction}">
  <span class="databaseNumber">{characterID}</span>
  {#if !singleUse}
    <label>
      <Icon class="faIcon" icon={faIdCard} />
      Card ID:
      <br />

      <input type="text" bind:value={card_id} placeholder="Switch ID card" />
    </label>
  {/if}
  <label>
    <Icon class="faIcon" icon={faUser} />
    Character Name:
    <br />
    <input type="text" bind:value={character_name} disabled />
  </label>
</section>
