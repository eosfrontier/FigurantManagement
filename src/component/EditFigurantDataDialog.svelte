<script>
  import Icon from 'fa-svelte'

  import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle'
  import { faWindowClose } from '@fortawesome/free-solid-svg-icons/faWindowClose'
  import { faIdCard } from '@fortawesome/free-solid-svg-icons/faIdCard'
  import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
  import { faUsers } from '@fortawesome/free-solid-svg-icons/faUsers'
  import { faKey } from '@fortawesome/free-solid-svg-icons/faKey'
  import { faUserLock } from '@fortawesome/free-solid-svg-icons/faUserLock'
  import { faUserShield } from '@fortawesome/free-solid-svg-icons/faUserShield'
  import { faFireAlt } from '@fortawesome/free-solid-svg-icons/faFireAlt'
  import { faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons/faAngleDoubleUp'
  import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap'
  import { faBirthdayCake } from '@fortawesome/free-solid-svg-icons/faBirthdayCake'
  import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons/faCalendarAlt'
  import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe'
  import { faNotesMedical } from '@fortawesome/free-solid-svg-icons/faNotesMedical'
  import { faRedo } from '@fortawesome/free-solid-svg-icons/faRedo'
  import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft'
  import { faShieldAlt } from '@fortawesome/free-solid-svg-icons/faShieldAlt'
  import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons/faExclamationTriangle'
  import { faBomb } from '@fortawesome/free-solid-svg-icons/faBomb'
  import { faBiohazard } from '@fortawesome/free-solid-svg-icons/faBiohazard'
  import { faSkullCrossbones } from '@fortawesome/free-solid-svg-icons/faSkullCrossbones'
  import { faTag } from '@fortawesome/free-solid-svg-icons/faTag'
  import { faUserTag } from '@fortawesome/free-solid-svg-icons/faUserTag'
  import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons/faCloudUploadAlt'

  import { onMount } from 'svelte'
  import { allFactionsStoreArray } from './SvelteStore.js'
  import { createEventDispatcher } from 'svelte'
  import environment from '../../environment.js'
  import config from '../../config.js'

  export let character_data
  export let ocFigurantenNames
  let showEditDialog
  export const show = () => showEditDialog.showModal()
  const dispatch = createEventDispatcher()

  let currentICYear
  let card_id = ''
  let character_name = ''
  let factions = config.Factions
  let faction = ''
  let icc_number = ''
  let threat_assessment = ''
  let bastion_clearance = ''
  let douane_dispositions = [
    'ICC VETTED',
    'ACCESS GRANTED',
    'ACCESS PENDING',
    'DETAIN',
    'DECEASED',
  ]
  let douane_disposition = ''
  let rank = ''
  let age = ''
  let ic_birthday = ''
  let homeplanet = ''
  let bloodtypes = ['O', 'A', 'B', 'AB']
  let bloodtype = ''
  let recurring = false
  let figu_accountID = ''
  let plotname = ''

  let cachedAge

  onMount(() => {
    setTimeout(function () {
      getCurrentICYear()
    }, 125)
  })

  function saveSucces() {
    dispatch('saveSucces')
  }

  async function getCurrentICYear() {
    fetch(environment.watchtower + 'time')
      .then((response) => response.json())
      .then((data) => (currentICYear = data.iYear))
      // when watchtower is offline, hardcoded fallback to 240NT
      .catch((error) => {
        currentICYear = 240
      })
  }

  function closeEditDialog() {
    showEditDialog.close()
  }

  $: if (character_data) {
    fillCharacterDialog(character_data)
  }

  function fillCharacterDialog(fill) {
    card_id = fill.card_id
    character_name = fill.character_name
    rank = fill.rank
    faction = fill.faction
    icc_number = fill.ICC_number
    threat_assessment = fill.threat_assessment
    bastion_clearance = fill.bastion_clearance
    douane_disposition = fill.douane_disposition
    ic_birthday = fill.ic_birthday
    homeplanet = fill.homeplanet
    bloodtype = fill.bloodtype
    figu_accountID = fill.figu_accountID
    plotname = fill.plotname
    // This regular Expression looks for the exact same amount of digits as are in currentICYear
    // (?<!\\d) at start and (?!\\d) at end are to limit the search so that numbers with more digits aren't used
    // \\d means digit and the { } represent the amount of consecutive digits as set by .length
    let regEx = new RegExp(
      '(?<!\\d)\\d{' + currentICYear.toString().length + '}(?!\\d)',
    )
    let icBirthYear = fill.ic_birthday.match(regEx)[0]
    age = currentICYear - icBirthYear
    if (fill.status == 'figurant-recurring') {
      recurring = true
    } else {
      recurring = false
    }
  }
  $: if (age) {
    if (age != cachedAge) {
      let icBirthYear = currentICYear - age
      let regEx = new RegExp(
        '(?<!\\d)\\d{' + currentICYear.toString().length + '}(?!\\d)',
      )
      ic_birthday = ic_birthday.replace(regEx, icBirthYear)
      cachedAge = age
    }
  }

  async function saveAndClose() {
    let serverResponse
    let figurantData = { figurant: {} }
    // send only the altered data
    if (card_id != character_data.card_id) {
      figurantData.figurant.card_id = card_id
    }
    if (character_name != character_data.character_name) {
      figurantData.figurant.character_name = character_name
    }
    if (faction != character_data.faction) {
      figurantData.figurant.faction = faction
    }
    if (rank != character_data.rank) {
      figurantData.figurant.rank = rank
    }
    if (threat_assessment != character_data.threat_assessment) {
      figurantData.figurant.threat_assessment = threat_assessment
    }
    if (douane_disposition != character_data.douane_disposition) {
      figurantData.figurant.douane_disposition = douane_disposition
    }
    if (bastion_clearance != character_data.bastion_clearance) {
      figurantData.figurant.bastion_clearance = bastion_clearance
    }
    if (bloodtype != character_data.bloodtype) {
      figurantData.figurant.bloodtype = bloodtype
    }
    if (ic_birthday != character_data.ic_birthday) {
      figurantData.figurant.ic_birthday = ic_birthday
    }
    if (homeplanet != character_data.homeplanet) {
      figurantData.figurant.homeplanet = homeplanet
    }
    if (figu_accountID != character_data.figu_accountID) {
      figurantData.figurant.figu_accountID = figu_accountID
    }
    if (plotname != character_data.plotname) {
      figurantData.figurant.plotname = plotname
    }
    let charData_recurring
    if (character_data.status == 'figurant-recurring') {
      charData_recurring = true
    } else {
      charData_recurring = false
    }
    if (recurring != charData_recurring) {
      figurantData.figurant.recurring = recurring
    }
    await fetch(environment.orthanc + 'chars_figu/', {
      method: 'PUT',
      mode: 'cors',
      headers: {
        token: environment.token,
        'cache-control': 'no-cache',
        id: character_data.characterID,
        figurant: JSON.stringify(figurantData.figurant),
      },
    })
      .then(async function (response) {
        if (response.status == 200) {
          let serverResponse = await response.json()
          if (serverResponse) {
            closeEditDialog()
            saveSucces()
          }
        } else {
          // this shows the API error message instead of my own error message
          let warning = await response.json()
          alert(warning)
        }
      })
      .catch((error) => {
        alert(
          'OOPS!\nSomething went horribly wrong, try again in a moment.\n\nIf this keeps happening get IT support.\nPUT' +
            error,
        )
      })
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
    box-shadow: var(--materialElevation16boxShadow);
    contain: paint;
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
  input:not([type='range']) {
    margin-block-start: 0.5em;
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
  .cancel {
    color: #ccd1dd;
    border: 0.0625em solid #ccd1dd;
    background: none;
  }
  .cancel:hover,
  .cancel:active {
    background: #424959;
    border: 0.0625em solid #ccd1dd;
  }
  .submit {
    --buttonColor: #31e184;
    --buttonAccent: #31e184;
    --buttonText: #28292c;
  }

  input[disabled],
  input[disabled]:hover,
  input[disabled]:active {
    color: #838795;
    border-color: #838795;
  }
  div.form,
  .buttonWrapper {
    display: grid;
    grid-template-columns: 50% 50%;
  }
  .buttonWrapper {
    margin-block-start: -1em;
  }
  .Grid_inline-start {
    grid-column: 1;
    margin: 5%;
  }
  .Grid_inline-end {
    grid-column: 2;
    margin: 5%;
  }
  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    div.form {
      display: grid;
      grid-template-columns: 100%;
    }
    .Grid_inline-start {
      grid-column: 1;
      margin: 1% 5% 5%;
    }
    .Grid_inline-end {
      grid-column: 1;
      margin: 1% 5% 5%;
    }
  }
  select {
    cursor: pointer;
    padding: 0.26em;
    width: auto;
    background: none;
    border: 0;
    border-block-end: 0.125em solid #838795;
    color: #ccd1dd;
  }
  select:hover,
  select:active {
    border: 0;
    color: #ccd1dd;
    border-block-end: 0.125em solid #386ae8;
  }
  optgroup,
  option {
    color: #ccd1dd;
    background: #3b414e;
  }
  optgroup {
    text-transform: capitalize;
  }
  input[type='range'] {
    height: 0;
    margin-inline-start: 0.25em;
    block-size: 2em;
    background: #2c3445;
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
  .factionSelect select,
  select option {
    text-transform: capitalize;
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
      radial-gradient(
        circle at 1.5em,
        #838795 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 3em,
        #838795 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 4.5em,
        #838795 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 6em,
        #838795 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 7.5em,
        #838795 0.48em,
        transparent 0.51em,
        #2c3445 0
      );
  }

  progress.threat {
    margin-inline-start: -7em;
    inline-size: 7em;
  }

  progress.threat[value]::-webkit-progress-value {
    background-image: radial-gradient(
        circle at 0.5em,
        #f2507e 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 2em,
        #f2507e 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 3.5em,
        #f2507e 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 5em,
        #f2507e 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 6.5em,
        #f2507e 0.48em,
        transparent 0.51em,
        #2c3445 0
      );
  }
  input[type='range'].clearance {
    inline-size: 5em;
    background-image: radial-gradient(
        circle at 0.25em,
        transparent 0.15em,
        #838795 0.25em,
        transparent 0
      ),
      radial-gradient(
        circle at 1.5em,
        #838795 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 3em,
        #838795 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 4.5em,
        #838795 0.48em,
        transparent 0.51em,
        #2c3445 0
      );
  }

  progress.clearance {
    margin-inline-start: -4em;
    inline-size: 4em;
  }

  progress.clearance[value]::-webkit-progress-value {
    background-image: radial-gradient(
        circle at 0.5em,
        #f2c450 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 2em,
        #f2c450 0.48em,
        transparent 0.51em,
        transparent 0
      ),
      radial-gradient(
        circle at 3.5em,
        #f2c450 0.48em,
        transparent 0.51em,
        #2c3445 0
      );
  }
  .CloseX,
  .CloseX:hover,
  .CloseX:active {
    position: absolute;
    top: 0px;
    right: 0px;
    block-size: 2em;
    inline-size: 2em;
    background: rgba(0, 0, 0, 0);
    color: #838795;
    border: none;
    padding: 0;
    margin: 0;
    box-shadow: unset;
  }
  :global(.faIcon) {
    font-size: 0.7em;
    transform: scale(1.6);
    margin: 0 0.25em;
  }

  /* Tooltip container */
.tooltip {
  position: absolute;
  display: inline-block;
  cursor: help;
  left:16em;
  padding: 0.5em 0.5em 0.5em 6em;
  margin: -0.5em -0.5em -0.5em -6em;
}

/* Tooltip text */
.tooltip .tooltiptext {
  visibility: hidden;
  width: 20.6em;
  background: #424959;
  border-radius: 5px;
  box-shadow: 0 7px 8px -4px rgb(0 0 0 / 20%), 0 12px 17px 2px rgb(0 0 0 / 14%), 0 5px 22px 4px rgb(0 0 0 / 12%);
  padding: 1rem 0.75rem;
  margin: 0.25rem 0 0.75rem 0;
  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
  bottom: 2em;
  right: -5.7em;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
}

</style>

<dialog bind:this={showEditDialog}>
  <button class="CloseX" on:click={closeEditDialog}>
    <Icon class="faIcon" icon={faWindowClose} />
    <mat-ripple
      color="#28292c55"
      centered="true"
      unbounded="true"
      radius="15" />
  </button>
  <div class="form">
    <div class="Grid_inline-start">
      <label>
        <Icon class="faIcon" icon={faIdCard} />
        Card ID:
        <br />
        <!-- svelte-ignore a11y-autofocus | The autofocus has been requested, and is purposfully being used to create better flow. -->
        <input
          type="text"
          bind:value={card_id}
          placeholder="Scan your ID card"
          autocomplete="one-time-code"
          required
          autofocus="autofocus"
          onfocus="this.select()" />
      </label>
      <label>
        <Icon class="faIcon" icon={faUser} />
        Character Name:
        <br />
        <input type="text" bind:value={character_name} required />
      </label>
      <label>
        <Icon class="faIcon" icon={faAngleDoubleUp} />
        Rank /
        <Icon class="faIcon" icon={faGraduationCap} />
        Job:
        <input
          type="text"
          placeholder="Your military rank or job title"
          bind:value={rank} />
      </label>
      <label class="factionSelect">
        <Icon class="faIcon" icon={faUsers} />
        Faction:
        <br />
        <select bind:value={faction}>
          {#each factions as faction}
            <option value={faction}>{faction}</option>
          {/each}
        </select>
      </label>
      <label>
        <Icon class="faIcon" icon={faKey} />
        ICC Number:
        <br />
        <input
          type="tel"
          bind:value={icc_number}
          pattern="[0-9]{4} [0-9]{5} [0-9]{4}"
          disabled />
      </label>
      <label>
        {#if threat_assessment == 0}
          <Icon class="faIcon" icon={faShieldAlt} />
        {:else if threat_assessment == 1}
          <Icon class="faIcon" icon={faExclamationTriangle} />
        {:else if threat_assessment == 2}
          <Icon class="faIcon" icon={faFireAlt} />
        {:else if threat_assessment == 3}
          <Icon class="faIcon" icon={faBomb} />
        {:else if threat_assessment == 4}
          <Icon class="faIcon" icon={faBiohazard} />
        {:else if threat_assessment == 5}
          <Icon class="faIcon" icon={faSkullCrossbones} />
        {/if}
        Threat Assesment:
        {#if threat_assessment == 0}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">No threat if permanent or temporarily hostile.</span>
          </span>
          none
        {:else if threat_assessment == 1}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">Negligible threat if permanent or temporarily hostile. It is expected that these are handled appropriately without undue stress for the 'combatants' and without expenditure of ammunition.<br/><br/>Unarmed mobs, distraught citizens or lone panicked herbivores all fit within the purview of this category.</span>
          </span>
          minimum
        {:else if threat_assessment == 2}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">Minimal threat if permanent or temporarily hostile. Minimal level threats can be handled with a minimum risk of injury but do require vigilance.<br/><br/>Armed colonists, Mentally Unstable Persons (allied, friendly or otherwise) and 'irregular troops' (militia) fall under this category.</span>
          </span>
          minor
        {:else if threat_assessment == 3}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">Manageable threat if permanent or temporarily hostile, can cause significant reputation or political damage to colonial efforts. It is possible to take out enemies of this caliber with proper application of force and without undue expenditure of resources.<br/><br/>Apex-predators, medium infantry, politicians and light vehicles fall under this threat level.</span>
          </span>
          moderate
        {:else if threat_assessment == 4}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">Grave threat if permanent or temporarily hostile, can cause severe reputation or political damage to colonial efforts. These threats may be easier to defeat with expert assistance but if that is not available proper application of necessary force renders most Maximus-level threats 'managable'.<br/><br/>Heavy infantry, ordnance experts, a scout maniple of armor and gunships are the most common examples.</span>
          </span>
          maximum
        {:else if threat_assessment == 5}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">Extreme threat if permanent or temporarily hostile, can cause critical reputation or political damage to colonial efforts. Enemies that are beyond the ability of a full team unit to defeat or require specialist support (varying from Ekanesh Guardians to precision orbital strikes) fall in the Extremis category.<br/><br/>Super-Heavy vehicles, colonial governors, special forces, armor battalions and deadly threats of psycho-active nature fall within the purview of this category.</span>
          </span>
          extreme
        {/if}
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
        <Icon class="faIcon" icon={faUserLock} />
        Bastion Clearance:
        {#if bastion_clearance == 0}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">0 pips: Anybody that is only a guest or visitor on the bastion. Such as civilians, tourists, journalists, missionaries, etc.</span>
          </span>
        {:else if bastion_clearance == 1}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">1 pip: General access for ICC Personnel. Such as soldiers, scouts, military journalists, or anyone that is under ICC payroll. </span>
          </span>
        {:else if bastion_clearance == 2}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">2 pips: Moderate access. Reserved for high ranking military, sherif,  second in commands, those with “need to know”, or other more important folk from the ICC.</span>
          </span>
        {:else if bastion_clearance == 3}
          <span class="tooltip">
            <Icon class="faIcon" icon={faInfoCircle} />
            <span class="tooltiptext">3 pips: Maximum access. Reserved for Governor, conclave and Pan factional commander, also available for the people who make the big choices at the ICC.</span>
          </span>
        {/if}
        
        {bastion_clearance}
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
        <Icon class="faIcon" icon={faUserShield} />
        Douane Disposition:
        <span class="tooltip">
          <Icon class="faIcon" icon={faInfoCircle} />
          <span class="tooltiptext"> • ICC Vetted is for diplomats or other higher placed ICC employees & can take anything with them through customs<br/>
            • Access Granted is for anyone that has requested access to Eos & has been allowed to go there.<br/>
            • Access Pending is for anyone that has requested access to Eos, but they haven't been allowed yet. Use this if you want to give Customs something to do.<br/>
            • Detain is for any known criminal or other person that should be apprehended when found.<br/>
            • Deceased is for known dead people. Use this for ID cards for corpses.<br/>
            • AWOL means absent without official leave.<br/>
            • MIA means missing in action.
          </span>
        </span>
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
        <Icon class="faIcon" icon={faBirthdayCake} />
        Age:
        <input type="number" bind:value={age} />
      </label>
      <label>
        <Icon class="faIcon" icon={faCalendarAlt} />
        Birthdate:
        <input type="text" bind:value={ic_birthday} />
      </label>
      <label>
        <Icon class="faIcon" icon={faGlobe} />
        Current / home planet:
        <br />
        <select bind:value={homeplanet}>
          {#if $allFactionsStoreArray}
            {#each config.Factions as faction}
              <optgroup label={faction}>
                {#each $allFactionsStoreArray[0][faction].homePlanets as planet}
                  <option value={planet}>{planet}</option>
                {/each}
              </optgroup>
            {/each}
          {/if}
        </select>
      </label>
      <label>
        <Icon class="faIcon" icon={faNotesMedical} />
        Bloodtype:
        <br />
        <select bind:value={bloodtype}>
          {#each bloodtypes as bloodtype}
            <option value={bloodtype}>{bloodtype}</option>
          {/each}
        </select>
      </label>
      <label>
        <Icon class="faIcon" icon={faRedo} />
        Recurring?
        <br />
        <input type="checkbox" bind:checked={recurring} />

        <!-- svelte-ignore a11y-label-has-associated-control | other ways to style the button have been tried, and failed -->
        <label class="styledCheckbox" />

      </label>
      <label>
        <Icon class="faIcon" icon={faUserTag} />
        Assigned Figurant:
        <br />
        <select bind:value={figu_accountID} required>
          <option value="null" />
          {#if ocFigurantenNames}
            {#each ocFigurantenNames as figurant}
              <option value={figurant.id}>{figurant.name}</option>
            {/each}
          {/if}
        </select>
      </label>
      <label>
        <Icon class="faIcon" icon={faTag} />
        Assigned plot:
        <input
          type="text"
          bind:value={plotname}
          required
          placeholder="Plot nr & name"
          maxlength="32" />
      </label>
      <br />
      <div class="buttonWrapper">
        <button class="cancel" on:click={closeEditDialog}>
          <Icon class="faIcon" icon={faArrowLeft} />
          Back
          <mat-ripple color="#ccd1dd33" />
        </button>
        <button class="submit" on:click={saveAndClose}>
          <Icon class="faIcon" icon={faCloudUploadAlt} />
          Save & Close
          <mat-ripple color="#28292c33" />
        </button>
      </div>
    </div>
  </div>
</dialog>
