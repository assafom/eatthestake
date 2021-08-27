var Prisale = artifacts.require("./Prisale.sol");
var fs = require('fs'); 
const path = require('path');
const csv=require('csvtojson')

module.exports = async function(callback) {
    const address = '0x665496920D105c10Dfa69836a14a89341899aCFd';
    const prisale = await Prisale.deployed();
    console.log("assaf " + prisale.address);
    console.log(await prisale.owner());
    bytes16 = "0x0000000000000002EdA98aB9e5a1E853EA7aE3CDf15B2e6d6Ed3F455000000000000000a0000000000000000";
    bytes32 = "0x00000000000000000000000000000002EdA98aB9e5a1E853EA7aE3CDf15B2e6d6Ed3F4550000000000000000000000000000000a00000000000000000000000000000000";

    const res = (await prisale.getAddPreviousPurchase(bytes32));
    console.log(res[0].toString());
    console.log(res[1].toString());
    console.log(res[2].toString());
  }