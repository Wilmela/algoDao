/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Start, StartClient } from '../contracts/StartClient'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import * as algokit from "@algorandfoundation/algokit-utils"

/* Example usage
<StartCloseOutOfApplication
  buttonClass="btn m-2"
  buttonLoadingNode=<span className="loading loading-spinner" />
  buttonNode="Call register"
  typedClient={typedClient}
  registeredASA={registeredASA}
/>
*/
type StartCloseOutOfApplicationArgs = Start['methods']['closeOutOfApplication(asset)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StartClient
  registeredASA: StartCloseOutOfApplicationArgs['registeredASA']
  algodClient: algosdk.Algodv2
  getState: () => Promise<void>
}

const StartCloseOutOfApplication = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling closeOutOfApplication`)

    await props.typedClient.closeOut.closeOutOfApplication(
      {
        registeredASA: props.registeredASA,
      },
      { sender, sendParams: { fee: algokit.microAlgos(3_000) } },
    )

    const { appAddress } = await props.typedClient.appClient.getAppReference();

    const registerCloseTnx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: appAddress,
      closeRemainderTo: appAddress,
      amount: 0,
      suggestedParams: await algokit.getTransactionParams(undefined, props.algodClient),
      assetIndex: Number(props.registeredASA),
    })

    await algokit.sendTransaction({ transaction: registerCloseTnx, from: sender }, props.algodClient)

   
    await props.getState()
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default StartCloseOutOfApplication
