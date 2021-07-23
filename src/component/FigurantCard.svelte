<script>
  export let characterID
  export let character_name
  export let card_id
  export let faction
  export let status
  let singleUse = false
  let exists = true
  import environment from '../../environment.js'
  import MatRipple from 'mat-ripple'
  import Icon from 'fa-svelte'
  import { faIdCard } from '@fortawesome/free-solid-svg-icons/faIdCard'
  import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
  const backGroundBanner = 'url("../images/' + faction + 'Banner.png")'

  if (status == 'singleUse') {
    singleUse = true
  } else {
    singleUse = false
  }

  async function deleteFigurant() {
    if (
      confirm(
        'Are you sure you want to delete "' +
          character_name +
          '"?\n\nThis figurant will be deleted immediately. You can\'t undo this action.',
      )
    ) {
      await fetch(environment.figurantsAPI, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          token: environment.token,
          id: characterID,
          'cache-control': 'no-cache',
        },
      })
        .then(function (response) {
          if (response.status == 200 || response.status == 204) {
            exists = false
            alert('Character deleted')
          } else {
            alert('Something went wrong')
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
</script>

<style>
  section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 2em 3.5em 3.5em 3.5em;
    grid-template-areas:
      'top numberbutton'
      'name namebutton'
      'id idbutton'
      'something deletebutton';
    background-size: auto 20%;
    background-image: var(--factionBanner);
    min-inline-size: 17.5vw;
    min-block-size: 12em;
  }
  input {
    margin: unset;
  }
  input[disabled],
  input[disabled]:hover,
  input[disabled]:active {
    color: #838795;
    border-color: #838795;
  }
  label.name {
    grid-area: name;
  }
  label.id {
    grid-area: id;
  }
  button {
    margin: 0.85em 0.5em 0.15em 0.5em;
  }
  button.number {
    font-size: 0.8em;
    grid-area: numberbutton;
    margin: 0 auto 0.15rem auto;
  }
  button.name {
    grid-area: namebutton;
  }
  button.id {
    grid-area: idbutton;
    --buttonColor: #31e184;
    --buttonAccent: #31e184;
    --buttonText: #28292c;
  }
  button.delete {
    grid-area: deletebutton;
    --buttonColor: #f2507e;
  }
</style>

{#if exists}
  <section class="card" style="--factionBanner: {backGroundBanner}">
    <label class="name">
      <Icon class="faIcon" icon={faUser} />
      Character Name:
      <input type="text" bind:value={character_name} disabled />
    </label>
    {#if !singleUse}
      <label class="id">
        <Icon class="faIcon" icon={faIdCard} />
        Card ID:
        <input type="text" bind:value={card_id} placeholder="Link to Card" />
      </label>
      <button class="number">
        Copy ID #{characterID}
        <mat-ripple color="#ccd1dd33" />
      </button>
      <button class="name">
        Link Picture
        <mat-ripple color="#ccd1dd33" />
      </button>
    {/if}
    <button class="id">
      Link to Card
      <mat-ripple color="#28292c33" />
    </button>
    <button class="delete" on:click={deleteFigurant}>
      Delete
      <mat-ripple color="#ccd1dd33" />
    </button>
  </section>
{/if}
