var Prisale = artifacts.require("./Prisale.sol");
var fs = require('fs'); 
const path = require('path');
const csv=require('csvtojson');
const Web3=require('Web3');


module.exports = async function(callback) {
    const prisale = await Prisale.deployed();

    // TODO ask how many lines needed and make sure can handle
    // TODO Empty cell in the end gives problem - change to zero at csv level?
    const jsonArray=await csv().fromFile(__dirname+'/import.csv');
    const campaigns = [];
    const bought = [];
    const claimed = [];
    const addr = [];
    let totalBought = {};
    console.log(">>> Reading import file.")
    for (let i = 0; i < jsonArray.length; i++) {
        row = jsonArray[i];
        console.log("   Processing address: " + row["Address"] + " (" + (i+1).toString() + "/" + jsonArray.length.toString() + ")");
        campaigns.push(row["Campaign"]);
        bought.push(row["Total bought"]);
        claimed.push(row["Claimed so far"]);
        addr.push(row["Address"]);
        if (row["Campaign"] in totalBought)
            totalBought[row["Campaign"]].iadd(Web3.utils.toBN(row["Total bought"]));
        else
            totalBought[row["Campaign"]] = Web3.utils.toBN(row["Total bought"]);
    }
    console.log("\n>>> Importing data to chain...")
    console.log(await prisale.addPreviousPurchase(campaigns, addr, bought, claimed));
    let campaignKeys = Object.keys(totalBought);
    for (let i = 0; i < campaignKeys.length; i++) {
        await prisale.setTotalBought(campaignKeys[i], totalBought[campaignKeys[i]]);

        //await prisale.setTotalBought(campaignKeys[i], web3.utils.hexToNumberString(web3.utils.numberToHex(totalBought)));
    }
    console.log("\n>>> Done.")
    process.exit(1); // Dunno why is needed but doesn't exit otherwise even tho finished
    
  }