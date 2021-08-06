<script>
  import { onMount } from 'svelte'
  import environment from '../../environment.js'
  import { Datatable, rows } from 'svelte-simple-datatables'

  let figurantsList
  let all_figurants
  let missingFiguranten = false
  let figuID = {}
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
    }, 125)
  })

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
        console.log(figurantsList)
      } else {
        missingFiguranten = true
      }
    })
  }
  function deleteFigurant(value) {
    console.log(value)
  }
</script>

<style>
  .gridLayout {
    height: 100%;
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
  thead th:nth-child(7) {
    padding: 0ch;
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
              <button
                on:click|preventDefault={deleteFigurant.bind(this, row.characterID)}>
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
