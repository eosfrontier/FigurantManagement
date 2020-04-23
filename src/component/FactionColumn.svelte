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
  section {
    max-width: 15rem;
    float: left;
  }
</style>

<section>
  {#each characters as character (character.id)}
    <Namecard character_name={character.name} faction={character.faction} />
  {/each}
</section>
