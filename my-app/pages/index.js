import Head from "next/head";
import Web3Modal from "web3modal";
import {useState, useEffect, useRef} from "react";
import styles from "../styles/Home.module.css";
import {Contract, providers, utils, BigNumber} from "ethers";
import { NFT_CONTRACT_ADDRESS , NFT_CONTRACT_ABI , TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from "@/constants";

// Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open



export default function Home() {

const web3ModalRef = useRef();
const [walletConnected, setWalletConnected] = useState(false);
const [loading, setLoading] = useState(false);
const [isOwner, setIsOwner] = useState(false);

const zero = BigNumber.from(0);

// tokensToBeClaimed keeps track of the number of tokens that can be claimed
// based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens

const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

// balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address

const [balanceOfDevTokens, setBalanceOfDevTokens] = useState(zero);

// amount of the tokens that the user wants to mint

const [amountToMint, setAmountToMint] = useState(zero);

// tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)

const [tokensMinted, setTokensMinted] = useState(zero);

// getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
const getTokensToBeClaimed = async() => {
  try{

    const provider = await getProviderOrSigner();
    const nftContract = new Contract( NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);

     // We will get the signer now to extract the address of the currently connected MetaMask account
    const signer = await getProviderOrSigner(true);
    
    const signerAddress = await signer.getAddress();
    // call the balanceOf from the NFT contract to get the number of NFT's held by the user
    const nftHeld = await nftContract.balanceOf(signerAddress);

    // balance is a Big number and thus we would compare it with Big number `zero`
    if (nftHeld === zero) {
      setTokensToBeClaimed(zero);
    } else {

      let amount = 0;

      for(let i =0 ; i < nftHeld ; i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(signerAddress, i);
        const _tokenIdsClaimed = await tokenContract.tokenIdsClaimed(tokenId);

        if(!_tokenIdsClaimed) {
          amount++;
        }
      }
      setTokensToBeClaimed(BigNumber.from(amount));
    }
  } catch(err) {
   console.error(err);
   setTokensToBeClaimed(zero);
  }
};

//getBalanceOfDevTokens: checks the balance of  Dev Tokens's held by an address

const getBalanceOfDevTokens = async() => {
  try {
    const provider = await getProviderOrSigner();
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
    
    const signer = await getProviderOrSigner(true); 
    const signerAddress = await signer.getAddress();

    const balanceOfSigner = await tokenContract.balanceOf(signerAddress);

    // balance is already a big number, so we dont need to convert it before setting it
    setBalanceOfDevTokens(balanceOfSigner);
  } catch(err) {
    console.error(err);
    setBalanceOfDevTokens(zero);
  }
};

//claimDevTokens: Helps the user claim Dev Tokens

const claimDevTokens = async() => {
  try {
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

    const tx = await tokenContract.claim();
    setLoading(true);
    await tx.wait();
    setLoading(false);

    window.alert("Successfully Claimed your DevTokens ");
    await getBalanceOfDevTokens();
    await getTokensToBeClaimed();
    await getTotalTokensMinted();

  } catch (err) {
    console.error(err);
  }

  
}

//mintDevToken: mints `amount` number of tokens to a given address

const mintDevTokens = async(amount) => {
  try{
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

    // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
    const value = 0.001 * amount;
    // value signifies the cost of one crypto dev token which is "0.001" eth.
    // We are parsing `0.001` string to ether using the utils library from ethers.js
    const tx = await tokenContract.mint(amount, {
                     value: utils.parseEther(value.toString()),
    });
    setLoading(true);
    await tx.wait();
    setLoading(false);

    window.alert("Successfullt minted your DevTokens");
    await getBalanceOfDevTokens();
    await getTokensToBeClaimed();
    await getTotalTokensMinted();
  } catch(err) {
    console.error(err);
  }
}

// getTotalTokensMinted: Retrieves how many tokens have been minted till now out of the total supply

const getTotalTokensMinted = async() => {
  try {
    const provider = await getProviderOrSigner();
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);

    const _totalTokensMinted = await tokenContract.totalSupply();
    setTokensMinted(_totalTokensMinted);

  } catch(err) {
    console.error(err);
  }
};

const getOwner = async() => {
  try {
    const provider = await getProviderOrSigner();
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
     // call the owner function from the contract
    const _ownerAddress = await tokenContract.owner();

    const signer = await getProviderOrSigner(true);
    const signerAddress = await signer.getAddress();

    if(_ownerAddress.toLowerCase() === signerAddress.toLowerCase()) {
      setIsOwner(true);
    }
   
  } catch (err) {
    console.error(err.message);
  }
};


const withdrawCoins = async() => {
  try {
    const signer = getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
    
    const tx = await tokenContract.withdraw();
    setLoading(true); 
    await tx.wait();
    setLoading(false);

    await getOwner();
  } catch (err) {
    console.error(err);
  }
  
}

const getProviderOrSigner = async(needSigner = false) => {
  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  const {chainId} = await web3Provider.getNetwork();

  if (chainId !== 5) { 
    window.alert("Please Connect to Goerli Network");
    throw new Error("Not Connected to Goerli");
  }

  if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
  }

  return web3Provider;
};

const connectWallet = async() => {
  try {
  // Get the provider from web3Modal, which in our case is MetaMask
  // When used for the first time, it prompts the user to connect their wallet
    await getProviderOrSigner();
    setWalletConnected(true);
  } catch(err) {
    console.error(err);
  }
};

useEffect(() => {
// if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  if(!walletConnected) {
  // Assign the Web3Modal class to the reference object by setting it's `current` value
  // The `current` value is persisted throughout as long as this page is open 
  web3ModalRef.current = new Web3Modal({
    network: "goerli",
    providerOptions: {},
    disableInjectedProvider: false,
  });
  connectWallet();
  getTotalTokensMinted();
  getBalanceOfDevTokens();
  getTokensToBeClaimed();
  getOwner();
  }
},[walletConnected]);


const renderButton = () => {
  if(loading) {
    return (
      <div>
        <button className={styles.button}> Loading.. </button>
      </div>
    );
  }
  if(tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Dev Tokens are available for claiming
          </div>
          <button className={styles.button} onClick={claimDevTokens}> 
           Claim Dev Tokens
          </button> 
        </div>
      );
  }
  // If user doesn't have any tokens to claim, show the mint button
  return (
    <div style={{display: "flex-col"}}>
      <div>
        <input 
        className={styles.input}
        type="number"
        placeholder="Enter amount to mint"
        // BigNumber.from converts the `e.target.value` to a BigNumber
        onChange={(e) => setAmountToMint(BigNumber.from(e.target.value))
        }
      />
      </div>
      <button className={styles.button}
      disabled={!(amountToMint > 0)}
      onClick={() => mintDevTokens(amountToMint)} >
        Mint Tokens
      </button>
    </div>
  )
}



  return (
    <div>
      <Head>
        <title>AvantGards' ICO</title>
        <meta name="description" content="ICO-DApp" />  
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to AvantGards' ICO!</h1>
          <div className={styles.description}>
            claim/mint your Dev tokens here
          </div>
          {walletConnected? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfDevTokens)} Dev Tokens
              </div>
              <div className={styles.description}>
              {/* Format Ether converts a BigNumber to string */ }
                Overall Mint status : {utils.formatEther(tokensMinted)}/10000 
              </div>
              {renderButton()}
              {isOwner? (
                <div>
                  {loading ? <button className={styles.button}>  Loading.. </button> 
                             : <button className={styles.button} onClick = {withdrawCoins}> Withdraw Coins </button>
                   
                  }
                </div>
              ) : ("")
              }
              </div>
              ) : (
              <button className={styles.button} onClick={connectWallet}> 
              Connect Wallet
              </button>
              )}

       </div>
       <div>
          <img className={styles.image} src="./0.svg" />
      </div>
      </div>
      <footer className={styles.footer}>
        Built with 🧡 by AvantGard
      </footer>
    </div>
  );
}
