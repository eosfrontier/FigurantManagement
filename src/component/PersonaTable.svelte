<script>
  import { onMount } from 'svelte'
  import environment from '../../environment.js'
  import { Datatable, rows } from 'svelte-simple-datatables'

  let figurantsList
  let ocFigurantenNames
  let all_figurants
  let missingFiguranten = false
  const settings = {
    rowPerPage: 30,
    columnFilter: true,
    css: false,
    blocks: {
      searchInput: true,
      paginationButtons: true,
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
        console.log('something went wrong')
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
        console.log(ocFigurantenNames)
      } else {
        console.log('something went wrong')
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
            alert('Character deleted')
            getAllFigurants()
          } else {
            alert('Something went wrong')
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
  async function asignFigurant(idvar, namevar, figurantvar) {
    if (confirm('You are asigning "' + namevar + '" to ' + figurantvar + '!')) {
      await fetch(environment.orthanc + 'chars_figu/', {
        method: 'PUT',
        mode: 'cors',
        headers: {
          token: environment.token,
          id: idvar,
          figurant: JSON.stringify({ figu_accountID: figurantvar }),
          'cache-control': 'no-cache',
        },
      })
        .then(function (response) {
          if (response.status == 200 || response.status == 204) {
            alert('Character asigned')
            getAllFigurants()
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
  .gridLayout {
    height: 100%;
    width: 100%;
  }
  thead th:nth-child(1) {
    width: 6ch;
  }
  thead th:nth-child(2) {
    width: 9ch;
  }
  thead th:nth-child(4) {
    width: 17ch;
  }
  thead th:nth-child(6) {
    width: 13ch;
  }
  button {
    float: unset;
  }
  td {
    text-align: center;
  }
</style>

<h1>Current Figurant Personas</h1>
<div class="gridLayout">
  {#if figurantsList}
    <Datatable {settings} data={figurantsList}>
      <thead>
        <th data-key="characterID">ID</th>
        <th data-key="faction">Faction</th>
        <th data-key="(row) => rank + ' ' + character_name">Name</th>
        <th data-key="ICC_number">ICC ID</th>
        <th data-key="card_id">RFID card</th>
        <th data-key="status">Recurring?</th>
        <th data-key="figu_name">Assign</th>
        <th>Delete</th>
      </thead>
      <tbody>
        {#each $rows as row}
          <tr>
            <td>{row.characterID}</td>
            <td>{row.faction}</td>
            <td>{row.rank} {row.character_name}</td>
            <td>{row.ICC_number}</td>
            <td>{row.card_id}</td>
            <td align="center">
              {#if row.status === 'figurant-recurring'}✔{/if}
            </td>
            <td>
              {#if ocFigurantenNames}
                <select>
                  <option value="" />
                  {#each ocFigurantenNames as figurant}
                    {#if row.figu_accountID == figurant.id}
                      <option value={figurant.name} selected>
                        {figurant.name}
                      </option>
                    {:else}
                      <option value={figurant.name}>{figurant.name}</option>
                    {/if}
                  {/each}

                </select>
              {/if}
            </td>
            <td>
              <button
                on:click|preventDefault={deleteFigurant.bind(this, row.characterID, row.character_name)}>
                Delete
              </button>
            </td>
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
