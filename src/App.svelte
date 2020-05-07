<script>
  import Header from './component/Header.svelte'
  import FactionColumn from './component/FactionColumn.svelte'
  import ExportDialog from './component/ExportDialog.svelte'
  let character_name
  let faction
  let showDialog
  let generatedResults
  function openDialog(event) {
    character_name = event.detail.character_name
    faction = event.detail.faction
    showDialog.show()
  }
  function sendNamestoColumns(event) {
    generatedResults = event.detail
  }
</script>

<style>
  :global(body) {
    background: #262e3e;
    color: #ccd1dd;
  }
</style>

<Header on:rolledNames={sendNamestoColumns} />
<FactionColumn on:generate={openDialog} {generatedResults} />
<ExportDialog bind:this={showDialog} {character_name} {faction} />
