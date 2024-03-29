/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Start, StartClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StartCreateApplication
  buttonClass="btn m-2"
  buttonLoadingNode=<span className="loading loading-spinner" />
  buttonNode="Call createApplication"
  typedClient={typedClient}
  proposal={proposal}
/>
*/
type StartCreateApplicationArgs = Dao['methods']['createApplication(string)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StartClient
  proposal: StartCreateApplicationArgs['proposal']
}

const StartCreateApplication = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling createApplication`)
    await props.typedClient.create.createApplication(
      {
        proposal: props.proposal,
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

export default StartCreateApplication