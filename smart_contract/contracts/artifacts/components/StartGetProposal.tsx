/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Start, StartClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StartGetProposal
  buttonClass="btn m-2"
  buttonLoadingNode=<span className="loading loading-spinner" />
  buttonNode="Call getProposal"
  typedClient={typedClient}
/>
*/
type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StartClient
}

const StartGetProposal = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling getProposal`)
    await props.typedClient.getProposal(
      {},
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

export default StartGetProposal