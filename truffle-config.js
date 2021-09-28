const path = require("path");
require('dotenv').config();

const HDWalletProvider = require("@truffle/hdwallet-provider");
// var HDWalletProvider = require("truffle-hdwallet-provider");


module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      network_id: "*",
      host: "127.0.0.1",
      port: 8545
    },
    ganache: {
      network_id: "5777",
      host: "127.0.0.1",
      port: 8545
    },  
    xdai: {
      provider: function() {
            return new HDWalletProvider(
            process.env.MNEMONIC,
            "https://dai.poa.network")
      },
      network_id: 100,
      gas: 500000,
      gasPrice: 1000000000
    },   
  sokol: {
    provider: function() {
          return new HDWalletProvider(
            process.env.MNEMONIC,
            "https://sokol.poa.network")
    },
    network_id: 77,
    gas: 6000000,
    gasPrice: 20000000000 // 20 Gwey
    }        
  },

  compilers: {
    solc: {
      version: "0.7.6"
    }
  },
};
