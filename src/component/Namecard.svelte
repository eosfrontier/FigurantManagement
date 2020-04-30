<script>
  import { createEventDispatcher } from 'svelte'
  export let character_name
  export let faction

  const dispatch = createEventDispatcher()

  function generatePersona() {
    dispatch('generate', {
      faction: faction,
      character_name: character_name,
    })
  }
</script>

<style>
  .aquila {
    --factionBanner: url('../images/AquilaTop.png');
    --bannerSize: 20%;
  }
  .dugo {
    --factionBanner: url('../images/DugoTop.png');
    --bannerSize: 7%;
  }
  .ekanesh {
    --factionBanner: url('../images/EkaneshTop.png');
    --bannerSize: 7%;
  }
  .pendzal {
    --factionBanner: url('../images/PendzalTop.png');
    --bannerSize: 32%;
  }
  .sona {
    --factionBanner: url('../images/SonaTop.png');
    --bannerSize: 20%;
  }
  section {
    background-color: #2c3445;
    background-repeat: no-repeat;
    background-size: var(--bannerSize, 10%);
    background-image: var(--factionBanner);
    block-size: clamp(4.5em, 6.25em, calc(15vh - 2.8rem));
    font-weight: normal;
    color: #ccd1dd;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 1rem;
    margin: 0.4rem;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
      0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12);
  }
  section:hover {
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
  }
  input[type='text'] {
    width: auto;
    background: none;
    border: 0;
    border-bottom: 2px solid #838795;
    color: #ccd1dd;
    padding: 0.3rem 0.5rem;
    transition: 0.3s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 95%;
  }
  input[type='text']:hover,
  input[type='text']:active,
  input[type='text']:focus {
    border: 0;
    color: #ccd1dd;
    border-bottom: 2px solid #507ef2;
  }
  button.submit {
    cursor: pointer;
    color: #507ef2;
    background: none;
    border: 1px solid #4975e3;
    border-radius: 5px;
    padding: 0.5rem;
    transition: 0.4s;
    margin-bottom: -1rem;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
      0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
    text-shadow: 0 3px 1px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14),
      0 1px 5px rgba(0, 0, 0, 0.12);
  }
  button:hover,
  button:focus {
    background: #4975e3;
    color: #ccd1dd;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
      0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 5px rgba(0, 0, 0, 0.14),
      0 1px 10px rgba(0, 0, 0, 0.12);
  }
  button:active {
    background: #507ef2;
    border-color: #507ef2;
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
    text-shadow: 0 5px 5px rgba(0, 0, 0, 0.2), 0 8px 10px rgba(0, 0, 0, 0.14),
      0 3px 14px rgba(0, 0, 0, 0.12);
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 76em) {
    .card:nth-child(n + 4) {
      display: none;
    }
  }
  @media screen and (max-width: 61.5em) {
    .card:nth-child(n + 3) {
      display: none;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    .card:nth-child(n + 3) {
      display: none;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 35em) {
    .card:nth-child(n + 2) {
      display: none;
    }
  }
</style>

<section class="card {faction}">
  <input type="text" bind:value={character_name} />
  <button class="submit" on:click={generatePersona}>generate</button>
</section>
