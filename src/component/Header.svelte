<script>
  import environment from '../../environment'

  import FABReroll from './FABReroll.svelte'
  import PersonaScreen from './PersonaScreen.svelte'
  export let userType

  function loginNavigate() {
    window.location.replace(environment.login)
  }
</script>

<style>
  header {
    block-size: clamp(4.5em, 6.25em, 10vh);
    background-color: #424959;
    inline-size: 100vw;
    max-inline-size: 100%;
    padding: 0 1em 0 0;
    margin: -0.5rem 0rem 0.5rem -0.5rem;
    box-shadow: var(--materialElevation4boxShadow);
  }
  img {
    block-size: clamp(3.5em, 5.25em, calc(10vh - 1rem));
    padding: 0.5rem;
    filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.2))
      drop-shadow(0 1px 1px rgba(0, 0, 0, 0.14))
      drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
  }
  h1 {
    position: absolute;
    color: #31e184;
    left: clamp(4ch, calc(1vw + 2ch), 8ch);
    font-size: clamp(1.5rem, calc(4vw+1rem), 2rem);
    z-index: 2;
    text-shadow: 0 2px 1px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.14),
      0 1px 3px rgba(0, 0, 0, 0.12);
  }
  p {
    display: inline;
    position: relative;
    bottom: 1ch;
    font-size: clamp(0.625rem, calc(2vw+0.625rem), 1rem);
    line-height: calc(0.625em + 0.5vw);
    color: #ccd1dd;
    font-style: oblique;
    font-weight: lighter;
  }
  button.login {
    position: relative;
    top: 1.11rem;
    padding: 0.5rem 1rem;
  }
</style>

<header>
  {#if userType == 'spelleider' || userType == 'figurant'}
    <h1>iguranten Manager</h1>
    <img src="./favicon.svg" alt="A blue d20 with a green p as overlay" />
    <p>Managing figurant characters has never been easier..!</p>
    {#if userType == 'spelleider'}
      <PersonaScreen />
    {/if}
  {:else}
    <h1>Name Generator</h1>
    {#if !userType}
      <button class="login" on:click={loginNavigate}>
        <mat-ripple color="#ccd1dd33" />
        Log In
      </button>
    {/if}
  {/if}

  <FABReroll on:rolledNames />

</header>
