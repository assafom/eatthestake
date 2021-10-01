import React, {useContext} from "react";

import BlockchainContext from "../context/BlockchainContext";
import Button from 'react-bootstrap/Button';

const tokenAddress = '0xbAb3cbDcBCc578445480a79ed80269C50bB5B718';
const tokenSymbol = 'MDZA';
const tokenDecimals = 18;
const tokenImage = 'https://etherscan.io/token/images/medooza_28.png';

  async function addtokentoWallet() {
    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded =await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });

      if (wasAdded) {
        console.log('Thanks for your interest!');
      } else {
        console.log('Your loss!');
      }
    } catch (error) {
      console.log(error);
    }
  }

export default function NavBar() {
    const blockchainContext = useContext(BlockchainContext);
    const { web3, accounts } = blockchainContext;

    const AddressView = () => (
        <>
            Connected: {accounts? accounts[0].substring(0,6) : undefined}...{accounts? accounts[0].substring(accounts[0].length-4,accounts[0].length) : undefined}
        </>
    )

    const TokenToWalletView = () => (
        <>
        {<div><Button onClick={addtokentoWallet}  >Add token to Wallet</Button></div> }
        </>
    )

    return (
        <>
            <div className="minimalistic-nav-bar">
                <div>
                <img
                    alt=""
                    src={require('../logo.png')}
                    width="300px"
                    height="27px"
                    className="d-inline-block align-top"
                />
                </div>
                <div>
                MEDOOZA ECCOSYSTEM STAKE
                </div>
                <div>

               {web3? <AddressView />: 'Not connected'}
                </div>
                <div>
               <TokenToWalletView/> 
                </div>
            </div>
        </>
    )
}