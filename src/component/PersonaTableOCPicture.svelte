<script>
  import { onMount } from 'svelte'
  import environment from '../../environment.js'
  export let row
  let togglePicture

  let imageUrl = ''
  const defaultImageUrl = `${environment.eoschargen}/img/passphoto/npc/default.jpg`

  onMount(() => {
    // The `fetch` API requires the server to support CORS for cross-origin requests.
    // The image server doesn't seem to be configured for this, causing errors.
    // We'll use the `new Image()` preloading technique, which leverages the browser's
    // more lenient policy for `<img>` tags and does not require CORS for existence checks.
    if (row.figu_accountID) {
      const potentialUrl = `${environment.eoschargen}/img/passphoto/npc/${row.figu_accountID}.jpg`
      const img = new Image()
      img.onload = () => {
        imageUrl = potentialUrl
      }
      img.onerror = () => {
        imageUrl = defaultImageUrl
      }
      img.src = potentialUrl
    } else {
      imageUrl = defaultImageUrl
    }
  })
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

{#if imageUrl}
  <div class:toggled={togglePicture}>
    <img
      src={imageUrl}
      alt="passphoto style picture of {row.figu_name}" />
    <input type="checkbox" bind:checked={togglePicture} />
  </div>
{/if}
