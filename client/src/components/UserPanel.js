import React, {useContext, useState} from "react";
import BlockchainContext from "../context/BlockchainContext";
import DisplayContext from "../context/DisplayContext";
import TimeLeftField from "./UserPanel/TimeLeftField";
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';



export default function UserPanel() {
    const blockchainContext = useContext(BlockchainContext);
    const displayContext = useContext(DisplayContext);
    const { web3, accounts, stakerContract, rewardTokenContract, depositTokenContract } = blockchainContext;
    const {userDetails, getUserDetails, numberToFullDisplay, onInputNumberChange} = displayContext;

    const [inputStake, setInputStake] = useState('');
    const [inputUnstake, setInputUnstake] = useState('');

    async function deposit() {
        let amount = web3.utils.toWei(inputStake.toString());
        console.log(amount);
        const txResult = await depositTokenContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
        const t = await stakerContract.methods.deposit(amount).send({ from: accounts[0] });
        setInputStake("");
        await getUserDetails();
    }
    
      
    async function withdraw() {
        let amount = web3.utils.toWei(inputUnstake.toString());
        const t = await stakerContract.methods.withdraw(amount).send({ from: accounts[0] });
        setInputUnstake("");
        await getUserDetails();
    }
    
    async function claim() {
        const t = await stakerContract.methods.claim().send({ from: accounts[0] });
        await getUserDetails();
    }

    function numberToFixed(n) {
        if (n === undefined)
          return n;
        return n.toFixed(6);
      }
    

    const CardKeyValue = (props) => (
        <>
        <div style={{ display: 'flex' , width: '90%' , margin: 'auto' }}>
            <div>
            {props.label}
            </div>
            <div style={{ marginLeft: 'auto' }}>
            {props.value}
            </div>
        </div><hr/>
        </>
    );


    return (
        <>
            <Container className="square inner-container">
                <br/>
                {userDetails["daysLeft"] !== undefined? <TimeLeftField /> : undefined}

                <CardKeyValue label="Global rewards per day" value={numberToFixed(userDetails["rewardPerSecond"])} />
                
                <CardKeyValue label="Your staked" value={numberToFixed(userDetails["deposited"])} />
                <CardKeyValue label="Your pending rewards" value={numberToFixed(userDetails["pending"])} />
                

                <br/><br/>
                <div className="label-above-button">
                    Available {userDetails["depSymbol"]} balance to stake: {numberToFullDisplay(userDetails["depositTokenBalance"])}
                </div>
                <div className="input-button-container">
                    <div>
                    <Form.Control placeholder="Amount" value={inputStake} onChange={(e) => {onInputNumberChange(e, setInputStake)}}/>
                    </div>
                    <div>
                    <Button onClick={deposit} variant="secondary">Stake</Button>
                    </div>
                </div><br/>
                <div className="label-above-button">
                    {userDetails["depSymbol"]} staked: {numberToFullDisplay(userDetails["deposited"])}
                </div>
                <div className="input-button-container">
                    <div>
                    <Form.Control placeholder="Amount" value={inputUnstake} onChange={(e) => {onInputNumberChange(e, setInputUnstake)}}/>
                    </div>
                    <div>
                    <Button onClick={withdraw} variant="secondary">Unstake</Button>
                    </div>
                </div><br/>
                <div className="label-above-button">
                    Pending {userDetails["rewSymbol"]} rewards: {numberToFullDisplay(userDetails["pending"])}
                </div>
                <div className="button-stretch">
                    <Button onClick={claim} variant="secondary">Claim rewards</Button>
                </div>
                <br/>
                </Container>
        </>
    )
}