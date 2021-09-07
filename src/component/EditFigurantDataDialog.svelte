<script>
  export let character_data
  let showEditDialog
  export const show = () => showEditDialog.showModal()
</script>

<dialog bind:this={showEditDialog} />
