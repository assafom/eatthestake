import React, {useContext} from "react";
import BlockchainContext from "./BlockchainContext";

export default function ChildComponent() {
    const blockchainContext = useContext(BlockchainContext);
    const { web3, accounts, contract } = blockchainContext;

    return null;
}