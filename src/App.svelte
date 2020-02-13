<script>
  import Namecard from './component/Namecard.svelte'
  let names = ['bob', 'tim', 'john', 'mary']
</script>

{#each names as name}
  <Namecard {name} />
{/each}
