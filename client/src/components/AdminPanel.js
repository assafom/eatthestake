import React, {useContext, useState} from "react";
import BlockchainContext from "../context/BlockchainContext";
import DisplayContext from "../context/DisplayContext";
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';



export default function AdminPanel() {
    const blockchainContext = useContext(BlockchainContext);
    const displayContext = useContext(DisplayContext);
    const { web3, accounts, stakerContract, rewardTokenContract } = blockchainContext;
    const {userDetails, getUserDetails, numberToFullDisplay, onInputNumberChange} = displayContext;

    const [inputAdminRewards, setInputAdminRewards] = useState('');
    const [inputAdminDuration, setInputAdminDuration] = useState('');

    async function addRewards() {
        let amount = inputAdminRewards * 10**18;
        let days = inputAdminDuration;
        const txResult = await rewardTokenContract.methods.approve(stakerContract.options.address, amount.toString()).send({ from: accounts[0] });
        const t = await stakerContract.methods.addRewards(amount.toString(), days).send({ from: accounts[0] });
        await getUserDetails();
    }

    return (
        <>
            <Container className="square inner-container">
                <br/>
                Admin :: Add {userDetails["rewSymbol"]} Rewards
                <hr/><br/>
                Amount<br/>
                <div className="label-above-button">
                Available {userDetails["rewSymbol"]} balance to transfer: {numberToFullDisplay(userDetails["rewardTokenBalance"])}
                </div>
                <div className="input-button-container">
                <Form.Control key="a1" placeholder="Amount" value={inputAdminRewards} onChange={(e) => {onInputNumberChange(e, setInputAdminRewards)}}/>
                </div>         
                <br/><hr/><br/>
                Duration (in days)
                <br/>
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