<script>
  import environment from '../../environment.js'
  export let row
  let togglePicture
  let pictureSize = '2.4rem'
  let zIndex = 0
  let boxShadow =
    '0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%)'
  let border = 'none'
  let visibility = 0
  let leftOffset = '-2rem'

  $: toggleSize(togglePicture)
  function toggleSize() {
    if (togglePicture == true) {
      pictureSize = '8rem'
      zIndex = 10
      boxShadow =
        '0 5px 5px -3px rgb(0 0 0 / 20%), 0 8px 10px 1px rgb(0 0 0 / 14%), 0 3px 14px 2px rgb(0 0 0 / 12%)'
      border = '0.25rem solid var(--buttonColor)'
      visibility = 1
      leftOffset = '-4.5rem'
    } else {
      pictureSize = '2.4rem'
      zIndex = 0
      boxShadow =
        '0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%)'
      border = 'none'
      visibility = 0
      leftOffset = '-2rem'
    }
  }
</script>

<style>
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    width: 2.4rem;
    aspect-ratio: 1/1;
    margin: auto;
  }
  div::after {
    content: '👈';
    font-size: 32px;
    left: var(--leftOffset);
    bottom: 0.5rem;
    position: relative;
    opacity: var(--visibility);
    z-index: 15;
    transition: ease-out 0.25s;
    text-shadow: 0 3px 3px rgb(0 0 0 / 20%), 0 3px 4px rgb(0 0 0 / 14%),
      0 1px 8px rgb(0 0 0 / 12%);
    pointer-events: none;
  }
  input {
    position: absolute;
    width: var(--pictureSize);
    height: var(--pictureSize);
    margin: 0;
    padding: 0;
    opacity: 0;
    z-index: 15;
  }
  img {
    position: absolute;
    width: var(--pictureSize);
    aspect-ratio: 1/1;
    transition: ease-out 0.25s;
    z-index: var(--zIndex);
    box-shadow: var(--boxShadow);
    border: var(--border);
  }
</style>

{#if row.figu_accountID == ''}
  <!-- empty on purpose -->
{:else}
  <div
    style="--pictureSize: {pictureSize}; --zIndex: {zIndex}; --boxShadow: {boxShadow};
    --border: {border}; --visibility: {visibility}; --leftOffset: {leftOffset}">
    <img
      src="{environment.eoschargen}/img/passphoto/npc/{row.figu_accountID}.jpg"
      onerror="this.src='{environment.eoschargen}/img/passphoto/npc/default.jpg'"
      alt="passphoto style pictuer of {row.figu_name}" />
    <input type="checkbox" bind:checked={togglePicture} />

  </div>
{/if}

<!--  -->
