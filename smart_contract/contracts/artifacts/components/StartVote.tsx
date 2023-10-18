/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Start, StartClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StartVote
  buttonClass="btn m-2"
  buttonLoadingNode=<span className="loading loading-spinner" />
  buttonNode="Call vote"
  typedClient={typedClient}
  inFavor={inFavor}
  registeredASA={registeredASA}
/>
*/
type StartVoteArgs = Dao['methods']['vote(bool,asset)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StartClient
  inFavor: StartVoteArgs['inFavor']
  registeredASA: StartVoteArgs['registeredASA']
}

const StartVote = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling vote`)
    await props.typedClient.vote(
      {
        inFavor: props.inFavor,
        registeredASA: props.registeredASA,
      },
      {
        sender: { signer, addr: activeAddress! },
      },
    )
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default StartVote