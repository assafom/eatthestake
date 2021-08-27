var Prisale = artifacts.require("./Prisale.sol");
var fs = require('fs'); 
const path = require('path');
const csv=require('csvtojson')
const Web3=require('Web3');

module.exports = async function(callback) {
    const address = '0x665496920D105c10Dfa69836a14a89341899aCFd';
    const address1 = '0xEdA98aB9e5a1E853EA7aE3CDf15B2e6d6Ed3F455';
    //const prisale = await Prisale.deployed();
    //console.log("assaf " + prisale.address);
    //console.log(await prisale.owner());

    //console.log(web3.utils.fromWei(web3.utils.toWei(web3.utils.toBN(1))));

    /*console.log(web3.providers.HttpProvider());
    let w = net web3(web3.providers.HttpProvider())
    console.log(web3.givenProvider);*/

    const a = Web3.utils.padLeft(Web3.utils.numberToHex(2),32);
    const b = '0xEdA98aB9e5a1E853EA7aE3CDf15B2e6d6Ed3F455';
    const c = Web3.utils.padLeft(Web3.utils.numberToHex(10),32);
    const d = Web3.utils.padLeft(Web3.utils.numberToHex(0),32);
    console.log(a);
    console.log(b);
    console.log(c);
    console.log(d);
    const data = a + b.slice(2) + c.slice(2) + d.slice(2);
    console.log(data);
    
  }