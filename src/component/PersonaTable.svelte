<script>
  import { onMount } from 'svelte'
  import environment from '../../environment.js'
  import { Datatable, rows } from 'svelte-simple-datatables'
  import PersonaTableSelectOCFiguDropdown from './PersonaTableSelectOCFiguDropdown.svelte'
  import PersonaTableOCPicture from './PersonaTableOCPicture.svelte'

  let figurantsList
  let ocFigurantenNames
  let all_figurants
  let missingFiguranten = false
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

  onMount(() => {
    setTimeout(function () {
      getAllFigurants()
      getGroupID('monsterland')
    }, 125)
  })

  async function getGroupID(groupName) {
    await fetch(environment.orthanc + '/joomla/groups/', {
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
    await fetch(environment.orthanc + '/joomla/users/', {
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
            console.log('[deleteFigurant] figurant ' + id + ' deleted')
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
  thead th {
    width: auto;
  }
  thead th:nth-child(1) {
    width: 6ch;
  }
  thead th:nth-child(2) {
    width: 9ch;
  }
  thead th:nth-child(3) {
    width: 35ch;
  }
  thead th:nth-child(4) {
    width: 15ch;
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
  input[type='checkbox'] {
    width: 1.5rem;
    height: 1.5rem;
    position: relative;
    top: 0.25rem;
    margin-block-start: unset;
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
    font-size: 2rem;
    padding: 0rem;
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
</style>

<h1>Current Figurant Personas</h1>
<div class="gridLayout">
  <button class="refresh" on:click={getAllFigurants}>
    <mat-ripple color="#ccd1dd33" />
    🗘
  </button>
  <!-- {#if ocFigurantenStoreArray}{$ocFigurantenStoreArray}{/if} -->
  {#if figurantsList}
    <Datatable {settings} data={figurantsList}>
      <thead>
        <th data-key="characterID">ID</th>
        <th data-key="faction">Faction</th>
        <th data-key="character_name">Name</th>
        <th data-key="card_id">RFID card</th>
        <th data-key="status">Recurring?</th>
        <th data-key="figu_name">Assigned</th>
        <th>Picture</th>
        <th>Actions</th>
        <th />
      </thead>
      <tbody>
        {#each $rows as row}
          <tr>
            <td>{row.characterID}</td>
            <td>{row.faction}</td>
            <td>{row.rank} {row.character_name}</td>
            <td>
              <input type="text" bind:value={row.card_id} />
            </td>
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
            </td>
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
              <button
                on:click|preventDefault={deleteFigurant.bind(this, row.characterID, row.character_name)}>
                Delete
              </button>
            </td>
            <td />
          </tr>
        {/each}
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
