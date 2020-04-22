<script>
  let card_id = ''
  let character_name = 'John Doe'
  let faction = 'dugo'
  let ICC_number = '1234 56789 0123'
  let threat_assessment = 0
  let bastion_clearance = 0
  let douane_disposition = 'ACCESS PENDING'
  let rank = 'Civilian Specialist'
  let age = 25
  let ic_birthday = '1-1-215NT'
  let homeplanet = 'Not Eos'
  let bloodtype = 'O'
  let recurring = false

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
  $: if (ICC_number || faction) {
    let firstNumber = 0
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
  input[type='submit'] {
    cursor: pointer;
    color: #507ef2;
    background: rgba(44, 52, 69, 0.8);
    border: 0.0625em solid #4975e3;
    border-radius: 0.3125em;
    padding: 0.5em;
    margin-block-end: -1em;
    text-shadow: 0.0625em 0.0625em 0.25em rgba(38, 46, 62, 0.6);
  }
  input[type='submit']:hover,
  input[type='submit']:focus,
  input[type='submit']:active {
    background: #507ef2;
    border-color: #507ef2;
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
  form {
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
</style>

<button on:click={() => document.querySelector('dialog').showModal()}>
  Click me
</button>
<dialog>
  <form method="dialog">
    <div class="Grid_inline-start">
      <label for="card_id">Card ID:</label>
      <input
        type="text"
        id="card_id"
        name="card_id"
        bind:value={card_id}
        placeholder="Scan your ID card"
        required />
      <label for="character_name">Character Name:</label>
      <input
        type="text"
        id="character_name"
        name="character_name"
        bind:value={character_name}
        required />
      <label for="faction">Faction:</label>
      <select id="faction" name="faction" bind:value={faction}>
        <option value="aquila">Aquila</option>
        <option value="dugo">Dugo</option>
        <option value="ekanesh">Ekanesh</option>
        <option value="pendzal">Pendzal</option>
        <option value="sona">Sona</option>
      </select>
      <label for="ICC_number">ICC Number:</label>
      <input
        type="tel"
        id="ICC_number"
        name="ICC_number"
        bind:value={ICC_number}
        pattern="[0-9]{4} [0-9]{5} [0-9]{4}"
        disabled />
      <label for="threat_assessment">
        Treat Assesment {threat_assessment}:
      </label>
      <input
        type="range"
        id="threat_assessment"
        name="threat_assessment"
        min="0"
        max="5"
        bind:value={threat_assessment} />
      <label for="bastion_clearance">
        Bastion Clearance {bastion_clearance}:
      </label>
      <input
        type="range"
        id="bastion_clearance"
        name="bastion_clearance"
        min="0"
        max="3"
        bind:value={bastion_clearance} />
      <label for="douane_disposition">Douane Disposition:</label>
      <select id="douane_disposition" name="douane_disposition">
        <option value="ACCESS PENDING">ACCESS PENDING</option>
        <option value="ACCESS GRANTED">ACCESS GRANTED</option>
        <option value="DECEASED">DECEASED</option>
        <option value="DETAIN">DETAIN</option>
        <option value="ICC VETTED">ICC VETTED</option>
      </select>

    </div>
    <div class="Grid_inline-end">
      <label for="rank">Rank / Job:</label>
      <input type="text" id="rank" name="rank" bind:value={rank} />
      <label for="ic_birthday">Age:</label>
      <input type="number" id="age" bind:value={age} />
      <label for="ic_birthday">Birthdate:</label>
      <input
        type="text"
        id="ic_birthday"
        name="ic_birthday"
        bind:value={ic_birthday}
        disabled />
      <label for="homeplanet">Current/home planet:</label>
      <select id="homeplanet" name="homeplanet" bind:value={homeplanet}>
        <!-- SEED DEPENDING ON FACTION? -->
      </select>
      <label for="bloodtype">Bloodtype:</label>
      <select id="bloodtype" name="bloodtype" bind:value={bloodtype}>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="AB">AB</option>
        <option value="O">O</option>
      </select>
      <label for="recurring">Recurring?</label>
      <input
        type="checkbox"
        id="recurring"
        name="recurring"
        bind:checked={recurring} />
      <br />
      <input id="submit" type="submit" value="Export" />
    </div>
  </form>
</dialog>
