import Web3 from 'web3'
import { setGlobalState, getGlobalState } from './store'
import MyGovernor from './artifacts/contracts/MyGovernor.sol/MyGovernor.json'
import VoteNFT from './artifacts/contracts/MyNftToken.sol/MyNftToken.json'
import DeployedAddresses from './Addresses.json'

const { ethereum } = window
const chainId = 5

const connectWallet = async () => {
  try {
    if (!ethereum) return alert('Please install Metamask')
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    setGlobalState('connectedAccount', accounts[0])
  } catch (error) {
    console.log(JSON.stringify(error))
  }
}

const raiseProposal = async ({ tokenContract, description, amount }) => {
  try {
    amount = window.web3.utils.toWei(amount.toString(), 'ether')
    const contract = getGlobalState('contract')
    const account = getGlobalState('connectedAccount')

    console.log(tokenContract)
    console.log(description)
    console.log(amount)

    const calldata = window.web3.eth.abi
      .encodeFunctionCall(
        {
          'inputs': [
            {
              'internalType': 'address',
              'name': 'tokenContract',
              'type': 'address'
            }
          ],
          'name': 'setBoostedContract',
          'stateMutability': 'payable',
          'type': 'function'
        }, [tokenContract.toString()]);

    console.log(calldata)
    let proposal = await contract.methods
      .propose([DeployedAddresses.governor], [1500000000], [calldata], description)
      .send({ from: account, gas: 1500000 })

    return proposal
  } catch (error) {
    console.log(error.message)
    return error
  }
}

const performContribute = async (amount) => {
  try {
    amount = window.web3.utils.toWei(amount.toString(), 'ether')
    const contract = getGlobalState('contract')
    const account = getGlobalState('connectedAccount')

    let balance = await contract.methods
      .contribute()
      .send({ from: account, value: amount })
    balance = window.web3.utils.fromWei(
      balance.events.Action.returnValues.amount
    )
    return balance
  } catch (error) {
    console.log(error.message)
    return error
  }
}

const retrieveProposal = async (id) => {
  const web3 = window.web3
  try {
    const contract = getGlobalState('contract')
    const proposalState = await contract.methods.state(id).call().wait()
    const proposalVotes = await contract.methods.proposalVotes(id).call().wait()
    console.log(proposalState)
    console.log(proposalVotes)
    // return proposal
    const proposals = getGlobalState('proposals')
    return proposals.find((proposal) => proposal.id == id)
  } catch (error) {
    console.log(error)
  }
}

const reconstructProposal = (proposal) => {
  return {
    id: proposal.id,
    amount: window.web3.utils.fromWei(proposal.amount),
    title: proposal.title,
    description: proposal.description,
    paid: proposal.paid,
    passed: proposal.passed,
    proposer: proposal.proposer,
    upvotes: Number(proposal.upvotes),
    downvotes: Number(proposal.downvotes),
    beneficiary: proposal.beneficiary,
    executor: proposal.executor,
    duration: proposal.duration,
  }
}

const getProposal = async (id) => {
  try {
    const proposals = getGlobalState('proposals')
    const contract = getGlobalState('contract')
    const proposalVotes = await contract.methods.proposalVotes(id).call()
    var proposal = proposals.find((proposal) => proposal.id == id)
    proposal.upvotes = proposalVotes.forVotes
    proposal.downvotes = proposalVotes.againstVotes
    // const boostingToken = await contract.methods.getCurrentBoostingContract().call()
    // console.log(boostingToken)
    return proposal
  } catch (error) {
    console.log(error)
  }
}

const voteOnProposal = async (proposalId, supported) => {
  try {
    const contract = getGlobalState('contract')
    const account = getGlobalState('connectedAccount')
    const vote = await contract.methods
      .castVote(proposalId, supported)
      .send({ from: account, gas: 1500000 })
    return vote
  } catch (error) {
    console.log(error)
    return error
  }
}

const votesDelegate = async () => {
  try {
    const account = getGlobalState('connectedAccount')
    const tokenContract = getGlobalState('tokenContract')
    const res = await tokenContract.methods
      .delegate(account)
      .send({ from: account, gas: 1500000 })
    return res
  } catch (error) {
    console.log(error)
    return error
  }
}

const executeProposal = async (proposalId) => {
  try {
    const contract = getGlobalState('contract')
    const account = getGlobalState('connectedAccount')
    const proposals = getGlobalState('proposals')
    var proposal = proposals.find((proposal) => proposal.id == proposalId)
    const descriptionHash = window.web3.utils.sha3(window.web3.utils.asciiToHex(proposal.description))
    const queued = await contract.methods
      .queue(proposal.targets, proposal.values, proposal.calldatas, descriptionHash)
      .send({ from: account, gas: 1500000})
    const executed = await contract.methods
      .execute(proposal.targets, proposal.values, proposal.calldatas, descriptionHash)
      .send({ from: account, gas: 1500000, value: 1500000000000})
    return executed
  } catch (error) {
    console.log(error)
    return error
  }
}

const listVoters = async (id) => {
  try {
    const contract = getGlobalState('contract')
    const account = getGlobalState('connectedAccount')
    const votes = await contract.methods.getVotesOf(id).call()
    return votes
  } catch (error) {
    console.log(error)
  }
}

const getVotesPower = async() => {
  try {
    const account = getGlobalState('connectedAccount')
    const tokenContract = getGlobalState('tokenContract')
    const delegates = await tokenContract.methods.getVotes(account).call()
    const block = await window.web3.eth.getBlockNumber()
    console.log(block)
    return delegates
  } catch (error) {
    console.log(error)
  }
}

const payoutBeneficiary = async (id) => {
  try {
    const contract = getGlobalState('contract')
    const account = getGlobalState('connectedAccount')
    const balance = await contract.methods
      .payBeneficiary(id)
      .send({ from: account })
    return balance
  } catch (error) {
    return error
  }
}

const loadWeb3 = async () => {
  try {
    if (!ethereum) return alert('Please install Metamask')
    window.web3 = new Web3(ethereum)
    await ethereum.request({ method: 'eth_requestAccounts' })
    window.web3 = new Web3(window.web3.currentProvider)
    
    const web3 = window.web3
    const networkId = await window.web3.eth.net.getId()

    // goerli only
    if (networkId !== chainId) {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: web3.utils.toHex(chainId) }]
        });
    }

    const accounts = await web3.eth.getAccounts()
    setGlobalState('connectedAccount', accounts[0])

    // const networkData = deployNetwork

    if (DeployedAddresses) {
      const contract = new web3.eth.Contract(
        MyGovernor.abi,
        DeployedAddresses.governor
      )

      const tokenContract = new web3.eth.Contract(
        VoteNFT.abi,
        DeployedAddresses.token
      )

      const myVotingPower = await tokenContract.methods
        .getVotes(accounts[0])
        .call({ from: accounts[0] })

      console.log(myVotingPower)

      let currentBlock = await web3.eth.getBlockNumber()
      currentBlock = await web3.eth.getBlock(currentBlock)

      await contract.getPastEvents('ProposalCreated', {
        fromBlock: 0,
        toBlock: 'latest'
      }, function(error, events){ console.log(events); })
      .then(function(events){
          console.log(events) // same results as the optional callback above
          setGlobalState('proposals', structuredProposals(events))
      });
      // const balance = await contract.methods.daoBalance().call()
      // const mybalance = await contract.methods
      //   .getBalance()
      //   .call({ from: accounts[0] })

      setGlobalState('contract', contract)
      setGlobalState('tokenContract', tokenContract)
      setGlobalState('myVotingPower', myVotingPower)
      // setGlobalState('mybalance', web3.utils.fromWei(mybalance))
      // setGlobalState('isStakeholder', isStakeholder)
      setGlobalState('currentBlock', currentBlock)
    } else {
      window.alert('LavishLairDAO contract not deployed to detected network.')
    }
    return true
  } catch (error) {
    alert('Please connect your metamask wallet!')
    console.log(error)
    return false
  }
}

const structuredProposals = (proposals) => {
  const web3 = window.web3
  proposals = proposals.map(i => i.returnValues)
  console.log(proposals)
  return proposals
    .map((proposal) => ({
      id: proposal.proposalId,
      description: proposal.description,
      proposer: proposal.proposer,
      startBlock: proposal.startBlock,
      endBlock: proposal.endBlock,
      calldatas: proposal.calldatas,
      values: proposal.values,
      targets: proposal.targets
    }))
    .reverse()
}

export {
  loadWeb3,
  connectWallet,
  performContribute,
  raiseProposal,
  retrieveProposal,
  voteOnProposal,
  votesDelegate,
  executeProposal,
  getProposal,
  listVoters,
  payoutBeneficiary,
}
