<script>
  import Header from './component/Header.svelte'
  import FactionColumn from './component/FactionColumn.svelte'
  import ExportDialog from './component/ExportDialog.svelte'
  let character_name
  let faction
  let showDialog
  function openDialog(event) {
    character_name = event.detail.character_name
    faction = event.detail.faction
    showDialog.show()

  }
</script>

<style>
  :global(body) {
    background: #262e3e;
    color: #ccd1dd;
  }
</style>

<Header />
<FactionColumn on:generate={openDialog} />
<ExportDialog bind:this={showDialog} {character_name} {faction} />
