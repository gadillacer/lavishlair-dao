import { createGlobalState } from 'react-hooks-global-state'
import moment from 'moment'

const { setGlobalState, useGlobalState, getGlobalState } = createGlobalState({
  createModal: 'scale-0',
  loginModal: 'scale-0',
  connectedAccount: '',
  contract: null,
  tokenContract: null,
  currentUser: null,
  isStakeholder: false,
  balance: 0,
  mybalance: 0,
  myVotingPower: 0,
  currentBlock: null,
  proposals: [],
})

const truncate = (text, startChars, endChars, maxLength) => {
  if (text.length > maxLength) {
    var start = text.substring(0, startChars)
    var end = text.substring(text.length - endChars, text.length)
    while (start.length + end.length < maxLength) {
      start = start + '.'
    }
    return start + end
  }
  return text
}

const daysRemaining = (currentBlock, endBlock, averageBlockTime) => {
  // const todaysdate = Number((currentBlock + '000').slice(0))
  // endDay = Number((endDay + '000').slice(0))

  const blockDiff = endBlock - currentBlock.number;
  if (!averageBlockTime) return null
  const futureTimestamp = blockDiff * averageBlockTime + currentBlock.timestamp;
  console.log(futureTimestamp)

  // const diff = moment.utc((todaysdate - endDay) * 1000).format('HH');
  const diff = moment.unix(futureTimestamp).fromNow();
  return diff
}

export {
  useGlobalState,
  setGlobalState,
  getGlobalState,
  truncate,
  daysRemaining,
}
