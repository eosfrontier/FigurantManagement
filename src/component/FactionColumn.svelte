<script>
  import Namecard from './Namecard.svelte'
  export let generatedResults
  export let userType
</script>

<style>
  .gridContainment {
    display: flex;
    flex-wrap: wrap;
    place-content: start center;
  }
  section {
    min-inline-size: 17.5vw;
  }
  section.padding {
    display: none;
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 80.5em) {
    .gridContainment {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
    }
    section {
      grid-column-end: span 2;
    }
    section.padding {
      grid-column-end: span 1;
      display: none;
    }
    section:nth-child(6),
    section:nth-child(10n + 6),
    section:nth-child(10n) {
      display: block;
    }
  }
  @media screen and (max-width: 61.5em) {
    .gridContainment {
      grid-template-columns: repeat(4, 1fr);
    }
    section:nth-child(4),
    section:nth-child(10n + 4) {
      display: block;
    }
    section:nth-child(10n) {
      display: none;
    }
  }
  @media screen and (max-width: 47em) {
    .gridContainment {
      grid-template-rows: repeat(4, 1fr);
    }
    section {
      grid-column-end: span 4;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    section:nth-child(4),
    section:nth-child(6),
    section:nth-child(10n + 4),
    section:nth-child(10n + 6) {
      display: none;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 35em) {
    .gridContainment {
      grid-template-columns: repeat(2, 1fr);
    }
    section {
      grid-column-end: span 2;
      display: unset;
      grid-template-columns: unset;
    }
  }
</style>

<div class="gridContainment">
  {#if generatedResults}
    {#each generatedResults as group}
      <section>
        {#each group.names as character_name}
          <Namecard
            on:generate
            {character_name}
            faction={group.faction}
            {userType} />
        {/each}
      </section>
      <section class="padding" />
    {/each}
  {/if}
</div>
