/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Start, StartClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StartGetRegisteredASA
  buttonClass="btn m-2"
  buttonLoadingNode=<span className="loading loading-spinner" />
  buttonNode="Call getRegisteredASA"
  typedClient={typedClient}
/>
*/
type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StartClient
}

const StartGetRegisteredASA = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling getRegisteredASA`)
    await props.typedClient.getRegisteredASA(
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

export default StartGetRegisteredASA