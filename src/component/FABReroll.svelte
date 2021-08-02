<script>
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'

  import config from '../../config.js'

  import { allFactionsStoreArray } from './AllFactionsArrayStore.js'

  let generatedResults = []
  let autoRoll
  const dispatch = createEventDispatcher()

  onMount(() => {
    rollNewNames()
  })

  function mouseDown() {
    //calling it before setting the interval so we get a simulated mouse click too
    //a seperate click caused new names to be rolled when the mouse was released
    rollNewNames()
    autoRoll = setInterval(() => {
      rollNewNames()
    }, 400)
  }

  function mouseUp() {
    clearInterval(autoRoll)
  }

  function rollNewNames() {
    generatedResults = config.Factions.map(getThisFactionNames)
    dispatch('rolledNames', generatedResults)
  }

  function getThisFactionNames(selectedFaction) {
    let amountOfNamesRequires = config.DefaultAmount
    let namesArray = []
    let generatedName = ''
    let selectedArray
    let amountOfSectionsInName =
      $allFactionsStoreArray[0][selectedFaction].desiredOutput.length
    for (let i = 0; i < amountOfNamesRequires; i += 1) {
      for (let nameStep = 0; nameStep < amountOfSectionsInName; nameStep += 1) {
        if (
          // invert 'chance' percentage so a clean math.random can be used 0 = always 1 = never
          1 -
            $allFactionsStoreArray[0][selectedFaction].chanceOfOutput[
              nameStep
            ] <
          Math.random()
        ) {
          if (nameStep > 0) {
            generatedName +=
              $allFactionsStoreArray[0][selectedFaction].concatinationSymbol[
                nameStep - 1
              ]

            if (
              generatedName.slice(-1) === ' ' ||
              generatedName.slice(-1) === '-'
            ) {
              // somehow the negative check for the spaces is not working, so we do a positive and then the else afterwards
            } else {
              generatedName += ' '
            }
          }
          selectedArray =
            $allFactionsStoreArray[0][selectedFaction].desiredOutput[nameStep]
          let randomMax =
            $allFactionsStoreArray[0][selectedFaction][selectedArray].length
          let randomNumber = Math.floor(Math.random() * randomMax)

          generatedName +=
            $allFactionsStoreArray[0][selectedFaction][selectedArray][
              randomNumber
            ]
        }
      }
      namesArray.push(generatedName)
      generatedName = ''
    }

    return {
      faction: selectedFaction,
      names: namesArray,
    }
  }
</script>

<style>
  button {
    top: clamp(1.25em, 2em, calc(5% - 1.75rem));
    right: 10%;
    z-index: 2;
    position: absolute;
    font-size: 1rem;
    padding: 0.5rem;
    margin-bottom: -1rem;
    color: #ccd1dd;
    background: #386ae8;
  }
  button:before {
    content: 'Roll New Names ';
  }
  button:after {
    content: '🎲';
  }
  button:active:after {
    display: inline-block;
    content: '🎲';
    animation-name: rollDice;
    animation-duration: 1200ms;
    animation-timing-function: cubic-bezier(0.6, 1.8, 0.8, 0.8);
    animation-iteration-count: infinite;
  }
  @keyframes rollDice {
    0% {
      transform: rotate(0deg) translate(0, 0);
    }
    33% {
      transform: rotate(120deg) translate(0.09375em, -0.09375em);
    }
    66% {
      transform: rotate(240deg) translate(-0.09375em, -0.09375em);
    }
    100% {
      transform: rotate(360deg) translate(0, 0);
    }
  }
  /* Tablet size or smaller */
  @media screen and (max-width: 80.5em) {
    button {
      border-radius: 50%;
      width: 3.5rem;
      height: 3.5rem;
      font-size: 2rem;
      padding: 0rem;
      margin-bottom: 0rem;
      box-shadow: var(--materialElevation6boxShadow);
    }
    @media (hover: hover) {
      button:hover {
        box-shadow: var(--materialElevation12boxShadow);
      }
    }
    button:active {
      box-shadow: var(--materialElevation12boxShadow);
    }
    button:before {
      content: '';
    }
  }

  /* Phone size or smaller */
  @media screen and (max-width: 47em) {
    button {
      position: fixed;
      width: 3.5rem;
      height: 3.5rem;
      font-size: 2rem;
      top: unset;
      bottom: calc(15% - 3.5rem);
    }
  }
</style>

<button
  on:mousedown={mouseDown}
  on:touchstart={mouseDown}
  on:mouseup={mouseUp}
  on:touchend={mouseUp}>
  <mat-ripple color="#ccd1dd33" />
</button>
