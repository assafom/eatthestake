import React, {useContext, useState} from "react";
import BlockchainContext from "../context/BlockchainContext";

import DisplayContext from "../context/DisplayContext";

import TimeLeftField from "./UserPanel/TimeLeftField";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';



export default function UserPanel() {
    const blockchainContext = useContext(BlockchainContext);
    const displayContext = useContext(DisplayContext);
    const { web3, accounts, stakerContract, depositTokenContract } = blockchainContext;
    const {userDetails, refreshUserDetails, onInputNumberChange, toast} = displayContext;

    const [inputStake, setInputStake] = useState('');
    const [inputUnstake, setInputUnstake] = useState('');

    async function deposit() {
        if (inputStake == 0) {
            toast.error('No amount entered.');
            return;
        }
        if (inputStake > userDetails["depositTokenBalance"]) {
            toast.error("Not enough balance.");
            return;
        }
        toast.dismiss();
        let amount = web3.utils.toWei(inputStake.toString());
        try {
            toast.info('Please approve transaction 1 of 2 (allowance)...', {position: 'top-left', autoClose: false});
            await depositTokenContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
            toast.dismiss();
            toast.info('Please approve transaction 2 of 2 (staking)...', {position: 'top-left', autoClose: false});
            await stakerContract.methods.deposit(amount).send({ from: accounts[0] });
        } finally {
            toast.dismiss();
        }
        setInputStake("");
        await refreshUserDetails();
    }
    
      
    async function withdraw() {
        if (inputUnstake == 0) {
            toast.error('No amount entered.');
            return;
        }
        if (inputUnstake > userDetails["deposited"]) {
            toast.error("Can't unstake more than staked.");
            return;
        }
        toast.dismiss();
        let amount = web3.utils.toWei(inputUnstake.toString());
        toast.info('Please approve transaction...', {position: 'top-left', autoClose: false});
        try {
            await stakerContract.methods.withdraw(amount).send({ from: accounts[0] });
        } finally {
            toast.dismiss();
        }
        setInputUnstake("");
        await refreshUserDetails();
    }
    
    async function claim() {
        toast.dismiss();
        toast.info('Please approve transaction...', {position: 'top-left', autoClose: false});
        try {
            await stakerContract.methods.claim().send({ from: accounts[0] });
        } finally {
            toast.dismiss();
        }
        await refreshUserDetails();
    }

    function numberToFixed(n) {
        if (n === undefined)
            return n;
        return parseFloat(n).toFixed(6);
    }
    

    const CardKeyValue = (props) => (
        <>
        <div className="card-key-value">
            <div>
            {props.label}
            </div>
            <div>
            {props.value}
            </div>
        </div><hr/>
        </>
    );

    const RewardsPhaseFinished = (props) => (
        <>
        <div className="two-line-label">
            <div>Staking reward period finished</div>
            <div>Please check back later for next phase</div>
        </div><hr/>
        </>
    );

    const RewardsPhaseActive = (props) => (
        <>
            <TimeLeftField />
            <CardKeyValue label="Global rewards per day" value={numberToFixed(userDetails["rewardPerDay"])} />
        </>
    );


    return (
        <>
            <Container className="square inner-container">
                <br/>
                {numberToFixed(userDetails["rewardPerDay"]) != 0? <RewardsPhaseActive /> : <RewardsPhaseFinished/>}
                <CardKeyValue label="Your staked" value={numberToFixed(userDetails["deposited"])} />
                <CardKeyValue label="Your pending rewards" value={numberToFixed(userDetails["pending"])} />
                

                <br/><br/>
                <div className="label-above-button">
                    Available {userDetails["depSymbol"]} balance to stake: {userDetails["depositTokenBalance"]}
                </div>
                <div className="input-button-container">
                    <div>
                        <Form.Control placeholder="Amount" value={inputStake} onChange={(e) => {onInputNumberChange(e, setInputStake)}}/>
                    </div>
                    <div>
                        <Button onClick={deposit} >Stake</Button>
                    </div>
                </div><br/>

                <div className="label-above-button">
                    {userDetails["depSymbol"]} staked: {userDetails["deposited"]}
                </div>
                <div className="input-button-container">
                    <div>
                        <Form.Control placeholder="Amount" value={inputUnstake} onChange={(e) => {onInputNumberChange(e, setInputUnstake)}}/>
                    </div>
                    <div>
                        <Button onClick={withdraw} >Unstake</Button>
                    </div>
                </div><br/>

                <div className="label-above-button">
                    Pending {userDetails["rewSymbol"]} rewards: {userDetails["pending"]}
                </div>
                <div className="button-stretch">
                    <Button onClick={claim} >Claim rewards</Button>
                </div>
                <br/>
                </Container>
        </>
    )
}