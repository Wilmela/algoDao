import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { PROVIDER_ID, ProvidersArray, WalletProvider, useInitializeProviders, useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import StartCreateApplication from './components/StartCreateApplication'
import { StartClient } from './contracts/StartClient'
import * as algokit from '@algorandfoundation/algokit-utils'
import StartRegister from './components/StartRegister'
import StartVote from './components/StartVote'
import StartCloseOutOfApplication from './components/StartCloseOutOfApplication'

let providersArray: ProvidersArray
if (import.meta.env.VITE_ALGOD_NETWORK === '') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  providersArray = [
    {
      id: PROVIDER_ID.KMD,
      clientOptions: {
        wallet: kmdConfig.wallet,
        password: kmdConfig.password,
        host: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  providersArray = [
    { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
    { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
    { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    { id: PROVIDER_ID.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const [appID, setAppID] = useState<number | BigInt | string>(0)
  const [registeredASA, setRegisteredASA] = useState<number>(0)
  const [proposal, setProposal] = useState<string>('')
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [voteTotal, setVoteTotal] = useState<number>(0)
  const [voteInFavor, setVoteInFavor] = useState<number>(0)
  const [registered, setRegistered] = useState(false)
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const typedClient = new StartClient(
    {
      resolveBy: 'id',
      id: appID as number,
    },
    algodClient,
  )

  const walletProviders = useInitializeProviders({
    providers: providersArray,
    nodeConfig: {
      network: algodConfig.network,
      nodeServer: algodConfig.server,
      nodePort: String(algodConfig.port),
      nodeToken: String(algodConfig.token),
    },
    algosdkStatic: algosdk,
  })

  const resetState = () => {
    setRegisteredASA(0)
    setVoteTotal(0)
    setVoteInFavor(0)
    setRegistered(false)
  }
  // Get all global state
  const getState = async () => {
    try {
      const state = await typedClient.getGlobalState()
      setProposal(state.proposal!.asString())
      const asa = (state.registeredAsaId?.asNumber()) || 0
      setRegisteredASA(asa)
      setVoteTotal((state.votesTotal?.asNumber()) || 0)
      setVoteInFavor((state.votesInFavor?.asNumber()) || 0)

      try {
        //Determine a user holds asa
        const assetInfo = await algodClient.accountAssetInformation(activeAddress!, asa).do()
        setRegistered(assetInfo['asset-holding'].amount === 1)
      } catch (e) {
        console.warn(e)
        setRegistered(false);
      }

    try {
        // Check local state if user has voted.
        const localState = await typedClient.getLocalState(activeAddress!);
        setHasVoted(localState.inFavor !== undefined)
      } catch (error) {
        console.log(error)
        setHasVoted(false);
      }

    } catch (error) {
      setProposal('Invalid App ID')
      resetState()
    }
  }

  // Update the UI with the corresponding proposal when appID changes
  useEffect(() => {
    if (appID === 0) {
      setProposal('App ID needs to be set via Dao creation or manually.')
      resetState()
      return
    }

    getState()
  }, [appID])
  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider value={walletProviders}>
        <div className="hero min-h-screen bg-teal-400">
          <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
            <div className="max-w-md">
              <h1 className="text-4xl">
                Welcome to <div className="font-bold">ALGO-DAO 🙂</div>
              </h1>
              <p className="py-6 max-w-[char(20)]">This is a project for the algorand beginner bootcamp!.</p>

              <div className="grid">
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>
                <div className="divider" />

                <h1 className="font-bold m-2">App ID: </h1>
                <input
                  type="number"
                  className="input input-bordered"
                  value={appID as number}
                  onChange={(e) => setAppID(e.currentTarget.valueAsNumber || 0)}
                />

                <h1 className="font-bold m-2">Proposal </h1>
                <textarea className="textarea textarea-bordered m-2" value={proposal} />

                <h1 className="font-bold m-2">Vote</h1>

                <p>
                  {voteTotal} / {voteInFavor}
                </p>

                <div className="divider" />

                {activeAddress && appID === 0 && (
                  <StartCreateApplication
                    buttonClass="btn m-2"
                    buttonLoadingNode=<span className="loading loading-spinner" />
                    buttonNode="Create DAO"
                    typedClient={typedClient}
                    setAppId={setAppID}
                  />
                )}

                {activeAddress && appID !== 0 && !registered && (
                  <StartRegister
                    buttonClass="btn m-2"
                    buttonLoadingNode=<span className="loading loading-spinner" />
                    buttonNode="Register to vote"
                    typedClient={typedClient}
                    registeredASA={registeredASA}
                    algodClient={algodClient}
                    getState={getState}
                  />
                )}

                {activeAddress && appID !== 0 && registered && !hasVoted && (
                  <div>
                    <StartVote
                      buttonClass="btn m-2"
                      buttonLoadingNode=<span className="loading loading-spinner" />
                      buttonNode="Vote Against"
                      typedClient={typedClient}
                      inFavor={false}
                      registeredASA={registeredASA}
                      getState={getState}
                    />

                    <StartVote
                      buttonClass="btn m-2"
                      buttonLoadingNode=<span className="loading loading-spinner" />
                      buttonNode="Vote in Favor"
                      typedClient={typedClient}
                      inFavor={true}
                      registeredASA={registeredASA}
                      getState={getState}
                    />
                  </div>
                )}

                {activeAddress && appID !== 0 && registered && (
                  <StartCloseOutOfApplication
                    buttonClass="btn m-2"
                    buttonLoadingNode=<span className="loading loading-spinner" />
                    buttonNode="Opt Out"
                    typedClient={typedClient}
                    registeredASA={registeredASA}
                    algodClient={algodClient}
                    getState={getState}
                  />
                )}
              </div>

              <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
