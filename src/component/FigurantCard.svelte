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
    background-size: auto 30%;
    background-image: var(--factionBanner);
    min-inline-size: 17.5vw;
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
  <label>
    <Icon class="faIcon" icon={faUser} />
    <input type="text" bind:value={character_name} disabled />
  </label>
  {#if !singleUse}
    <label>
      <Icon class="faIcon" icon={faIdCard} />
      <input type="text" bind:value={card_id} placeholder="Link to Card" />
    </label>
  {/if}

</section>
