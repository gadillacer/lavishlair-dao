import { useState } from 'react'
import { setGlobalState, useGlobalState } from '../store'
import { performContribute, votesDelegate } from '../LavishLair'
import { toast } from 'react-toastify'

const Banner = () => {
  const [proposals] = useGlobalState('proposals')
  const [connectedAccount] = useGlobalState('connectedAccount')
  const [currentUser] = useGlobalState('currentUser')
  const [balance] = useGlobalState('balance')
  const [mybalance] = useGlobalState('mybalance')
  const [myVotingPower] = useGlobalState('myVotingPower')
  const [amount, setAmount] = useState('')

  const onPropose = () => {
    setGlobalState('createModal', 'scale-100')
  }

  const onContribute = () => {
    if (!!!amount || amount == '') return
    toast.info('Contribution in progress...')

    performContribute(amount).then((bal) => {
      if (!!!bal.message) {
        setGlobalState('balance', Number(balance) + Number(bal))
        setGlobalState('mybalance', Number(mybalance) + Number(bal))
        setAmount('')
        toast.success('Contribution received')
      }
    })
  }

  const onDelegate = () => {
    votesDelegate().then((res) => {
      if (!!!res.code) {
        toast.success('Delegated successfully!')
        window.location.reload()
      }
    })
  }

  const opened = () =>
    proposals.filter(
      (proposal) => new Date().getTime() < Number(proposal.endBlock + '000')
    ).length

  return (
    <div className="p-8">
      <h2 className="font-semibold text-3xl mb-5">
        {opened()} Proposal{opened() == 1 ? '' : 's'} Currenly Opened
      </h2>
      <p>
        Current DAO Balance: <strong>{balance} Eth</strong> <br />

        This is a ⌐◨-◨ Sub-DAO that govern NFT Marketplace's revenue (or whatever you want)
        <br />
        Your Voting Power: <strong>{myVotingPower}</strong><br/>
        Mint your Nouns testNFT: <span />  
        <a href={process.env.BEAN_WEBSITE_URL ? process.env.BEAN_WEBSITE_URL : "https://bean-machine-frontend.vercel.app"} style={{color: 'purple'}}>Here</a>
        <br />
        <br/>
        <button
              type="button"
              className="inline-block px-6 py-2.5
            bg-blue-600 text-white font-medium text-xs
              leading-tight uppercase rounded-full shadow-md
              hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
              focus:shadow-lg focus:outline-none focus:ring-0
              active:bg-blue-800 active:shadow-lg transition
              duration-150 ease-in-out dark:text-gray-300
              dark:border dark:border-gray-500 dark:bg-transparent"
              data-mdb-ripple="true"
              data-mdb-ripple-color="light"
              onClick={() => onDelegate()}
            >
              Delegate
        </button>
      </p>
      <hr className="my-6 border-gray-300 dark:border-gray-500" />
      <p>
        Hey, you must have LilNouns ⌐◨-◨ to Raise/Vote a Proposal 😎
      </p>
      <div className="flex flex-row justify-start items-center md:w-1/3 w-full mt-4">
        <input
          type="number"
          className="form-control block w-full px-3 py-1.5
          text-base font-normaltext-gray-700
          bg-clip-padding border border-solid border-gray-300
          rounded transition ease-in-out m-0 shadow-md
          focus:text-gray-500 focus:outline-none
          dark:border-gray-500 dark:bg-transparent"
          placeholder="e.g: Boosting 1% $reward for Azuki sellers"
          onChange={(e) => setAmount(e.target.value)}
          value={amount}
          required
        />
      </div>
      <div
        className="flex flex-row justify-start items-center space-x-3 mt-4"
        role="group"
      >
        <button
          type="button"
          className={`inline-block px-6 py-2.5
          bg-blue-600 text-white font-medium text-xs
          leading-tight uppercase shadow-md rounded-full
          hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
          focus:shadow-lg focus:outline-none focus:ring-0
          active:bg-blue-800 active:shadow-lg transition
          duration-150 ease-in-out dark:text-blue-500
          dark:border dark:border-blue-500 dark:bg-transparent`}
          data-mdb-ripple="true"
          data-mdb-ripple-color="light"
          onClick={onPropose}
        >
          Propose
        </button>

        {currentUser &&
        currentUser.uid == connectedAccount.toLowerCase() ? null : (
          <button
            type="button"
            className={`inline-block px-6 py-2.5
            bg-blue-600 text-white font-medium text-xs
            leading-tight uppercase shadow-md rounded-full
            hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
            focus:shadow-lg focus:outline-none focus:ring-0
            active:bg-blue-800 active:shadow-lg transition
            duration-150 ease-in-out dark:border dark:border-blue-500`}
            data-mdb-ripple="true"
            data-mdb-ripple-color="light"
            onClick={() => setGlobalState('loginModal', 'scale-100')}
          >
            Claim Souldrop(12 days left)
          </button>
        )}
      </div>
    </div>
  )
}

export default Banner
