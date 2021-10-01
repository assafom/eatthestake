import React, { useState, useEffect } from "react";
import connectToWallet from "./getWeb3";

import StakerContract from "./contracts/Staker.json";
import ERC20ABI from "./ERC20ABI.json";
import BlockchainContext from "./context/BlockchainContext.js";
import DisplayContext from "./context/DisplayContext.js";

import NavBar from "./components/NavBar";
import AdminPanel from "./components/AdminPanel";
import UserPanel from "./components/UserPanel";

import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'

import "./App.css";

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [stakerContract, setStakerContract] = useState(undefined);
  const [depositTokenContract, setDepositTokenContract] = useState(undefined);
  const [rewardTokenContract, setRewardTokenContract] = useState(undefined);

  const [userDetails, setUserDetails] = useState({});
  const [owner, setOwner] = useState(undefined);

  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [isConnectingToWallet, setIsConnectingToWallet] = useState(false);

  useEffect(() => {
    (async () => {
      setIsGlobalLoading(false);
      /*window.addEventListener("load", async () => {
        try {
        }
        catch(e) {

        }
      });*/
    })();

  },[]);


  async function initConnection() {
    try {
      // Get network provider and web3 instance.
      setIsConnectingToWallet(true);
      const web3 = await connectToWallet();

      setIsGlobalLoading(true);
      // Use web3 to get the user's accounts.
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      // Get the contract instance.
      const networkId = await window.ethereum.request({ method: 'net_version' });
      const deployedNetwork = StakerContract.networks[networkId];
      const instance = new web3.eth.Contract(
        StakerContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const depositTokenAddr = await instance.methods.depositToken().call({ from: accounts[0] });
      const depositContract = new web3.eth.Contract(ERC20ABI, depositTokenAddr);

      const rewardTokenAddr = await instance.methods.rewardToken().call({ from: accounts[0] });
      const rewardContract = new web3.eth.Contract(ERC20ABI, rewardTokenAddr);

      setWeb3(web3);
      setOwner(await instance.methods.owner().call({ from: accounts[0] }));
      setAccounts(accounts);
      setStakerContract(instance);
      setDepositTokenContract(depositContract);
      setRewardTokenContract(rewardContract);

      window.ethereum.on('accountsChanged', function (_accounts) {
        if (_accounts.length === 0) {
          setAccounts(undefined);
          setWeb3(undefined);
        }
        else {
          setAccounts(_accounts);
        }
      });
        
    } catch (error) {
      // Catch any errors for any of the above operations.
      if (error.code === 4001) {
        // User denied access to wallet
        return;
      }
      if (error.toString().includes("This contract object doesn't have address set yet")) {
        toast.error("Error: can't load contract. Are you on the right network?");
        console.error(error);
        return;
      }
      alert("Error: can't load web3 connection. Please check console.");
      console.error(error);

    } finally {
      setIsGlobalLoading(false);
      setIsConnectingToWallet(false);
    }
  }
  

  useEffect(() => {
    const load = async() => { 
      await refreshUserDetails();
    }

    if (typeof web3 !== 'undefined'
      && typeof accounts !== 'undefined'
      && typeof stakerContract !== 'undefined'
      && typeof depositTokenContract !== 'undefined'
      && typeof rewardTokenContract !== 'undefined') {
        load();
      }
  }, [web3, accounts, stakerContract, depositTokenContract, rewardTokenContract]) // eslint-disable-line react-hooks/exhaustive-deps


  async function refreshUserDetails() {
    setIsGlobalLoading(true);
    let res = await stakerContract.methods.getFrontendView().call({ from: accounts[0] });
    let depBalance = await depositTokenContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] });
    let rewardBalance = await rewardTokenContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] });
    let depSymbol = await depositTokenContract.methods.symbol().call({ from: accounts[0] });
    let rewSymbol = await rewardTokenContract.methods.symbol().call({ from: accounts[0] });

    let parsed = {
      rewardPerDay: (res["_rewardPerSecond"]*24*60*60/(10**18))
      , daysLeft: (res["_secondsLeft"]/60/60/24)
      , deposited: web3.utils.fromWei(res["_deposited"])
      , pending: web3.utils.fromWei(res["_pending"])
      , depositTokenBalance: web3.utils.fromWei(depBalance)
      , rewardTokenBalance: web3.utils.fromWei(rewardBalance)
      , depSymbol: depSymbol
      , rewSymbol: rewSymbol }

    setUserDetails(parsed);
    setIsGlobalLoading(false);
  }

  function onInputNumberChange(e, f) {
    const re = new RegExp('^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$')
    if (e.target.value === '' || re.test(e.target.value)) {
      f(e.target.value);
    }
  }

  function isNonZeroNumber(_input) {
    return _input !== undefined && _input !== "" && parseFloat(_input) !== 0.0;
  }

  const MainView = () => (
    <>
        <br/>
        <div style={{display: 'flex'}}>
          <UserPanel />
          {(accounts && accounts[0].toLowerCase() === owner.toLowerCase())? <AdminPanel /> : undefined}
        </div>
    </>
  );

  const MainViewOrConnectView = () => (
    <>
      {web3? <MainView /> : <div><br/><Button onClick={initConnection} disabled={isConnectingToWallet} >Connect</Button></div> }
    </>
  )



  const LoadingView = () => (
    <>
      <br/>
      Loading...
      <br/><br/>
      <Spinner animation="border" variant="light" />

    </>
  )

  return (
    <div className="outerApp">
      <BlockchainContext.Provider value={{web3, accounts, stakerContract, rewardTokenContract, depositTokenContract}}>
      <DisplayContext.Provider value={{userDetails, refreshUserDetails, onInputNumberChange, isNonZeroNumber, toast}}>
        <NavBar />
        <div className="App">
          {isGlobalLoading? <LoadingView/> : <MainViewOrConnectView/> }

        </div>
            <br></br>
            <br></br>
        <div className="row">
            <div className="col-sm px-md-5">
              <coingecko-coin-ticker-widget currency="usd" coin-id="medooza-ecosystem" locale="en">
              </coingecko-coin-ticker-widget>
            </div>
        </div>    
            <br></br>
            <br></br>
        <div className="row">
            <div className="col-sm px-md-5">
           <iframe width="100%" height="350px" border="0" className="embed-responsive-item" src="https://info.honeyswap.org/token/0xbab3cbdcbcc578445480a79ed80269c50bb5b718#/token/0xbab3cbdcbcc578445480a79ed80269c50bb5b718" allowFullScreen></iframe>
            </div>  
        </div>

      </DisplayContext.Provider>
      </BlockchainContext.Provider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        transition={Slide}
      />
    </div>
    
  )
}

export default App;
