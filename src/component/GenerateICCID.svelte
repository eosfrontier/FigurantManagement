<script context="module">
  import { allFactionsStoreArray } from './SvelteStore.js'
  import environment from '../../environment.js'
  import { get } from 'svelte/store'
  let all_statuses

  /**
   * Asynchronously generates a unique ICCID number for a given faction.
   * It repeatedly generates an ID and checks for its uniqueness via an API call
   * until a unique ID is found.
   *
   * @param {string} faction The faction to generate an ICCID for.
   * @returns {Promise<string>} A promise that resolves to a unique ICCID string.
   */
  export async function generateICCIDNumber(faction) {
    if (faction == null) {
      return '1234 12345 1234'
    }

    let isUnique = false
    let iccID

    // Loop until a unique ID is found. This may take multiple attempts if collisions occur.
    while (!isUnique) {
      const first12Numbers =
        firstFourNumbers(faction).toString() + randomEightNumbers().toString()
      const allNumbers = calculateLastDigitLuhnCheck(first12Numbers)
      iccID =
        allNumbers.substring(0, 4) +
        ' ' +
        allNumbers.substring(4, 9) +
        ' ' +
        allNumbers.substring(9, 14)

      isUnique = await checkICCIDUniqueness(iccID)
    }

    return iccID
  }

  export async function checkICCIDUniqueness(iccID) {
    try {
      const response = await fetch(environment.orthanc + 'chars_all/', {
        method: 'GET',
        mode: 'cors',
        headers: {
          token: environment.token,
          all_statuses,
          icc_number: iccID,
          'cache-control': 'no-cache',
        },
      })
      // A 404 response means the character is not found and the iccID can be assumed unique.
      if (response.status === 404) {
        return true
      }
      if (response.status === 200) {
        console.log('Collision: iccID [' + iccID + '] already exists.')
        return false
      }
      console.log('Unexpected API response status: ' + response.status)
      return false
    } catch (error) {
      console.log('Failed to check ICCID uniqueness: ' + error)
      return false // Assume not unique on network error to be safe.
    }
  }

  // generate number in the following format: 1234 12345 1234
  // have firstNumberInID be the first number for the generated number
  //
  // ? do something funny with the other numbers?
  // luhn? current day of year as followup three numbers?
  //
  // check if the id exists
  // if it does not, return, else generate a new one

  function firstFourNumbers(faction) {
    /* Get the first number from the faction database.
    Use the current day of the year as follow up numbers
    if the current day of the year does not have 3 intergers, add 0's infront
    add the two generated numbers together as string as result*/
    let store = get(allFactionsStoreArray)
    let firstNumber
    if (store[0][faction] == null) {
      firstNumber = 0
    } else {
      firstNumber = store[0][faction].firstNumberInID
    }
    let date = new Date()
    let dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
    )
    let followingNumbers = addLeadingZeros(dayOfYear, 3)
    return firstNumber.toString().concat(followingNumbers.toString())
  }

  function addLeadingZeros(number, size) {
    let string = number + ''
    while (string.length < size) string = '0' + string
    return string
  }

  function randomEightNumbers() {
    return Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000
  }

  function calculateLastDigitLuhnCheck(currentLongNumber) {
    // add a 0 at the end for correct calculations
    let value = currentLongNumber.toString() + '0'
    let sum = 0
    let shouldDouble = false
    //luhn calculation
    for (var i = value.length - 1; i >= 0; i--) {
      var digit = parseInt(value.charAt(i))
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9
      }
      sum += digit
      shouldDouble = !shouldDouble
    }
    // luhn last digit
    if (sum % 10 != 0) {
      currentLongNumber =
        currentLongNumber.toString() + (10 - (sum % 10).toString())
    } else {
      currentLongNumber = currentLongNumber.toString() + '0'
    }
    return currentLongNumber
  }
</script>
