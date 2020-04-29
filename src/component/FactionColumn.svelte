<script>
  import Namecard from './Namecard.svelte'
  let generatedResults = [
    {
      faction: 'aquila',
      names: [
        'Mirabilis Helladius',
        'Arcanania Varisidius',
        'Rosalba Vice',
        'Benedictus Crescere',
        'Callula Varius',
        'Brutus Maximus',
      ],
    },
    {
      faction: 'dugo',
      names: [
        'Pacquiao Olan Tambuatco',
        'Catubo Dagala Linganyan',
        'Igcasan Abucay Syjuco',
        'Mañalac Maglikian Makadaan',
        'Binsol Adona Limuaco',
        'Tasha Damalao Subal',
      ],
    },
    {
      faction: 'ekanesh',
      names: [
        'Marsilla Bheathain',
        'Arva Vita',
        'Roanna Sennius',
        'Amyas Bellatrix',
        'Electa Gavius',
        'Natali Folachd',
      ],
    },
    {
      faction: 'pendzal',
      names: [
        'Anisiia Pavelescu',
        'Elmira Tereshchenko',
        'Martin Gheorghe',
        'Aisma Lucaci Liudzi',
        'Dzintra Alyakhnovich',
        'Natasha Ispravliat',
      ],
    },
    {
      faction: 'sona',
      names: [
        'Salah ud-Din Abbad',
        'Mifsud Koury',
        'Rahmi Nassif',
        'Shalhoub Habiba',
        'Ghiyath Alim',
        'Sasha bint Zevn',
      ],
    },
  ]
</script>

<style>
  .gridContainment {
    display: flex;
    place-content: start center;
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 76em) {
    .gridContainment {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
    }
    section {
      grid-column-end: span 2;
    }
    section.padding {
      grid-column-end: span 1;
      display: none;
    }
    section:nth-child(6),
    section:nth-child(10) {
      display: block;
    }
  }
  @media screen and (max-width: 61.5em) {
    .gridContainment {
      grid-template-columns: repeat(4, 1fr);
    }
    section:nth-child(4),
    section:nth-child(6) {
      display: block;
    }
    section:nth-child(10) {
      display: none;
    }
  }
  @media screen and (max-width: 47em) {
    .gridContainment {
      grid-template-rows: repeat(5, 1fr);
    }
    section {
      grid-column-end: span 4;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    section:nth-child(4),
    section:nth-child(6) {
      display: none;
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 35em) {
    .gridContainment {
      grid-template-columns: repeat(2, 1fr);
    }
    section {
      grid-column-end: span 2;
      display: unset;
      grid-template-columns: unset;
    }
  }
</style>

<div class="gridContainment">
  {#each generatedResults as group}
    <section>
      {#each group.names as character_name}
        <Namecard {character_name} faction={group.faction} />
      {/each}
    </section>
    <section class="padding" />
  {/each}
</div>
