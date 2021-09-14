import React, {useContext, useState} from "react";

import BlockchainContext from "../context/BlockchainContext";
import DisplayContext from "../context/DisplayContext";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';



export default function AdminPanel() {
    const blockchainContext = useContext(BlockchainContext);
    const displayContext = useContext(DisplayContext);
    const { web3, accounts, stakerContract, rewardTokenContract } = blockchainContext;
    const {userDetails, refreshUserDetails, onInputNumberChange, isNonZeroNumber, toast} = displayContext;

    const [inputAdminRewards, setInputAdminRewards] = useState('');
    const [inputAdminDuration, setInputAdminDuration] = useState('');

    async function addRewards() {
        if (userDetails["daysLeft"] !== 0.) {
            toast.info("Can't add rewards in middle of campaign. Please wait for campaign to finish.");
            return;
        }
        if (!(isNonZeroNumber(inputAdminRewards) && isNonZeroNumber(inputAdminDuration))) {
            toast.info('Please add missing input.');
            return;
        }
        if (parseFloat(inputAdminRewards) > parseFloat(userDetails["rewardTokenBalance"])) {
            toast.error("Not enough balance.");
            return;
        }
        toast.dismiss();
        let amount = web3.utils.toWei(inputAdminRewards);
        let days = inputAdminDuration;
        try {
            toast.info('Please approve transaction 1 of 2 (allowance)...', {position: 'top-left', autoClose: false});
            await rewardTokenContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
            toast.dismiss();
            toast.info('Please approve transaction 2 of 2 (add rewards)...', {position: 'top-left', autoClose: false});
            await stakerContract.methods.addRewards(amount.toString(), days).send({ from: accounts[0] });
        } finally {
            toast.dismiss();
        }
        
        await refreshUserDetails();
    }

    return (
        <>
            <Container className="square inner-container">
                <br/>
                Admin :: Add {userDetails["rewSymbol"]} Rewards
                <hr/>

                <br/>Amount<br/>
                <div className="label-above-button">
                    Available {userDetails["rewSymbol"]} balance to transfer: {userDetails["rewardTokenBalance"]}
                </div>
                <div className="input-button-container">
                    <Form.Control key="a1" placeholder="Amount" value={inputAdminRewards} onChange={(e) => {onInputNumberChange(e, setInputAdminRewards)}}/>
                </div>         
                <br/><hr/>

                <br/>Duration (in days)<br/>
                <div className="input-button-container">
                    <Form.Control placeholder="Days" value={inputAdminDuration} onChange={(e) => {onInputNumberChange(e, setInputAdminDuration)}}/>
                </div>
                <br/><hr/>

                <div className="button-stretch">
                    <br/><Button onClick={addRewards} variant="secondary">Add</Button><br/>
                </div>
                <br/>
            </Container>
        </>
    )
}