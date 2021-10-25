[![ci](https://github.com/assafom/eatthestake/actions/workflows/build.yaml/badge.svg)](https://github.com/assafom/eatthestake/actions/workflows/build.yaml)

# Eat The Stake
Staking DApp for [Eat The Blocks Projects #2](https://github.com/jklepatch/eattheblocks/tree/master/etb-projects/project2-staking).

![screenshot](screenshot.png)

## Install
1. Install truffle/contract dependencies:
```
yarn install
```
2. Install client:
```
cd client
yarn install
```

## Unit tests
```
truffle test
```

## Run
1. Run ganache:
```
ganache-cli
```
2. Deploy contracts:
```
truffle migrate --reset
```
3. Start front end:
```
cd client
yarn start
```
4. If you'd like to pass 15 days in your Ganache blockchain, execute the following 2 lines at truffle console:
```
timestamp = (await web3.eth.getBlock(await await web3.eth.getBlockNumber()))['timestamp']
advancetime = new Promise((resolve,reject) => { web3.currentProvider.send({jsonrpc:'2.0', method: 'evm_mine', params: [timestamp+60*60*24*15], id: timestamp}, (err, result) => { if (err) { return reject(err) } return resolve(result); }) })
```

## Known issues/limitations
- The DApp was designed for ETB token and Pancakeswap LP tokens. So it only supports 18 decimal tokens, and no support for tokens with fee on transfer and other esoterica.
- For some reason, when running the unit tests, truffle takes around 1:30 minutes before it even reaches the initial compilation stage. I'm not sure if it's a local error or something with Truffle. Anyway, this does not happen when running deployment.
- In the truffle tests it is tricky to test for balances, as we are calculating based on seconds and sometimes there is 1-3 seconds of delay. [See here Gotacha#2](https://medium.com/fluidity/standing-the-time-of-test-b906fcc374a9) for explanation. To combat this, when testing time sensitive functions, I allow the actual result to be within 3 (monetary unit allocated per second) error of margin from the expected result.
- client/src/contracts (truffle build directory) is committed to the repository for the CI workflow.

## Misc
- The contract is based upon SushiSwap's MasterChef.
- In the development network, the contract deploys 2 mock ERC20 contracts and mints tokens for the first Ganache accounts, for testing. The first account will be the owner who is allowed to add rewards, and the next 2 accounts can be used for staking and testing. These contracts (ERC20Factory and MockERC20) will not be deployed to networks other than local dev networks.

## Audit
Doc: https://mythx-cli.readthedocs.io/en/latest/
Audit file: [Audit file](audit/ce997d5316543b369ede443c.pdf)

## CI
Ci script located at `.github/workflows/build.yaml`
The script test whole project `backend` and `client` on different node versions.   
Test deployment - installing necessary packages including `ganache-cli` and deploy the project to `development` local ganache network while the contract artifact's 
stored to `client/src/contracts` directory.
If that succeeds, basic client coverage tests  is triggered.
```

 PASS  src/App.test.js (7.609s)
  √ renders without crashing (89ms)

--------------------------|----------|----------|----------|----------|-------------------|
File                      |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
--------------------------|----------|----------|----------|----------|-------------------|
All files                 |    10.53 |     3.77 |    12.77 |    10.53 |                   |
 src                      |       16 |     4.41 |    17.24 |       16 |                   |
  App.js                  |    28.57 |       10 |    38.46 |    28.57 |... 51,156,160,170 |
  getWeb3.js              |        0 |        0 |        0 |        0 |... 23,27,30,31,32 |
  index.js                |        0 |      100 |      100 |        0 |              7,12 |
  serviceWorker.js        |        0 |        0 |        0 |        0 |... 23,130,131,132 |
 src/components           |     4.44 |     3.33 |     6.25 |     4.44 |                   |
  AdminPanel.js           |        0 |        0 |        0 |        0 |... 44,47,50,62,68 |
  NavBar.js               |       80 |    16.67 |       50 |       80 |                11 |
  UserPanel.js            |        0 |        0 |        0 |        0 |... 13,119,134,150 |
 src/components/UserPanel |        0 |        0 |        0 |        0 |                   |
  TimeLeftField.js        |        0 |        0 |        0 |        0 |... 19,20,21,22,25 |
 src/context              |        0 |        0 |        0 |        0 |                   |
  BlockchainContext.js    |        0 |        0 |        0 |        0 |                   |
  DisplayContext.js       |        0 |        0 |        0 |        0 |                   |
--------------------------|----------|----------|----------|----------|-------------------|
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        12.81s
Ran all test suites.
```
