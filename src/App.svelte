<script>
  import MobileHeader from './component/MobileHeader.svelte'
  import FactionColumn from './component/FactionColumn.svelte'
  import FABReroll from './component/FABReroll.svelte'
</script>

<style>
  :global(body) {
    background: #262e3e;
    color: #ccd1dd;
  }
</style>

<FABReroll />
<FactionColumn />

<!-- https://svelte.dev/repl/e1b6426b27474c09aca7bc434ee5017c?version=3.20.1 -->
