import React, { useState, useEffect } from "react";
//import getWeb3 from "./getWeb3";
import Web3 from "web3";

import StakerContract from "./contracts/Staker.json";
import ERC20FactoryContract from "./contracts/ERC20Factory.json";
import MockERC20Contract from "./contracts/MockERC20.json";

import BlockchainContext from "./context/BlockchainContext.js";
import DisplayContext from "./context/DisplayContext.js";

import AdminPanel from "./components/AdminPanel";
import UserPanel from "./components/UserPanel";

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import "./App.css";

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [stakerContract, setStakerContract] = useState(undefined);
  const [depositTokenContract, setDepositTokenContract] = useState(undefined);
  const [rewardTokenContract, setRewardTokenContract] = useState(undefined);
  const [erc20Factory, setErc20Factory] = useState(undefined);

  const [tokenBalances, setTokenBalances] = useState([]);

  const [userDetails, setUserDetails] = useState({});
  const [owner, setOwner] = useState(undefined);

  const TOKENDECIMALS = 18;


  useEffect(() => {
    (async () => {
      // SET TO LOADING
      window.addEventListener("load", async () => {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          initConnection();
        }
        catch(e) {

        }
      });
    })();

  },[]);


  async function connectToWallet() {
    if (window.ethereum) {
      //const web3 = new Web3(window.ethereum);
      const web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Accounts now exposed
        return(web3);
      } catch (error) {
        if (error.code === 4001) {
          alert("Please approve wallet connection if you wish to use the application.");
        }
        throw(error);
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      // Use Mist/MetaMask's provider.
      const web3 = window.web3;
      console.log("Injected web3 detected.");
      return(web3);
    }
    // Fallback to localhost; use dev console port by default...
    else {
      const provider = new Web3.providers.HttpProvider(
        "http://127.0.0.1:8545"
      );
      const web3 = new Web3(provider);
      console.log("No web3 instance injected, using Local web3.");
      return(web3);
    }
  }

  async function initConnection() {
    try {
      // Get network provider and web3 instance.
      const web3 = await connectToWallet();

      // Use web3 to get the user's accounts.
      //const accounts = await web3.eth.getAccounts();
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });


      // Get the contract instance.
      //const networkId = await web3.eth.net.getId();
      const networkId = await window.ethereum.request({ method: 'net_version' });
      const deployedNetwork = StakerContract.networks[networkId];
      const instance = new web3.eth.Contract(
        StakerContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const erc20FactoryDeployedNetwork = ERC20FactoryContract.networks[networkId];
      const erc20Factoryinstance = new web3.eth.Contract(
        ERC20FactoryContract.abi,
        erc20FactoryDeployedNetwork && erc20FactoryDeployedNetwork.address,
      );

      const depositTokenAddr = await instance.methods.depositToken().call({ from: accounts[0] });
      const depositContract = new web3.eth.Contract(MockERC20Contract.abi, depositTokenAddr);
      console.log("debug");
      console.log(depositContract);

      const rewardTokenAddr = await instance.methods.rewardToken().call({ from: accounts[0] });
      const rewardContract = new web3.eth.Contract(MockERC20Contract.abi, rewardTokenAddr);

      console.log(instance);
      console.log(erc20Factoryinstance);

      //console.log("FACTORY " + erc20Factoryinstance.methods);
      //console.log(erc20FactoryDeployedNetwork.address);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      setWeb3(web3);
      setOwner(await instance.methods.owner().call({ from: accounts[0] }));
      setAccounts(accounts);
      setStakerContract(instance);
      setErc20Factory(erc20Factoryinstance);
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
      // TODO switch network is here i think
      if (error.code === 4001)
        return;
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }
  

  useEffect(() => {
    const load = async() => { 
      await refreshUserDetails();
      await getTokensBalance();
    }

    if (typeof web3 !== 'undefined'
      && typeof accounts !== 'undefined'
      && typeof stakerContract !== 'undefined'
      && typeof erc20Factory !== 'undefined'
      && typeof depositTokenContract !== 'undefined'
      && typeof rewardTokenContract !== 'undefined') {
        load();
      }
  }, [web3, accounts, stakerContract, erc20Factory, depositTokenContract, rewardTokenContract])


  async function getTokensBalance() {
    const mockAccounts=["0x1d3d35F5A4065753F35bad06239cfB3ACc3a2454", "0xEdA98aB9e5a1E853EA7aE3CDf15B2e6d6Ed3F455", "0x2Ef668067FbA6215149715102EE0631e7333EcDD"];
    mockAccounts.push(stakerContract.options.address);
    const tokens = (await erc20Factory.methods.getTokens().call({ from: accounts[0] }));
    const tokenContracts = [];
    const balances = [["Address"]];
    for (let i = 0; i < tokens.length; i++) {
      const tokContract = new web3.eth.Contract(MockERC20Contract.abi, tokens[i]);
      tokenContracts.push(tokContract);
      const symbol = await tokContract.methods.symbol().call({ from: accounts[0] });
      balances[0].push(symbol + " balance");
    }
    balances[0].push("Pending reward");
    const accountBalances = [];
    for (let i = 0; i < mockAccounts.length; i++) {
      balances.push([mockAccounts[i]]);
      for (let j = 0; j < tokenContracts.length; j++) {
        const balance = await tokenContracts[j].methods.balanceOf(mockAccounts[i]).call({ from: accounts[0] });
        balances[i+1].push(balance);
      }
      balances[i+1].push(await stakerContract.methods.pendingRewards(mockAccounts[i]).call({ from: accounts[0] }));
    }
    console.log(balances);
    setTokenBalances(balances);
    //console.log(accountBalances);
  }


  async function getTimes(_amount) {
    let t = await stakerContract.methods.getTime().call({ from: accounts[0] });
    console.log(t);
    t = await stakerContract.methods.rewardPeriodEndTimestamp().call({ from: accounts[0] });
    console.log(t);
    t = await stakerContract.methods.lastRewardTimestamp().call({ from: accounts[0] });
    console.log(t);
    console.log(new Date().getTime());
    //await advanceTimeAndBlock(60*60*24*15);
    t = await stakerContract.methods.getTime().call({ from: accounts[0] });
    console.log(t);
    console.log("new");
    console.log(accounts[0].toLowerCase() === owner.toLowerCase());
    console.log(accounts[0]);
    console.log(owner);
    console.log(userDetails["secondsLeft"]);
    await getTokensBalance();
  }

  async function refreshUserDetails() {
    let res = await stakerContract.methods.getFrontendView().call({ from: accounts[0] });
    let depBalance = await depositTokenContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] });
    let rewardBalance = await rewardTokenContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] });
    let depSymbol = await depositTokenContract.methods.symbol().call({ from: accounts[0] });
    let rewSymbol = await rewardTokenContract.methods.symbol().call({ from: accounts[0] });

    let parsed = {
      rewardPerSecond: (res["_rewardPerSecond"]*24*60*60/(10**18))
      , daysLeft: (res["_secondsLeft"]/60/60/24)
      , deposited: (res["_deposited"]/10**18)
      , pending: (res["_pending"]/10**18)
      , depositTokenBalance: (depBalance/10**18)
      , rewardTokenBalance: (rewardBalance/10**18)
      , depSymbol: depSymbol
      , rewSymbol: rewSymbol }

    setUserDetails(parsed);
  }

  function onInputNumberChange(e, f) {
    const re = new RegExp('^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$')
    if (e.target.value === '' || re.test(e.target.value)) {
      f(e.target.value);
    }
  }

  function numberToFullDisplay(n) {
    if (n === undefined)
      return n;
    return n.toLocaleString('fullwide',{useGrouping:false,maximumFractionDigits:20})
  }

 



  const Nav2 = () => (
    <>
      <div className="minimalistic-nav-bar">
        <div>
          <img
            alt=""
            src={require('./logo.png')}
            width="300px"
            height="27px"
            className="d-inline-block align-top"
          />
        </div>
        <div>
          STAKE
        </div>
        <div>
          Connected: {accounts? accounts[0].substring(0,6) : undefined}...{accounts? accounts[0].substring(accounts[0].length-4,accounts[0].length) : undefined}
        </div>
      </div>
    </>
  )

  const BalancesTable = () => (
    <>
      <Table striped bordered hover size="sm" variant="dark">
        <thead>
          <tr>
            {tokenBalances[0].map((elem, index) => (
              <th key={index}>{elem}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokenBalances.slice(1).map((elem, index) =>
            <tr key={index}>
              {elem.map((item, index) => 
                <td key={index}>{item}</td>
              )}
            </tr>
          )}
        </tbody>

      </Table>
    </>
  );


  if (typeof web3 === 'undefined') {
    return (
    <>
      <div>
        <Button onClick={initConnection}>Connect</Button>
      </div>
    </>
    )
  }

  return (
    <div className="outerApp">
      <Nav2 />
      <div className="App">
        <BlockchainContext.Provider value={{web3, accounts, stakerContract, rewardTokenContract, depositTokenContract}}>
        <DisplayContext.Provider value={{userDetails, refreshUserDetails, numberToFullDisplay, onInputNumberChange}}>
          
          <br/>
          <div style={{display: 'flex'}}>
            <UserPanel />
            {(accounts && accounts[0].toLowerCase() == owner.toLowerCase())? <AdminPanel /> : undefined}
          </div>
          <div>
            <br/>
            <hr />
            <br/>
            Loaded ETH address: <b>{accounts && accounts[0]?accounts[0] : undefined}</b><br/>
            Loaded Staker address: <b>{stakerContract?stakerContract.options.address : undefined}</b><br/><br/>

            <b>Dev dashboard</b><br/><br/>
            <Button onClick={getTokensBalance} variant="secondary">Get Tokens Balance</Button>{' '}
            <Button onClick={getTimes} variant="secondary">Deets</Button>{' '}
            <br /><br />
            {(tokenBalances && tokenBalances.length>0)?<BalancesTable /> : undefined}
          </div>
        </DisplayContext.Provider>
        </BlockchainContext.Provider>
      </div>
    </div>
    
  )
}

export default App;
