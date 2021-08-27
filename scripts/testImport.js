var Prisale = artifacts.require("./Prisale.sol");
var fs = require('fs'); 
const path = require('path');
const csv=require('csvtojson');
const Web3=require('Web3');

module.exports = async function(callback) {
    const address = '0x665496920D105c10Dfa69836a14a89341899aCFd';
    const prisale = await Prisale.deployed();

    // TODO ask how many lines needed and make sure can handle?
    const jsonArray=await csv().fromFile(__dirname+'/import.csv');

    console.log(">>> Starting sanity check.")
    badEntries = [];
    totalBought = {};
    for (let i = 0; i < jsonArray.length; i++) {
        row = jsonArray[i];
        console.log("   Checking address " + row["Address"] + " (" + (i+1).toString() + "/" + jsonArray.length.toString() + ")");
        userResult = await prisale.getUserCampaignDetails(row["Campaign"], row["Address"]);
        if (!(userResult["bought"].eq(Web3.utils.toBN(row["Total bought"])))
            || !(userResult["claimed"].eq(Web3.utils.toBN(row["Claimed so far"])))) {
                badEntries.push(row["Address"]);
        }
        if (row["Campaign"] in totalBought)
            totalBought[row["Campaign"]] = totalBought[row["Campaign"]].add(Web3.utils.toBN(row["Total bought"]));
        else
            totalBought[row["Campaign"]] = Web3.utils.toBN(row["Total bought"]);
    }
    console.log('>>> Sanity check finished.\n');
    if (badEntries.length > 0) {
        console.log('!!! Entries that are not updated on chain:');
        console.log(badEntries);
    } else {
        console.log("All entries updated correctly on chain.")
    }
    campaigns = Object.keys(totalBought);
    for (let i = 0; i < campaigns.length; i++) {
        contractTotalBought = await prisale.getPoolTotalAllocation(campaigns[i]);
        if (!(contractTotalBought.eq(totalBought[campaigns[i]]))) {
            console.log("!!! Campaign #" +  campaigns[i] + " total tokens bought is wrong.");
            console.log(contractTotalBought);
            console.log(totalBought[campaigns[i]]);
        } else {
            console.log("Campaign total bought tokens is set correctly.");
        }
    }
    process.exit(1); // Dunno why is needed but doesn't exit otherwise even tho finished
    
  }