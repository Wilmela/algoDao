/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Start, StartClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StartRegister
  buttonClass="btn m-2"
  buttonLoadingNode=<span className="loading loading-spinner" />
  buttonNode="Call register"
  typedClient={typedClient}
  registeredASA={registeredASA}
/>
*/
type StartRegisterArgs = Dao['methods']['register(asset)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StartClient
  registeredASA: StartRegisterArgs['registeredASA']
}

const StartRegister = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling register`)
    await props.typedClient.register(
      {
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

export default StartRegister