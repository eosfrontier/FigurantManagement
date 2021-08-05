<script>
  import { onMount } from 'svelte'
  import FigurantCard from './FigurantCard.svelte'
  import environment from '../../environment.js'
  import { Datatable, rows } from 'svelte-simple-datatables'

  const settings = {
    sortable: true,
    pagination: true,
    rowPerPage: 50,
    columnFilter: true,
    css: false,
  }
  let figurantsList
  let all_figurants
  let missingFiguranten = false

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
</script>

<h1>Current Figurant Personas</h1>

{#if figurantsList}
  <Datatable class="datatable" {settings} data={figurantsList}>
    <thead>
      <th data-key="characterID">ID</th>
      <th data-key="faction">Faction</th>
      <th data-key="character_name">Name</th>

      <th data-key="card_id">RFID card</th>
      <th data-key="asigned_to">Asigned to:</th>
      <th>Select</th>
    </thead>
    <tbody>
      {#each $rows as row}
        <tr>
          <td>{row.characterID}</td>
          <td>{row.faction}</td>
          <td>{row.character_name}</td>
          <td>{row.card_id}</td>
          <td>{row.asigned_to}</td>
          <td>{row.ICC_number}</td>
        </tr>
      {/each}
    </tbody>
  </Datatable>
{/if}
{#if missingFiguranten}
  <div>
    <p>
      This is where we would list figuranten, if we had any. (gonna make a joke
      missing poster here one day...)
    </p>
  </div>
{/if}
