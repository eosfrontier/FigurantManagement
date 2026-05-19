<script>
  import { createEventDispatcher } from 'svelte'
  import Namecard from './Namecard.svelte'
  export let generatedResults
  export let userType
  const dispatch = createEventDispatcher()

  function forwardGenerate(event) {
    dispatch('generate', event.detail)
  }
</script>

<style>
  .gridContainment {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0.4rem;
    max-inline-size: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-block-end: 0.75rem;
  }
  section {
    flex: 1 0 max(250px, calc((100% - 2.4rem) / 7));
    min-inline-size: 250px;
  }
</style>

<div class="gridContainment">
  {#if generatedResults}
    {#each generatedResults as group}
      <section>
        {#each group.names as character_name}
          <Namecard
            on:generate={forwardGenerate}
            {character_name}
            faction={group.faction}
            {userType} />
        {/each}
      </section>
    {/each}
  {/if}
</div>
