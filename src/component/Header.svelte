<script>
  import FABReroll from './FABReroll.svelte'
</script>

<style>
  header {
    block-size: clamp(4.5em, 6.25em, 10vh);
    background-color: #424959;
    inline-size: 100vw;
    padding: 0;
    margin: -0.5rem -0.5rem 0.5rem -0.5rem;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
      0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
  }
  img {
    block-size: clamp(3.5em, 5.25em, calc(10vh - 1rem));

    padding: 0.5rem;
    filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.2))
      drop-shadow(0 1px 1px rgba(0, 0, 0, 0.14))
      drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
  }
  h1 {
    position: fixed;
    color: #31e184;
    left: clamp(3ch, 5ch, calc(2vh + 3ch));
    top: -0.65ch;
    z-index: 2;
    text-shadow: 0 2px 1px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.14),
      0 1px 3px rgba(0, 0, 0, 0.12);
  }
  p {
    display: inline;
    position: relative;
    bottom: 1ch;
    font-size: calc(0.5em + 0.5vw);
    line-height: calc(0.625em + 0.5vw);
    color: #ccd1dd;
    font-style: oblique;
    font-weight: lighter;
  }
</style>

<header>
  <h1>ersona Generator</h1>
  <img src="./favicon.svg" alt="A blue d20 with a green p as overlay" />
  <p>Creating a figurant personage has never been easier..!</p>
  <FABReroll />
</header>
