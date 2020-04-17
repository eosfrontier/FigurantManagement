<script>
  import MobileHeader from './component/MobileHeader.svelte'
  import FactionColumn from './component/FactionColumn.svelte'
  import FABReroll from './component/FABReroll.svelte'
  import ExportDialog from './component/ExportDialog.svelte'
</script>

<style>
  :global(body) {
    background: #262e3e;
    color: #ccd1dd;
  }
</style>

<FABReroll />
<MobileHeader />
<FactionColumn />
<ExportDialog />
