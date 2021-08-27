var Prisale = artifacts.require("./Prisale.sol");
var fs = require('fs'); 
const path = require('path');
const csv=require('csvtojson')
const Web3=require('Web3');

module.exports = async function(callback) {
    const address = '0x665496920D105c10Dfa69836a14a89341899aCFd';
    //const prisale = await Prisale.deployed();
    //console.log("assaf " + prisale.address);
    //console.log(await prisale.owner());

    //console.log(web3.utils.fromWei(web3.utils.toWei(web3.utils.toBN(1))));

    /*console.log(web3.providers.HttpProvider());
    let w = net web3(web3.providers.HttpProvider())
    console.log(web3.givenProvider);*/

    const provider = new Web3.providers.HttpProvider(
        "http://127.0.0.1:8545"
      );
    let w = new Web3(Web3.providers.HttpProvider())
      //console.log(w.givenProvider);
      //console.log(w.eth);
      console.log(w.eth.givenProvider);
    
  }