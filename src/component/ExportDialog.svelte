<script>
  export let character_name
  export let faction
  let card_id = ''
  let factions = ['aquila', 'dugo', 'ekanesh', 'pendzal', 'sona']
  let ICC_number
  let threat_assessment = 0
  let bastion_clearance = 0
  let douane_dispositions = [
    'ACCESS PENDING',
    'ACCESS GRANTED',
    'DECEASED',
    'DETAIN',
    'ICC VETTED',
  ]
  let douane_disposition
  let rank
  let age = Math.floor(Math.random() * (40 - 18 + 1) + 18)
  let ic_birthday
  let homeplanet
  let homeplanets = ['Eos']
  let bloodtypes = ['O', 'A', 'B', 'AB']
  let bloodtype
  let recurring = false
  let showDialog
  export const show = () => showDialog.showModal()

  $: if (ICC_number || faction) {
    let firstNumber
    switch (faction) {
      case 'aquila':
      default:
        firstNumber = '7'
        break
      case 'dugo':
        firstNumber = '3'
        break
      case 'ekanesh':
        firstNumber = '8'
        break
      case 'pendzal':
        firstNumber = '9'
        break
      case 'sona':
        firstNumber = '5'
        break
    }
    ICC_number =
      firstNumber +
      'ddd ddddd dddd'.replace(/d/g, d => Math.floor(Math.random() * 10))
  }

  $: if (age) {
    let day = 0
    let month = Math.floor(Math.random() * 12) + 1
    if (month == 2) {
      day = Math.floor(Math.random() * 28) + 1
    } else if (month == 1 || 3 || 5 || 7 || 8 || 10 || 12) {
      day = Math.floor(Math.random() * 31) + 1
    } else {
      day = Math.floor(Math.random() * 30) + 1
    }
    let year = 240 - age
    ic_birthday =
      day.toString() + '-' + month.toString() + '-' + year.toString() + 'NT'
  }
  $: onNameChange(character_name)
  function onNameChange() {
    let bloodChance
    switch (faction) {
      case 'aquila':
      default:
        bloodChance = [45, 40, 11, 4]
        homeplanets = [
          'Accipiter',
          'Alcyon',
          'Alietum',
          'Ferox II',
          'Merula',
          'Noctua',
          'Sturnus',
          'Viridis',
          'Fastus',
          'Ignis',
          'Ithaginis',
          'Tigris',
        ]
        break
      case 'dugo':
        bloodChance = [30, 38, 22, 10]
        homeplanets = [
          'Kaito',
          'Batongbayal',
          'Cabatu',
          'Hideyoshi',
          'Hiroto',
          'Katsuro',
          'Minoru',
          'Shinobu',
          'Tarou',
          'Haruka',
          'Noburu',
        ]
        break
      case 'ekanesh':
        bloodChance = [51, 34, 12, 3]
        homeplanets = ['Dzar']
        break
      case 'pendzal':
        bloodChance = [33, 36, 23, 8]
        homeplanets = [
          'Dodamu',
          'Zvir',
          'Ziamlia',
          'Zorki',
          'Vady',
          'Cionma',
          'Vtotoroy',
          'Nadz',
          'Ruda',
          'Zyccio',
        ]
        break
      case 'sona':
        bloodChance = [34, 31, 29, 6]
        homeplanets = ['Andhera', 'Ghara', 'Prakhasa']
        break
    }
    let sum = bloodChance.reduce((acc, el) => acc + el, 0)
    let acc = 0
    bloodChance = bloodChance.map(el => (acc = el + acc))
    let rand = Math.random() * sum
    bloodtype = bloodtypes[bloodChance.filter(el => el <= rand).length]
    homeplanet = homeplanets[Math.floor(Math.random() * homeplanets.length)]
  }

  function makeid(length) {
    let result = ''
    let characters = '0123456789'
    let charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      if (i == 3 || i == 9) {
        result += ' '
      } else {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength),
        )
      }
    }
    return result
  }
</script>

<style>
  dialog {
    border: none;
    inline-size: clamp(45.5em, 50vw, 48em);
    background-color: #2c3445;
    font-weight: normal;
    padding: 0;
    color: #ccd1dd;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 0.6875em 0.9375em -0.4375em rgba(0, 0, 0, 0.2),
      0 1.5em 2.375em 0.1875em rgba(0, 0, 0, 0.14),
      0 0.5625em 2.875em 0.5em rgba(0, 0, 0, 0.12);
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 76em) {
    dialog {
      inline-size: clamp(42em, 60vw, 45.5em);
    }
  }
  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    dialog {
      inline-size: 90vw;
    }
  }
  /* tiny screens / horizontal mode */
  @media screen and (max-height: 27em) {
    dialog {
      zoom: 0.75;
    }
  }
  dialog::backdrop {
    background-color: rgba(29, 32, 40, 0.6);
  }
  input {
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  input[type='text'],
  input[type='tel'],
  input[type='number'] {
    inline-size: auto;
    background: none;
    border: 0;
    border-block-end: 0.125em solid #838795;
    color: #ccd1dd;
    padding: 0.3em 0.5em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    inline-size: 100%;
  }
  input[type='text']:hover,
  input[type='text']:active,
  input[type='text']:focus,
  input[type='number']:hover,
  input[type='number']:active,
  input[type='number']:focus {
    border: 0;
    color: #fff;
    border-block-end: 0.125em solid #507ef2;
  }
  input[type='checkbox'] {
    opacity: 0;
    margin-block-start: 0.25em;
    zoom: 2;
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

    border: 0.0625em solid #4975e3;
    border-radius: 0.3125em;
  }
  label.styledCheckbox::after {
    height: 1rem;
    width: 1.5rem;
    color: #507ef2;
    font-size: 2em;
    top: -0.45em;
    left: 0.1em;
    text-shadow: 0 0.0625em 0.1875em rgba(0, 0, 0, 0.12),
      0 0.0625em 0.125em rgba(0, 0, 0, 0.24);
  }
  input[type='checkbox'] + label::after {
    content: none;
  }
  input[type='checkbox']:checked + label::after {
    content: '✓';
  }
  input[type='checkbox']:hover + label::after,
  input[type='checkbox']:active + label::after {
    color: #ccd1dd;
  }
  input[type='checkbox']:hover + label::before,
  input[type='checkbox']:active + label::before {
    background: #507ef2;
    box-shadow: 0 0.0625em 0.1875em rgba(0, 0, 0, 0.12),
      0 0.0625em 0.125em rgba(0, 0, 0, 0.24);
  }
  button.submit {
    cursor: pointer;
    float: right;
    margin-inline-end: 1em;
    margin-block-start: -1em;
    color: #31e184;
    background: rgba(44, 52, 69, 0.8);
    border: 0.0625em solid #31e184;
    border-radius: 0.3125em;
    padding: 0.5em;
    text-shadow: 0.0625em 0.0625em 0.25em rgba(38, 46, 62, 0.6);
  }
  button.submit:hover,
  button.submit:focus,
  button.submit:active {
    background: #31e184;
    border-color: #31e184;
    color: #fff;
    box-shadow: 0 0.0625em 0.1875em rgba(0, 0, 0, 0.12),
      0 0.0625em 0.125em rgba(0, 0, 0, 0.24);
  }
  input[disabled],
  input[disabled]:hover,
  input[disabled]:focus,
  input[disabled]:active {
    color: #838795;
    border-color: #838795;
  }
  div.form {
    display: grid;
    grid-template-columns: 50% 50%;
  }
  .Grid_inline-start {
    grid-column: 1;
    margin: 5%;
  }
  .Grid_inline-end {
    grid-column: 2;
    margin: 5%;
  }
  select {
    cursor: pointer;
    padding: 0.26em;
    width: auto;
    background: none;
    border: 0;
    border-block-end: 0.125em solid #838795;
    color: #838795;
  }
  select:hover,
  select:active,
  select:focus {
    border: 0;
    color: #ccd1dd;
    border-block-end: 0.125em solid #507ef2;
  }
  option {
    color: #ccd1dd;
    background: #3b414e;
  }
  input[type='range'] {
    margin-inline-start: 0.25em;
    block-size: 2em;
    border: 0;
    -webkit-appearance: none;
    color: transparent;
  }
  input[type='range']::-webkit-slider-thumb {
    block-size: 2em;
    inline-size: 1px;
    -webkit-appearance: none;
    background: transparent;
  }
  input[type='range']:focus {
    outline: 0;
  }
  progress {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    pointer-events: none;
    block-size: 2em;
  }
  progress::-webkit-progress-bar {
    background-color: transparent;
  }
  input[type='range'].threat {
    inline-size: 8em;
    background-image: radial-gradient(
        circle at 0.25em,
        transparent 0.15em,
        #838795 0.25em,
        transparent 0
      ),
      radial-gradient(circle at 1.5em, #838795, #838795 0.5em, transparent 0),
      radial-gradient(circle at 3em, #838795, #838795 0.5em, transparent 0),
      radial-gradient(circle at 4.5em, #838795, #838795 0.5em, transparent 0),
      radial-gradient(circle at 6em, #838795, #838795 0.5em, transparent 0),
      radial-gradient(circle at 7.5em, #838795, #838795 0.5em, #2c3445 0);
  }

  progress.threat {
    margin-inline-start: -7em;
    inline-size: 7em;
  }

  progress.threat[value]::-webkit-progress-value {
    background-image: radial-gradient(
        circle at 0.5em,
        #f2507e,
        #f2507e 0.5em,
        transparent 0
      ),
      radial-gradient(circle at 2em, #f2507e, #f2507e 0.5em, transparent 0),
      radial-gradient(circle at 3.5em, #f2507e, #f2507e 0.5em, transparent 0),
      radial-gradient(circle at 5em, #f2507e, #f2507e 0.5em, transparent 0),
      radial-gradient(circle at 6.5em, #f2507e, #f2507e 0.5em, #2c3445 0);
  }
  input[type='range'].clearance {
    inline-size: 5em;
    background-image: radial-gradient(
        circle at 0.25em,
        transparent 0.15em,
        #838795 0.25em,
        transparent 0
      ),
      radial-gradient(circle at 1.5em, #838795, #838795 0.5em, transparent 0),
      radial-gradient(circle at 3em, #838795, #838795 0.5em, transparent 0),
      radial-gradient(circle at 4.5em, #838795, #838795 0.5em, #2c3445 0);
  }

  progress.clearance {
    margin-inline-start: -4em;
    inline-size: 4em;
  }

  progress.clearance[value]::-webkit-progress-value {
    background-image: radial-gradient(
        circle at 0.5em,
        #f2c450,
        #f2c450 0.5em,
        transparent 0
      ),
      radial-gradient(circle at 2em, #f2c450, #f2c450 0.5em, transparent 0),
      radial-gradient(circle at 3.5em, #f2c450, #f2c450 0.5em, #2c3445 0);
  }
</style>

<dialog bind:this={showDialog}>
  <div class="form">
    <div class="Grid_inline-start">
      <label>
        Card ID:
        <br />
        <input
          type="text"
          bind:value={card_id}
          placeholder="Scan your ID card"
          required />
      </label>
      <label>
        Character Name:
        <br />
        <input type="text" bind:value={character_name} required />
      </label>
      <label>
        Faction:
        <br />
        <select bind:value={faction}>
          {#each factions as faction}
            <option value={faction}>{faction}</option>
          {/each}
        </select>
      </label>
      <label>
        ICC Number:
        <br />
        <input
          type="tel"
          bind:value={ICC_number}
          pattern="[0-9]{4} [0-9]{5} [0-9]{4}"
          disabled />
      </label>
      <label>
        Treat Assesment {threat_assessment}:
        <br />
        <input
          class="threat"
          type="range"
          min="0"
          max="5"
          bind:value={threat_assessment} />
        <progress class="threat" value={threat_assessment} max="5" />
      </label>

      <label>
        Bastion Clearance {bastion_clearance}:
        <br />
        <input
          class="clearance"
          type="range"
          name="bastion_clearance"
          min="0"
          max="3"
          bind:value={bastion_clearance} />
        <progress class="clearance" value={bastion_clearance} max="3" />
      </label>
      <label>
        Douane Disposition:
        <br />
        <select bind:value={douane_disposition}>
          {#each douane_dispositions as douane_disposition}
            <option value={douane_disposition}>{douane_disposition}</option>
          {/each}
        </select>
      </label>
    </div>
    <div class="Grid_inline-end">
      <label>
        Rank / Job:
        <input
          type="text"
          placeholder="Your military rank or job title"
          bind:value={rank} />
      </label>
      <label>
        Age:
        <input type="number" bind:value={age} />
      </label>
      <label>
        Birthdate:
        <input type="text" bind:value={ic_birthday} disabled />
      </label>
      <label>
        Current/home planet:
        <br />
        <select bind:value={homeplanet}>
          {#each homeplanets as homeplanet}
            <option value={homeplanet}>{homeplanet}</option>
          {/each}
        </select>
      </label>
      <label>
        Bloodtype:
        <br />
        <select bind:value={bloodtype}>
          {#each bloodtypes as bloodtype}
            <option value={bloodtype}>{bloodtype}</option>
          {/each}
        </select>
      </label>
      <label>
        Recurring?
        <br />
        <input type="checkbox" bind:checked={recurring} />
        <label class="styledCheckbox" />
      </label>
      <br />
      <button class="submit">Save Character to Database</button>
    </div>
  </div>
</dialog>
