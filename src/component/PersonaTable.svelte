<script>
  import { onMount } from 'svelte'
  import environment from '../../environment.js'
  import { Datatable } from 'svelte-simple-datatables'
  import PersonaTableSelectOCFiguDropdown from './PersonaTableSelectOCFiguDropdown.svelte'
  import PersonaTableOCPicture from './PersonaTableOCPicture.svelte'
  import PersonaTableEditButton from './PersonaTableEditButton.svelte'
  import EditFigurantDataDialog from './EditFigurantDataDialog.svelte'
  import PersonaTableRFIDcard from './PersonaTableRFIDcard.svelte'
  import Icon from 'fa-svelte'
  import { faRedo } from '@fortawesome/free-solid-svg-icons/faRedo'

  let figurantsList
  let ocFigurantenNames
  let all_figurants
  let missingFiguranten = false
  let character_data
  let showEditDialog
  const settings = {
    pagination: false,
    columnFilter: true,
    css: false,
    blocks: {
      searchInput: true,
      paginationButtons: false,
      paginationRowCount: false,
    },
  }
  let rows

  onMount(() => {
    setTimeout(function () {
      getAllFigurants()
      getGroupID('monsterland')
    }, 125)
  })

  function openEditDialog(event) {
    character_data = event.detail
    showEditDialog.show()
  }

  async function getGroupID(groupName) {
    await fetch(environment.orthanc + 'joomla/groups/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        name: groupName,
        'cache-control': 'no-cache',
      },
    }).then(async function (response) {
      if (response.status == 200) {
        let group = await response.json()
        getUsersBasedonID(group[0].id)
      } else {
        console.log('[getGroupID] something went wrong')
      }
    })
  }

  async function getUsersBasedonID(groupID) {
    await fetch(environment.orthanc + 'joomla/users/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        group_id: groupID,
        'cache-control': 'no-cache',
      },
    }).then(async function (response) {
      if (response.status == 200) {
        let list = await response.json()
        ocFigurantenNames = list
      } else {
        console.log('[getUsersBasedonID] something went wrong')
      }
    })
  }

  async function getAllFigurants() {
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        'cache-control': 'no-cache',
        all_figurants,
      },
    }).then(async function (response) {
      if (response.status == 200) {
        figurantsList = await response.json()
      } else {
        missingFiguranten = true
      }
    })
  }
  async function deleteFigurant(id, name) {
    if (
      confirm(
        'Are you sure you want to delete "' +
          name +
          '"?\n\nThis figurant will be deleted immediately. You can\'t undo this action.',
      )
    ) {
      await fetch(environment.orthanc + 'chars_figu/', {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          token: environment.token,
          id: id,
          'cache-control': 'no-cache',
        },
      })
        .then(function (response) {
          if (response.status == 200 || response.status == 204) {
            console.log('[deleteFigurant] figurant ' + name + ' deleted')
            getAllFigurants()
          } else {
            console.log(
              '[deleteFigurant] Something went wrong when trying to delete figurant ' +
                id,
            )
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  async function updateFigurantData(idvar, recurringStatus) {
    let changeStatusTo
    if (recurringStatus === 'figurant-recurring') {
      changeStatusTo = false
    } else if (recurringStatus === 'figurant') {
      changeStatusTo = true
    } else {
      changeStatusTo = null
    }
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'PUT',
      mode: 'cors',
      headers: {
        token: environment.token,
        id: idvar,
        figurant: JSON.stringify({ recurring: changeStatusTo }),
        'cache-control': 'no-cache',
      },
    })
      .then(function (response) {
        if (response.status == 200 || response.status == 204) {
          console.log(
            '[updateFigurantData]: changed status of figurant ' +
              idvar +
              ' to ' +
              changeStatusTo,
          )
          getAllFigurants()
        } else {
          console.log(
            '[updateFigurantData] something went wrong trying change the status of figurant ' +
              idvar +
              ' to ' +
              changeStatusTo,
          )
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
</script>

<style>
  .gridLayout {
    height: 100%;
    width: 100%;
  }
  thead th:nth-child(1) {
    width: 12ch;
    text-align: center;
  }
  thead th:nth-child(2) {
    width: 9ch;
  }
  thead th:nth-child(3) {
    width: 35ch;
  }
  thead th:nth-child(4) {
    width: 5ch;
    text-align: center;
  }
  thead th:nth-child(5) {
    width: 13ch;
  }
  thead th:nth-child(6) {
    width: 25ch;
  }
  thead th:nth-child(7) {
    width: 8ch;
  }
  td {
    text-align: center;
  }
  button {
    float: unset;
    padding: 0 0.25rem;
    margin: 0.25rem 0;
  }
  input[type='text'] {
    padding: unset;
    margin: unset;
  }
  input:not([type='range']) {
    padding: unset;
    margin: unset;
  }
  label.styledCheckbox {
    position: relative;
    display: inline-block;
    pointer-events: none;
    top: -1.75em;
    left: -1.75em;
  }
  label.styledCheckbox::before,
  label.styledCheckbox::after {
    position: absolute;
    content: '';
    display: inline-block;
  }
  label.styledCheckbox::before {
    block-size: 1.5em;
    inline-size: 1.5em;

    border: 0.0625em solid #386ae8;
    border-radius: 0.3125em;
  }
  label.styledCheckbox::after {
    height: 1rem;
    width: 1.5rem;
    color: #386ae8;
    font-size: 2em;
    top: -0.45em;
    left: 0.1em;
    text-shadow: 0 2px 1px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.14),
      0 1px 3px rgba(0, 0, 0, 0.12);
  }
  input[type='checkbox'] {
    inline-size: auto;
    opacity: 0;
    margin-block-start: 0.25em;
    margin-block-end: 0em;
    zoom: 2;
  }
  input[type='checkbox'] + label::after {
    content: none;
  }
  input[type='checkbox']:checked + label::after {
    content: '✓';
    color: #ccd1dd;
  }
  input[type='checkbox']:hover + label::before,
  input[type='checkbox']:active + label::before {
    border: 0.0625em solid #507ef2;
    background: #507ef2;
    box-shadow: var(--materialElevation1boxShadow);
  }
  .refresh {
    position: absolute;
    right: 1rem;
    top: 2rem;
    color: #ccd1dd;
    background: #386ae8;
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
    padding-top: 0.25rem;
    margin-bottom: 0rem;
    box-shadow: var(--materialElevation6boxShadow);
    z-index: 20;
  }
  @media (hover: hover) {
    .refresh:hover {
      box-shadow: var(--materialElevation12boxShadow);
    }
  }
  .refresh:active {
    box-shadow: var(--materialElevation12boxShadow);
  }
  td.aquila {
    background: url('../images/aquilaBanner.png');
  }
  td.dugo {
    background: url('../images/dugoBanner.png');
  }
  td.ekanesh {
    background: url('../images/ekaneshBanner.png');
  }
  td.sona {
    background: url('../images/sonaBanner.png');
  }
  td.pendzal {
    background: url('../images/pendzalBanner.png');
  }
  td.factionCell {
    background-size: auto 50%;
    background-repeat: no-repeat;
  }
</style>

<h1>Current Figurant Personas</h1>
<div class="gridLayout">
  <button class="refresh" on:click={getAllFigurants}>
    <mat-ripple color="#ccd1dd33" />
    <abbr title="Refresh">
      <Icon class="faRedo" icon={faRedo} />
    </abbr>
  </button>
  <!-- {#if ocFigurantenStoreArray}{$ocFigurantenStoreArray}{/if} -->
  {#if figurantsList}
    <Datatable {settings} data={figurantsList} bind:dataRows={rows}>
      <thead>
        <th data-key="card_id">RFID card</th>
        <th data-key="faction">Faction</th>
        <th data-key="character_name">Name</th>

        <th data-key="status">Recurring?</th>
        <th data-key="plotname">Plot</th>
        <th data-key="figu_name">Assigned</th>
        <th>Picture</th>
        <th>Actions</th>
        <th />
      </thead>
      <tbody>
        {#if rows}
          {#each $rows as row}
            <tr>
              <td>
                <PersonaTableRFIDcard {row} on:saveSucces={getAllFigurants} />

              </td>
              <td class="{row.faction} factionCell">{row.faction}</td>
              <td>{row.rank} {row.character_name}</td>

              <td align="center">
                {#if row.status === 'figurant-recurring'}
                  <input
                    type="checkbox"
                    on:click|preventDefault={updateFigurantData.bind(this, row.characterID, row.status)}
                    checked />
                {:else}
                  <input
                    type="checkbox"
                    on:click|preventDefault={updateFigurantData.bind(this, row.characterID, row.status)} />
                {/if}
                <!-- svelte-ignore a11y-label-has-associated-control | other ways to style the button have been tried, and failed -->
                <label class="styledCheckbox" />
              </td>

              <td>{row.plotname}</td>

              <td>
                {#if ocFigurantenNames}
                  <PersonaTableSelectOCFiguDropdown {row} {ocFigurantenNames} />
                {/if}
              </td>
              <td>
                {#if ocFigurantenNames}
                  <PersonaTableOCPicture {row} />
                {/if}
              </td>
              <td>
                <PersonaTableEditButton
                  on:editCharacter={openEditDialog}
                  {row} />
                <button
                  on:click|preventDefault={deleteFigurant.bind(this, row.characterID, row.character_name)}>
                  Delete
                  <mat-ripple color="#ccd1dd33" />
                </button>
              </td>
              <td />
            </tr>
          {/each}
        {/if}
      </tbody>
    </Datatable>
  {/if}
  {#if missingFiguranten}
    <p>
      This is where we would list figuranten, if we had any. (gonna make a joke
      missing poster here one day...)
    </p>
  {/if}
</div>
{#if ocFigurantenNames}
  <EditFigurantDataDialog
    bind:this={showEditDialog}
    {character_data}
    {ocFigurantenNames}
    on:saveSucces={getAllFigurants} />
{/if}
