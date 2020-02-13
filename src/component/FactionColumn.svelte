<script>
  import Namecard from './Namecard.svelte'
  let names = ['bobs', 'tim', 'john', 'mary']
</script>

<style>
  section {
    max-width: 15rem;
    float: left;
  }
</style>

<section>
  {#each names as name}
    <Namecard {name} />
  {/each}
</section>
