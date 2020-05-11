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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
    background: #262e3e;
    color: #ccd1dd;
  }
  :global(.card) {
    position: relative;
    place-content: center center;
    background-color: #2c3445;
    background-repeat: no-repeat;
    block-size: clamp(4.5em, 6.25em, calc(15vh - 2.8rem));
    font-weight: normal;
    color: #ccd1dd;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 1rem;
    margin: 0.4rem;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
      0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12);
  }
  :global(.card:hover) {
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
  }
  :global(input:not([type='range'])) {
    background: none;
    border: 0;
    margin-block-start: 1em;
    border-bottom: 2px solid #838795;
    color: #ccd1dd;
    padding: 0.3rem 0.5rem;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :global(input:not([type='range']):hover),
  :global(input:not([type='range']):active),
  :global(input:not([type='range']):focus) {
    border: 0;
    border-bottom: 2px solid #507ef2;
  }
  :global(::-webkit-scrollbar) {
    inline-size: 1em;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: #838795;
    border-radius: 0.5em;
    box-shadow: 0 3px 3px -2px rgba(0, 0, 0, 0.2),
      0 3px 4px 0 rgba(0, 0, 0, 0.14), 0 1px 8px 0 rgba(0, 0, 0, 0.12);
  }
</style>

<Header on:rolledNames={sendNamestoColumns} />
<FactionColumn on:generate={openDialog} {generatedResults} />
<ExportDialog bind:this={showDialog} {character_name} {faction} />
