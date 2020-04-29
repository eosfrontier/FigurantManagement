<script>
  import Namecard from './Namecard.svelte'
  let characters = [
    { id: 1, faction: 'aquila', name: 'Cat' },
    { id: 2, faction: 'dugo', name: 'Maru' },
    { id: 3, faction: 'sona', name: 'Henri' },
    { id: 4, faction: 'pendzal', name: 'Jonathan' },
    { id: 5, faction: 'ekanesh', name: 'Selt' },
  ]
</script>

<style>
  .gridContainment {
    display: flex;
    place-content: start center;
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 76em) {
    .gridContainment {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
    }
    section {
      grid-column-end: span 2;
    }
    section.padding {
      grid-column-end: span 1;
    }
    section.padding.four {
      display: none;
    }
  }
  @media screen and (max-width: 61.5em) {
    .gridContainment {
      grid-template-columns: repeat(4, 1fr);
    }
    section.padding.four {
      display: block;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    .gridContainment {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(5, 1fr);
    }
    section.padding,
    section.padding.four {
      display: none;
    }
  }
</style>

<div class="gridContainment">
  <section id="aquila">
    {#each characters as character (character.id)}
      <Namecard character_name={character.name} faction={character.faction} />
    {/each}
  </section>

  <section>
    {#each characters as character (character.id)}
      <Namecard character_name={character.name} faction={character.faction} />
    {/each}
  </section>

  <section class="padding four" />

  <section>
    {#each characters as character (character.id)}
      <Namecard character_name={character.name} faction={character.faction} />
    {/each}
  </section>

  <section class="padding" />

  <section>
    {#each characters as character (character.id)}
      <Namecard character_name={character.name} faction={character.faction} />
    {/each}
  </section>

  <section>
    {#each characters as character (character.id)}
      <Namecard character_name={character.name} faction={character.faction} />
    {/each}
  </section>

  <section class="padding" />
</div>
