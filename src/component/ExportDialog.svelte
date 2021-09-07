<script>
  import MatRipple from 'mat-ripple'
  import Icon from 'fa-svelte'

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

  import ExportButton from './ExportButton.svelte'
  import environment from '../../environment.js'
  import config from '../../config.js'
  import { onMount } from 'svelte'
  import { allFactionsStoreArray } from './SvelteStore.js'
  import { generateICCIDNumber } from './GenerateICCID.svelte'

  export let character_name
  export let faction

  let currentYear
  let card_id = ''
  let factions = config.Factions
  let icc_number
  let threat_assessment = 0
  let bastion_clearance = 0
  let douane_dispositions = [
    'ICC VETTED',
    'ACCESS GRANTED',
    'ACCESS PENDING',
    'DETAIN',
    'DECEASED',
  ]
  let douane_disposition = 'ACCESS GRANTED'
  let rank
  let age = Math.floor(Math.random() * (40 - 18 + 1) + 18)
  let ic_birthday
  let homeplanet
  let homeplanets
  let bloodtypes = ['O', 'A', 'B', 'AB']
  let bloodtype
  let recurring = false
  let figu_accountID
  let plotname
  let showDialog
  let ocFigurantenNames
  export const show = () => showDialog.showModal()

  onMount(() => {
    setTimeout(function () {
      getGroupID('monsterland'), getCurrentICYear()
    }, 125)
  })

  async function getCurrentICYear() {
    fetch(environment.watchtower + 'time')
      .then((response) => response.json())
      .then((data) => (currentYear = data.iYear))
  }

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
    let year = currentYear - age
    ic_birthday =
      day.toString() + '-' + month.toString() + '-' + year.toString() + 'NT'
  }

  $: onFactionChange(faction)
  async function onFactionChange() {
    // for reasons beyond me, this fails but then still succeeds. It throws an error, but still completes.
    let bloodChance
    if ($allFactionsStoreArray[0][faction] == null) {
      bloodChance = [25, 25, 25, 25]
      homeplanets = ['Eos']
    } else {
      bloodChance =
        $allFactionsStoreArray[0][faction].bloodTypeDistributionPercentage
      homeplanets = await $allFactionsStoreArray[0][faction].homePlanets
    }

    let sum = bloodChance.reduce((acc, el) => acc + el, 0)
    let acc = 0
    bloodChance = bloodChance.map((el) => (acc = el + acc))
    let rand = Math.random() * sum
    bloodtype = bloodtypes[bloodChance.filter((el) => el <= rand).length]
    homeplanet = homeplanets[Math.floor(Math.random() * homeplanets.length)]
    icc_number = generateICCIDNumber(faction)
  }

  $: onCardIDfillin(card_id)
  async function onCardIDfillin() {
    if (icc_number == null) {
      icc_number = generateICCIDNumber(faction)
    }
  }

  function closeDialog() {
    icc_number = generateICCIDNumber(faction)
    showDialog.close()
  }
  function showExportSuccess(event) {
    if (event.detail.succeeded == false) {
      alert(event.detail.message)
    } else if (event.detail.succeeded == true) {
      closeDialog()
      setTimeout(function () {
        alert(event.detail.message)
      }, 180)
    }
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
  option {
    color: #ccd1dd;
    background: #3b414e;
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
</style>

<dialog bind:this={showDialog}>
  <button class="CloseX" on:click={closeDialog}>
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
          none
        {:else if threat_assessment == 1}
          minimum
        {:else if threat_assessment == 2}
          minor
        {:else if threat_assessment == 3}
          moderate
        {:else if threat_assessment == 4}
          maximum
        {:else if threat_assessment == 5}extreme{/if}
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
        Bastion Clearance: {bastion_clearance}
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
          {#each homeplanets as homeplanet}
            <option value={homeplanet}>{homeplanet}</option>
          {/each}
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
          <option value="null" disabled />
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
          placeholder="Plot nr & name" />
      </label>
      <br />
      <div class="buttonWrapper">
        <button class="cancel" on:click={closeDialog}>
          <Icon class="faIcon" icon={faArrowLeft} />
          Back
          <mat-ripple color="#ccd1dd33" />
        </button>
        <ExportButton
          on:exportFinished={showExportSuccess}
          {card_id}
          {character_name}
          {faction}
          {icc_number}
          {threat_assessment}
          {bastion_clearance}
          {douane_disposition}
          {rank}
          {ic_birthday}
          {homeplanet}
          {bloodtype}
          {recurring}
          {figu_accountID}
          {plotname} />
      </div>
    </div>
  </div>
</dialog>
