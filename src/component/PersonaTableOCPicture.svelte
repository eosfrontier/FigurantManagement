<script>
  import environment from '../../environment.js'
  export let row
  export let preloadedImages
  let togglePicture

  const defaultImageUrl = environment.eoschargen
    ? `${environment.eoschargen}/img/passphoto/npc/default.jpg`
    : './favicon.svg'

  // The imageUrl is now derived reactively from the preloadedImages map passed by the parent.
  // This avoids each component instance making its own network request.
  $: imageUrl =
    (preloadedImages && preloadedImages[row.figu_accountID]) || defaultImageUrl
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
    position: relative; /* Establish positioning context for children */
  }
  div::after {
    content: '👈';
    font-size: 32px;
    left: -2rem;
    bottom: 0.5rem;
    position: relative;
    opacity: 0;
    z-index: 10;
    transition: ease-out 0.25s;
    text-shadow: 0 3px 3px rgb(0 0 0 / 20%), 0 3px 4px rgb(0 0 0 / 14%),
      0 1px 8px rgb(0 0 0 / 12%);
    pointer-events: none;
  }
  .toggled::after {
    opacity: 1;
    left: -4.5rem;
  }
  input {
    position: absolute;
    width: 2.4rem;
    height: 2.4rem;
    margin: 0;
    padding: 0;
    opacity: 0;
    z-index: 15;
    cursor: pointer;
  }
  .toggled input {
    width: 8rem;
    height: 8rem;
  }
  img {
    position: absolute;
    width: 2.4rem;
    aspect-ratio: 1/1;
    transition: ease-out 0.25s;
    z-index: 0;
    box-shadow: 0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%),
      0 1px 5px 0 rgb(0 0 0 / 12%);
    border: none;
  }
  .toggled img {
    width: 8rem;
    z-index: 10;
    box-shadow: 0 5px 5px -3px rgb(0 0 0 / 20%), 0 8px 10px 1px rgb(0 0 0 / 14%),
      0 3px 14px 2px rgb(0 0 0 / 12%);
    border: 0.25rem solid var(--buttonColor);
  }
</style>

<div class:toggled={togglePicture}>
  <img
    src={imageUrl}
    alt="passphoto style picture of {row.figu_name}" />
  <input type="checkbox" bind:checked={togglePicture} />
</div>
