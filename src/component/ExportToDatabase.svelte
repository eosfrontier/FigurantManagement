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
      day = (Math.floor(Math.random() * 28) + 1).toString()
    } else if (month == 1 || 3 || 5 || 7 || 8 || 10 || 12) {
      day = (Math.floor(Math.random() * 31) + 1).toString()
    } else {
      day = (Math.floor(Math.random() * 30) + 1).toString()
    }
    let year = 240 - age
    ic_birthday = day + '-' + month.toString() + '-' + year.toString() + 'NT'
  }
</script>

<style>
  dialog {
    width: 50vw;
    background-color: #2c3445;
    font-weight: normal;
    color: #ccd1dd;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
      0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12);
  }
  input[type='text'],
  input[type='tel'] {
    width: auto;
    background: none;
    border: 0;
    border-bottom: 2px solid #838795;
    color: #ccd1dd;
    padding: 0.3rem 0.5rem;
    transition: 0.3s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 95%;
  }
  input[type='text']:hover,
  input[type='text']:active,
  input[type='text']:focus {
    border: 0;
    color: #fff;
    border-bottom: 2px solid #507ef2;
  }
  input[type='submit'] {
    cursor: pointer;
    color: #507ef2;
    background: rgba(44, 52, 69, 0.8);
    border: 1px solid #4975e3;
    border-radius: 5px;
    padding: 0.5rem;
    transition: 0.4s;
    margin-bottom: -1rem;
    text-shadow: 1px 1px 4px rgba(38, 46, 62, 0.6);
  }
  input[type='submit']:hover,
  input[type='submit']:focus,
  input[type='submit']:active {
    background: #507ef2;
    border-color: #507ef2;
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  }
  form {
    display: grid;
    grid-template-columns: 50% 50%;
  }
  .Grid_left {
    grid-column: 1;
  }
  .Grid_right {
    grid-column: 2;
  }
  input[type='submit'] {
    cursor: pointer;
    color: #fff;
    background: #386ae8;
    border: 1px solid #4975e3;
    border-radius: 5px;
    padding: 0.5rem 1rem 0.5rem 0.75rem;
    transition: 0.4s;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 4px rgba(38, 46, 62, 0.6);
  }
  input[type='submit']:hover,
  input[type='submit']:focus,
  input[type='submit']:active {
    background: #507ef2;
    border-color: #507ef2;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  }
  input[disabled],
  input[disabled]:hover,
  input[disabled]:focus,
  input[disabled]:active {
    color: #ccd1dd;
    background: #3b414e;
    border-color: #ccd1dd;
  }
  input[type='number'] {
    padding: 0.3rem 0.5rem;
  }
  select {
    cursor: pointer;
    padding: 0.26rem;
  }
  select,
  input[type='number'] {
    width: auto;
    background: none;
    border: 0;
    border-bottom: 2px solid #838795;
    color: #838795;
    transition: 0.3s;
  }
  select:hover,
  select:active,
  select:focus,
  input[type='number']:hover,
  input[type='number']:active,
  input[type='number']:focus {
    border: 0;
    color: #ccd1dd;
    border-bottom: 2px solid #507ef2;
  }
  option {
    color: #ccd1dd;
    background: #3b414e;
  }
</style>

<dialog open>
  <form method="dialog">
    <div class="Grid_left">
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
    <div class="Grid_right">
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
      <input type="submit" value="Export" />
    </div>
  </form>
</dialog>
