var Prisale = artifacts.require("./Prisale.sol");
var fs = require('fs'); 
const path = require('path');
const csv=require('csvtojson')

module.exports = async function(callback) {
    const address = '0x665496920D105c10Dfa69836a14a89341899aCFd';
    const prisale = await Prisale.deployed();
    console.log("assaf " + prisale.address);
    console.log(await prisale.owner());

    // TODO ask how many lines needed and make sure can handle
    const jsonArray=await csv().fromFile(__dirname+'/import.csv');
    for (let i = 0; i < jsonArray.length; i++) {
        row = jsonArray[i];
        console.log("process address: " + row["Address"]);
        console.log(await prisale.addPreviousPurchase(0, row["Total bought"], row["Claimed so far"], row["Address"]));
    }
    console.log('end upload');
    // Perform sanity - however, might need to wait until mined.
    for (let i = 0; i < jsonArray.length; i++) {
        row = jsonArray[i];
        console.log("here perform sanity for address: " + row["Address"]);
        //console.log(await prisale.addPreviousPurchase(0, row["Total bought"], row["Claimed so far"], row["Address"]));
    }
    // Also, update campaign total bought at this point.
    console.log('end sanity');
    process.exit(1); // Dunno why is needed but doesn't exit otherwise even tho finished
    
  }