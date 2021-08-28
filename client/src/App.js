import React, { useState, useEffect } from "react";
import StakerContract from "./contracts/Staker.json";
import ERC20FactoryContract from "./contracts/ERC20Factory.json";
import MockERC20Contract from "./contracts/MockERC20.json";
import getWeb3 from "./getWeb3";
import BlockchainContext from "./BlockchainContext.js";
import ChildComponent from "./ChildComponent";

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';



import "./App.css";

//function App =() => {
function App() {
  const [storageValue, setStorageValue] = useState(undefined);
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [stakerContract, setStakerContract] = useState(undefined);

  const [erc20Factory, setErc20Factory] = useState(undefined);

  const [campaigns, setCampaigns] = useState([]);

  const [tokenBalances, setTokenBalances] = useState([]);

  const [buyTokensInput, setBuyTokensInput] = useState({});
  const [owner, setOwner] = useState(undefined);

  const TOKENDECIMALS = 18;

  useEffect(() => {
    (async () => {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
  
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

        console.log(instance);
        console.log(erc20Factoryinstance);

        //console.log("FACTORY " + erc20Factoryinstance.methods);
        //console.log(erc20FactoryDeployedNetwork.address);
  
        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.
        setWeb3(web3);
        setAccounts(accounts);
        setStakerContract(instance);
        setErc20Factory(erc20Factoryinstance);
        setOwner(await instance.methods.owner().call({ from: accounts[0] }));

        window.ethereum.on('accountsChanged', function (_accounts) {
          setAccounts(_accounts);
        });
          
      } catch (error) {
        // Catch any errors for any of the above operations.
        // TODO switch network is here i think
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    })();

  },[]);

  useEffect(() => {
    const load = async() => { 
      await getTokensBalance();
      console.log(campaigns);
    }

    if (typeof web3 !== 'undefined'
      && typeof accounts !== 'undefined'
      && typeof stakerContract !== 'undefined'
      && typeof erc20Factory !== 'undefined') {
        load();
      }
  }, [web3, accounts, stakerContract, erc20Factory])

  async function buyPresale(_cId) {
    const amount = new web3.utils.toBN(buyTokensInput[_cId]).mul(new web3.utils.toBN(campaigns[_cId].price));
    const tokens = (await erc20Factory.methods.getTokens().call({ from: accounts[0] }));
    const usdtContract = new web3.eth.Contract(MockERC20Contract.abi, tokens[0]);
    // Make sure user can still buy; check balance and presale still on
    // TODO check if amount > 0
    const txResult = await usdtContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
    const t = await stakerContract.methods.buy(_cId, buyTokensInput[_cId]).send({ from: accounts[0] });
    await getCampaignsData();
    await getTokensBalance();
  }

  async function getCampaignsData() {
    /*const numCampaigns = await stakerContract.methods.numCampaigns().call({ from: accounts[0] });
    const campaigns = [];
    for (let i = 0; i < numCampaigns; i ++) {
      let c = await getUserCampaignData(i);
      campaigns.push(c);
    }
    setCampaigns(campaigns);
    console.log(campaigns);*/
  }

  async function getUserCampaignData(cId) {
    const campaignData = await stakerContract.methods.getFrontendView(cId).call({ from: accounts[0] });
    const tokenPrice = campaignData["_price"];
    const userBought = campaignData["_userBought"];
    const name = campaignData["_name"];
    const presaleEnabled = campaignData["_presaleEnabled"];
    const totalBought = campaignData["_totalBought"];

    const campaign = {id: cId, name: name, bought: userBought, total: totalBought, price: tokenPrice, presaleEnabled: presaleEnabled  };
    if (!presaleEnabled) {
      const released = campaignData["_released"];
      // TODO what happens if too big?
      // TODO need to use BN for everything?
      let percentageReleased = totalBought === "0" ? 0 :  (released / totalBought / campaignData["_decimals"] * 100).toFixed(2);
      campaign["percentageReleased"] = percentageReleased + "%";
      campaign["claimed"] = (campaignData["_claimed"] / campaignData["_decimals"]).toFixed(2);
      campaign["unclaimed"] = (campaignData["_unclaimed"] / campaignData["_decimals"]).toFixed(2);
    }
    return campaign;
  }

  async function Temp() {
    const cId = 0;
    console.log(stakerContract);
    const res = await stakerContract.methods.numCampaigns().call({ from: accounts[0] });
    console.log(res);
    console.log(owner);
    console.log(accounts[0]);
   
    /*const totalBought = await stakerContract.methods.getPoolTotalAllocation(cId).call({ from: accounts[0] });
    const name = await stakerContract.methods.getCampaignName(cId).call();
    const campaign = {id: cId, name: name, bought: userBought, total: totalBought };
    setCampaigns([campaign]);
    console.log(campaigns);
    //setStorageValue(name);
    console.log(erc20Factory);
    const tokens = (await erc20Factory.methods.getTokens().call({ from: accounts[0] }));
    const usdt = tokens[0];
    const usdtContract = new web3.eth.Contract(MockERC20Contract.abi, tokens[0]);
    console.log("BAL");
    // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    //console.log(await usdtContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] }));*/
  }

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

  async function endPresale(cId) {
    const tokens = (await erc20Factory.methods.getTokens().call({ from: accounts[0] }));
    const tokContract = new web3.eth.Contract(MockERC20Contract.abi, tokens[cId+1]);
    await stakerContract.methods.endPresale(cId).send({ from: accounts[0] });
    await stakerContract.methods.setCampaignToken(cId, tokens[cId+1], 420).send({ from: accounts[0] });
    
    const myBalance = await tokContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] });
    await tokContract.methods.transfer(stakerContract.options.address, "5000000000000000000").send({ from: accounts[0] });

    getTokensBalance();
    getCampaignsData();
  }

  async function addCamapign() {
    const name = prompt("enter name");
    const price = prompt("enter price per token");
    await stakerContract.methods.addCampaign(name, price).send({ from: accounts[0] });

    getCampaignsData();
  }

  async function  onlyNumbers(_cId,event) {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
    //console.log(event);
    //buyTokensInput[_cId] = event.target.value;
    //setBuyTokensInput(buyTokensInput);
  }

  async function  changeBuyTokensAmount(_cId,event) {
    buyTokensInput[_cId] = event.target.value;
    setBuyTokensInput(buyTokensInput);
  }

  async function userClaim(cId) {
    await stakerContract.methods.claim(cId).send({ from: accounts[0] });

    getTokensBalance();
    getCampaignsData();
  }

  async function deposit(_amount) {
    let amount = web3.utils.toWei("10");
    let depositTokenAddr = await stakerContract.methods.depositToken().call({ from: accounts[0] });
    const depositContract = new web3.eth.Contract(MockERC20Contract.abi, depositTokenAddr);
    const txResult = await depositContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
    const t = await stakerContract.methods.deposit(amount).send({ from: accounts[0] });
    await getTokensBalance();
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
    await getTokensBalance();
  }

  async function withdraw(_amount) {
    let amount = web3.utils.toWei("10");
    const t = await stakerContract.methods.withdraw(amount).send({ from: accounts[0] });
    await getTokensBalance();
  }

  async function addRewards(_amount) {
    let amount = web3.utils.toWei("10");
    let days = 15;
    let rewardTokenAddr = await stakerContract.methods.rewardToken().call({ from: accounts[0] });
    const rewardContract = new web3.eth.Contract(MockERC20Contract.abi, rewardTokenAddr);
    const txResult = await rewardContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
    const t = await stakerContract.methods.addRewards(amount, days).send({ from: accounts[0] });
    await getTokensBalance();
  }


  const CampaignDetails = () => (
    <>
        <div class="center-elements campaigns">
          {(campaigns && campaigns.length>0)?campaigns.map((element) => (
            <Card key={element["id"]} border="secondary">
              <Card.Title>Campaign: {element["name"]}</Card.Title><br/>
              {!element["presaleEnabled"]?(
                <>
                  <CardKeyValue label="Your bought tokens" value={element["bought"]} />
                  <CardKeyValue label="Released" value={element["percentageReleased"]} />
                  <CardKeyValue label="Claimed" value={element["claimed"]} />
                  <CardKeyValue label="Unclaimed" value={element["unclaimed"]} />
                  <Button onClick={() => userClaim(element["id"])} variant="primary" disabled={element["unclaimed"]==0}>Claim</Button>
                </>):(
                  <>
                    <CardKeyValue label="Price per token" value={(element["price"] / 10**TOKENDECIMALS) + "USDT"} />
                    <CardKeyValue label="Your bought tokens" value={element["bought"]} />
                    <CardKeyValue label="Total bought tokens (dev)" value={element["total"]} />
                    <div className="card-buy-tokens">
                      <div>
                      <Form.Control placeholder="Amount to buy" onChange={(e) => changeBuyTokensAmount(element["id"],e)}/>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                      <Button onClick={() => buyPresale(element["id"])} variant="primary">Buy tokens</Button>
                      </div>
                    </div>
                    {owner.toLowerCase()==accounts[0].toLowerCase()?<><br/><Button onClick={() => endPresale(element["id"])} variant="primary">End presale</Button></>:undefined}
                    
                  </>)}
            </Card>
          )): '-'}
        </div>
    </>
  );

  const CardKeyValue = (props) => (
    <>
      <div style={{ display: 'flex' }}>
        <div>
          {props.label}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {props.value}
        </div>
      </div><br/>
    </>
  );

  const Nav = () => (
    <>
    <Navbar bg="dark" variant="dark">
    <Container>
      <Navbar.Brand>
        <img
          alt=""
          src={require('./logo.png')}
          width="410"
          height="40"
          className="d-inline-block align-top"
        />{' '}
          <div className="navbar-text">
            
          </div>
          </Navbar.Brand>
        </Container>
      </Navbar>
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
    return <div>Loading Web3, accounts, and contract...</div>;
  }
  return (
    <div className="outerApp">
      <Nav />
      <div className="App">
        <BlockchainContext.Provider value={{web3, accounts, stakerContract}}>
          
          <br/><br/>
          <div style={{display: "flex"}}>
            <Container className="square inner-container">
              <br/><br/>  
              <h2>Stake</h2>
              Current reward period:
              <br/><br/><br/>
              <div className="input-button-container">
                <div>
                <Form.Control placeholder="Amount to stake" onChange={(e) => changeBuyTokensAmount(1,e)}/>
                </div>
                <div>
                <Button onClick={() => buyPresale(1)} variant="secondary">Stake</Button>
                </div>
              </div>
              <br/>
              <br/>
            </Container>
          </div>
          <div>
            <hr />
            Loaded ETH address: <b>{accounts && accounts[0]?accounts[0] : undefined}</b><br/>
            Loaded Staker address: <b>{stakerContract?stakerContract.options.address : undefined}</b><br/><br/>

            <b>Dev dashboard</b><br/><br/>
            <Button onClick={getCampaignsData} variant="secondary">Update campaigns manually</Button>{' '}
            <Button onClick={getTokensBalance} variant="secondary">Get Tokens Balance</Button>{' '}
            <Button onClick={deposit} variant="secondary">Deposit</Button>{' '}
            <Button onClick={withdraw} variant="secondary">Withdraw</Button>{' '}
            <Button onClick={addRewards} variant="secondary">Add rewards</Button>{' '}
            <Button onClick={getTimes} variant="secondary">Times</Button>{' '}
            <br /><br />
            {(tokenBalances && tokenBalances.length>0)?<BalancesTable /> : undefined}
          </div>
        </BlockchainContext.Provider>
      </div>
    </div>
    
  )
}

export default App;
