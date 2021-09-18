<script>
  import { onMount } from 'svelte'
  import environment from '../environment.js'

  import Header from './component/Header.svelte'
  import FactionColumn from './component/FactionColumn.svelte'
  import ExportDialog from './component/ExportDialog.svelte'
  let character_name
  let faction
  let showDialog
  let generatedResults
  let joomlaUserData
  let userType

  onMount(() => {
    setTimeout(function () {
      resolveJoomlaSession()
    }, 500)
  })

  function openDialog(event) {
    character_name = event.detail.character_name
    faction = event.detail.faction
    showDialog.show()
  }
  function sendNamestoColumns(event) {
    generatedResults = event.detail
  }
  async function resolveJoomlaSession() {
    // this doesn't work yet, we need to ask josh why
    await fetch(environment.orthanc + 'joomla/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        'cache-control': 'no-cache',
      },
    }).then(async function (response) {
      if (response.status == 200) {
        joomlaUserData = await response.json()
      } else {
        console.log('[resolveJoomlaSession] something went wrong')
      }
    })
    resolveUserType(joomlaUserData)
  }

  // user types we care about | hard coded, because there is no soft way to do this without being silly
  /* id: "30" parent_id: "29" title: "SL"
    id: "31" parent_id: "29" title: "Figurant"
    id: '8', parent_id: '1', title: 'Super Users'
   */
  function resolveUserType(userData) {
    userData.groups.forEach((id) => {
      if (id == 30 || id == 8) {
        userType = 'spelleider'
      } else if (id == 31) {
        userType = 'figurant'
      }
    })
  }
</script>

<style>
  :global(:root) {
    --materialElevation1boxShadow: 0 2px 1px -1px rgb(0 0 0 / 20%),
      0 1px 1px 0 rgb(0 0 0 / 14%), 0 1px 3px 0 rgb(0 0 0 / 12%);
    --materialElevation2boxShadow: 0 3px 1px -2px rgb(0 0 0 / 20%),
      0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%);
    --materialElevation3boxShadow: 0 3px 3px -2px rgb(0 0 0 / 20%),
      0 3px 4px 0 rgb(0 0 0 / 14%), 0 1px 8px 0 rgb(0 0 0 / 12%);
    --materialElevation4boxShadow: 0 2px 4px -1px rgb(0 0 0 / 20%),
      0 4px 5px 0 rgb(0 0 0 / 14%), 0 1px 10px 0 rgb(0 0 0 / 12%);
    --materialElevation6boxShadow: 0 3px 5px -1px rgb(0 0 0 / 20%),
      0 6px 10px 0 rgb(0 0 0 / 14%), 0 1px 18px 0 rgb(0 0 0 / 12%);
    --materialElevation8boxShadow: 0 5px 5px -3px rgb(0 0 0 / 20%),
      0 8px 10px 1px rgb(0 0 0 / 14%), 0 3px 14px 2px rgb(0 0 0 / 12%);
    --materialElevation12boxShadow: 0 7px 8px -4px rgb(0 0 0 / 20%),
      0 12px 17px 2px rgb(0 0 0 / 14%), 0 5px 22px 4px rgb(0 0 0 / 12%);
    --materialElevation16boxShadow: 0 8px 10px -5px rgb(0 0 0 / 20%),
      0 16px 24px 2px rgb(0 0 0 / 14%), 0 6px 30px 5px rgb(0 0 0 / 12%);
    --materialElevation24boxShadow: 0 11px 15px -7px rgb(0 0 0 / 20%),
      0 24px 38px 3px rgb(0 0 0 / 14%), 0 9px 46px 8px rgb(0 0 0 / 12%);
  }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
    background: #262e3e;
    color: #ccd1dd;
    --buttonColor: #386ae8;
    --buttonAccent: #507ef2;
    --buttonText: #ccd1dd;
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
    box-shadow: var(--materialElevation1boxShadow);
  }
  :global(.card:hover) {
    box-shadow: var(--materialElevation8boxShadow);
  }
  :global(input),
  :global(button),
  :global(select),
  :global(textarea) {
    font-family: inherit;
    font-size: inherit;
    margin: 0 0 0.5em 0;
    box-sizing: border-box;
  }
  :global(input:not([type='range'])) {
    inline-size: 100%;
    background: none;
    border: 0;
    margin-block-start: 2em;
    border-bottom: 2px solid #838795;
    color: #ccd1dd;
    padding: 0.3rem 0.5rem;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :global(input:not([type='range']):hover),
  :global(input:not([type='range']):active) {
    border: 0;
    border-bottom: 2px solid var(--buttonColor);
  }
  :global(label) {
    display: block;
  }
  :global(button) {
    cursor: pointer;
    outline: none;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    float: right;
    color: var(--buttonColor);
    background: rgba(44, 52, 69, 0.8);
    border: 0.0625em solid var(--buttonColor);
    border-radius: 0.3125em;
    padding: 0.5em;
    margin: 0.5em;
    box-shadow: var(--materialElevation2boxShadow);
  }
  :global(button:hover),
  :global(button:active) {
    background: var(--buttonColor);
    border-color: var(--buttonColor);
    color: var(--buttonText);
    box-shadow: var(--materialElevation8boxShadow);
  }
  :global(button:active) {
    border-color: var(--buttonAccent);
  }
  :global(button[disabled]),
  :global(button[disabled]:hover),
  :global(button[disabled]:active) {
    transition: 1s;
    color: #ccd1dd;
    background: #3b414e;
    border-color: #ccd1dd;
    cursor: progress;
  }
  :global(::-webkit-scrollbar) {
    inline-size: 1em;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: #838795;
    border-radius: 0.5em;
    box-shadow: var(--materialElevation3boxShadow);
  }
</style>

<svelte:head>
  {#if userType == 'spelleider'}
    <title>Figuranten Manager</title>
    <link rel="icon" type="image/png" href="./favicon.svg" />
  {:else}
    <title>Name Generator</title>
  {/if}
</svelte:head>

<Header on:rolledNames={sendNamestoColumns} {userType} />
<FactionColumn on:generate={openDialog} {generatedResults} {userType} />
<ExportDialog bind:this={showDialog} {character_name} {faction} />
