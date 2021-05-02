# balance-history
Get accumulated user balance history over time for any erc20 token, same way binance calculates users' balance for launchpad on their platform

## Installation

### via npm

```sh
npm i --save @libertypie/erc20-balance-history
```

### via yarn

```sh
yarn add @libertypie/erc20-balance-history
```


## Usage

#### Create new seed file 
```js

const BalanceHistory = require('@libertypie/erc20-balance-history');

//lets get balance history using a timestamp
BalanceHistory.getBalanceHistory({
    contractAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // usdt
    userAddress: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503", // my address
    etherscanApiKey: "...",
    providerUrl: "rpc", // example https://localhost:8545
    timestampInSecs: 1619816421
}).then((result)=>{
    console.log(result)
})

// get average balance for past 48 hours
BalanceHistory.getBalanceSinceXHours(48,{
    contractAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // usdt
    userAddress: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503", // my address
    etherscanApiKey: "...",
    providerUrl: "rpc", // example https://localhost:8545
}).then((result)=>{
    console.log(result)
})

// get average balance for past 30 days
BalanceHistory.getBalanceSinceXDays(30,{
    contractAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // usdt
    userAddress: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503", // my address
    etherscanApiKey: "...",
    providerUrl: "rpc", // example https://localhost:8545
}).then((result)=>{
    console.log(result)
})


// get average balance for past 10 months
BalanceHistory.getBalanceSinceXMonths(10,{
    contractAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // usdt
    userAddress: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503", // my address
    etherscanApiKey: "...",
    providerUrl: "rpc", // example https://localhost:8545
}).then((result)=>{
    console.log(result)
})

// get average balance for past 2 years
BalanceHistory.getBalanceSinceXYears(2,{
    contractAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // usdt
    userAddress: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503", // my address
    etherscanApiKey: "...",
    providerUrl: "rpc", // example https://localhost:8545
}).then((result)=>{
    console.log(result)
})

```
