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
</style>

<dialog open>
  <form method="dialog">
    <div class="Grid_left">
      <label for="card_id">Card ID:</label>
      <input type="text" id="card_id" name="card_id" required />
      <label for="character_name">Character Name:</label>
      <input type="text" id="character_name" name="character_name" required />
      <label for="faction">Faction:</label>
      <select id="faction" name="faction">
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
        placeholder="1234 45678 9012"
        pattern="[0-9]{4} [0-9]{5} [0-9]{4}"
        disabled />
      <label for="ic_birthday">Age:</label>
      <input
        type="number"
        id="ic_birthday"
        name="ic_birthday"
        placeholder="25" />

      <label for="homeplanet">Current/home planet:</label>
      <select id="homeplanet" name="homeplanet">
        <!-- SEED DEPENDING ON FACTION? -->
      </select>
    </div>
    <div class="Grid_right">
      <label for="bloodtype">Bloodtype:</label>
      <select id="bloodtype" name="bloodtype">
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="AB">AB</option>
        <option value="O">O</option>
      </select>
      <label for="recurring">Recurring?</label>
      <input type="checkbox" id="recurring" name="recurring" />
      <br />
      <input type="submit" value="Export" />
    </div>
  </form>
</dialog>
"faction": "faction", "rank": "rank", "threat_assessment" : "0",
"douane_disposition" : "ICC VETTED", "douane_notes" : "notes",
"bastion_clearance" : "0", "ic_birthday": "24 oct 231", "homeplanet": "Dzar",
