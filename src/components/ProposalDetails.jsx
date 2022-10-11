import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getGroup, createNewGroup, joinGroup } from '../CometChat'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
} from 'recharts'
import { getProposal, voteOnProposal, executeProposal } from '../LavishLair'
import { useGlobalState } from '../store'

const ProposalDetails = () => {
  const { id } = useParams()
  const navigator = useNavigate()
  const [proposal, setProposal] = useState(null)
  const [group, setGroup] = useState(null)
  const [data, setData] = useState([])
  const [connectedAccount] = useGlobalState('connectedAccount')
  const [currentUser] = useGlobalState('currentUser')
  const [currentBlock] = useGlobalState('currentBlock')
  const [averageBlockTime, setAverageBlockTime] = useState(null)

  useEffect(() => {
    retrieveProposal()
    getGroup(`pid_${id}`).then((group) => {
      if (!!!group.code) setGroup(group)
      console.log(group)
    })
  }, [id])

  const retrieveProposal = () => {
    getProposal(id).then((res) => {
      setProposal(res)
      setData([
        {
          name: 'Voters',
          Acceptees: res?.upvotes,
          Rejectees: res?.downvotes,
        },
      ])
      getBlockAverageTime()
    })
  }

  const onVote = (choice) => {
    if (Number(currentBlock.number) > Number(proposal.endBlock)) {
      toast.warning('Proposal expired!')
      return
    }

    voteOnProposal(id, choice).then((res) => {
      if (!!!res.code) {
        toast.success('Voted successfully!')
        window.location.reload()
      }
    })
  }

  const onExecute = () => {
    if (Number(currentBlock.number) < Number(proposal.endBlock)) {
      toast.warning('Still in vote duration!')
      return
    }
    executeProposal(id).then((res) => {
      if (res.status) {
        toast.success('Executed successfully!')
        window.location.reload()
      }
    })
  }

  const getBlockAverageTime = () => {
    var nowBlock;

    window.web3.eth.getBlockNumber(function(err, nowBlockNumber) {
      // Get the current block
      window.web3.eth.getBlock(nowBlockNumber, function(err, nb) {
        nowBlock = nb;
        // Get the block 500 blocks ago
        window.web3.eth.getBlock(nowBlockNumber - 500, function(err, thenBlock) {
          // Take the average of the then and now timestamps
          setAverageBlockTime((nowBlock.timestamp - thenBlock.timestamp) / 500.0);
        });
      });
    });
  }

  const daysRemaining = (endBlock) => {
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

  const onEnterChat = () => {
    if (group.hasJoined) {
      navigator(`/chat/${`pid_${id}`}`)
    } else {
      joinGroup(`pid_${id}`).then((res) => {
        if (!!res) {
          navigator(`/chat/${`pid_${id}`}`)
          console.log('Success joining: ', res)
        } else {
          console.log('Error Joining Group: ', res)
        }
      })
    }
  }

  const onCreateGroup = () => {
    createNewGroup(`pid_${id}`, proposal.description).then((group) => {
      if (!!!group.code) {
        toast.success('Group created successfully!')
        setGroup(group)
      } else {
        console.log('Error Creating Group: ', group)
      }
    })
  }

  return (
    <div className="p-8">
      <h2 className="font-semibold text-3xl mb-5">{proposal?.description}</h2>
      <p>
        This proposal is to payout and
        currently have{' '}
        <strong>{parseInt(proposal?.upvotes) + parseInt(proposal?.downvotes)} votes</strong> and
        will expire in <strong>{averageBlockTime ? daysRemaining(proposal?.endBlock) : "unknown hours"}</strong>
      </p>
      <hr className="my-6 border-gray-300" />
      <p>{proposal?.description}</p>
      <div className="flex flex-row justify-start items-center w-full mt-4 overflow-auto">
        <BarChart width={730} height={250} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Acceptees" fill="#2563eb" />
          <Bar dataKey="Rejectees" fill="#dc2626" />
        </BarChart>
      </div>
      <div
        className="flex flex-row justify-start items-center space-x-3 mt-4"
        role="group"
      >
        {(
          <>
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
              onClick={() => onVote(1)}
            >
              Accept
            </button>
            <button
              type="button"
              className="inline-block px-6 py-2.5
            bg-blue-600 text-white font-medium text-xs
              leading-tight uppercase rounded-full shadow-md
              hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
              focus:shadow-lg focus:outline-none focus:ring-0
              active:bg-blue-800 active:shadow-lg transition
              duration-150 ease-in-out
              dark:border dark:border-gray-500 dark:bg-transparent"
              data-mdb-ripple="true"
              data-mdb-ripple-color="light"
              onClick={() => onVote(0)}
            >
              Reject
            </button>

            {currentUser &&
            currentUser.uid.toLowerCase() == proposal?.proposer.toLowerCase() &&
            !group ? (
              <button
                type="button"
                className="inline-block px-6 py-2.5
                bg-blue-600 text-white font-medium text-xs
                leading-tight uppercase rounded-full shadow-md
                hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
                focus:shadow-lg focus:outline-none focus:ring-0
                active:bg-blue-800 active:shadow-lg transition
                duration-150 ease-in-out
                dark:border dark:border-blue-500"
                data-mdb-ripple="true"
                data-mdb-ripple-color="light"
                onClick={onCreateGroup}
              >
                Create Group
              </button>
            ) : null}
            <button
              type="button"
              className="inline-block px-6 py-2.5
            bg-blue-600 text-white font-medium text-xs
              leading-tight uppercase rounded-full shadow-md
              hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
              focus:shadow-lg focus:outline-none focus:ring-0
              active:bg-blue-800 active:shadow-lg transition
              duration-150 ease-in-out
              dark:border dark:border-gray-500 dark:bg-transparent"
              data-mdb-ripple="true"
              data-mdb-ripple-color="light"
              onClick={() => onExecute()}
            >
              Execute
            </button>
          </>
        )}

        {currentUser && currentUser.uid.toLowerCase() == connectedAccount.toLowerCase() && !!!group?.code && group != null ? (
          <button
            type="button"
            className="inline-block px-6 py-2.5
            bg-blue-600 text-white font-medium text-xs
            leading-tight uppercase rounded-full shadow-md
            hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700
            focus:shadow-lg focus:outline-none focus:ring-0
            active:bg-blue-800 active:shadow-lg transition
            duration-150 ease-in-out
            dark:border dark:border-blue-500"
            data-mdb-ripple="true"
            data-mdb-ripple-color="light"
            onClick={onEnterChat}
          >
            Chat
          </button>
        ) : null}

        {proposal?.proposer.toLowerCase() != connectedAccount.toLowerCase() &&
        !!!group ? (
          <button
            type="button"
            className="inline-block px-6 py-2.5 bg-blue-600
            dark:bg-transparent text-white font-medium text-xs
            leading-tight uppercase rounded-full shadow-md
            hover:border-blue-700 hover:shadow-lg focus:border-blue-700
            focus:shadow-lg focus:outline-none focus:ring-0
            active:border-blue-800 active:shadow-lg transition
            duration-150 ease-in-out dark:text-blue-500
            dark:border dark:border-blue-500 disabled:bg-blue-300"
            data-mdb-ripple="true"
            data-mdb-ripple-color="light"
            disabled
          >
            Group N/A
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ProposalDetails
