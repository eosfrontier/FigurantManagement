<script context="module">
  import { allFactionsStoreArray } from './AllFactionsArrayStore.js'
  import environment from '../../environment.js'
  import { get } from 'svelte/store'
  let all_statuses
  let isUnique = false

  export function generateICCIDNumber(faction) {
    // '123412345678'
    let first12Numbers =
      firstFourNumbers(faction).toString() + randomEightNumbers().toString()
    // get the luhn check number '123412345678X'
    let allNumbers = calculateLastDigitLuhnCheck(first12Numbers)
    // add the spaces to get the '1234 12345 1234 format'
    let iccID =
      allNumbers.substring(0, 4) +
      ' ' +
      allNumbers.substring(4, 9) +
      ' ' +
      allNumbers.substring(9, 14)

    checkICCIDUniqueness(iccID)
    if (isUnique) {
      return iccID
    } else {
      setTimeout(function () {
        generateICCIDNumber(faction)
      }, 5 * 1000)
    }
  }

  export async function checkICCIDUniqueness(iccID) {
    await fetch(environment.orthanc + 'chars_all/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        all_statuses,
        icc_number: iccID,
        'cache-control': 'no-cache',
      },
    })
      .then(function (response) {
        // a 404 response means the character is not found and the iccID can be assumed unique
        if (response.status == 404) {
          isUnique = true
          return
        } else if (response.status == 200) {
          isUnique = false
          console.log('Someone with the iccID [' + iccID + '] has been found.')
          return
        } else {
          console.log(
            'The unexpected happened. reponse [' + response.status + ']',
          )
          isUnique = false
          return
        }
      })
      .catch((error) => {
        console.log('The unexpected happened. reponse [' + error + ']')
        return false
      })
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
    let firstNumber = store[0][faction].firstNumberInID
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
