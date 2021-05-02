/**
 * LibertyPie (https://libertypie.com)
 * @author LibertyPie <hello@libertypie.com>
 * @license MIT
 */
 
const ethers = require('ethers');
const axios = require('axios');
const sleep = require("sleep")
const md5 = require("md5")
const moment = require("moment")

const cacheCore = require('node-file-cache').create({life: 60*60*24})

const abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    // Authenticated Functions
    "function transfer(address to, uint amount) returns (boolean)",
    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];


module.exports = class Balance {


    static async getBalanceHistory({
        contractAddress,
        userAddress,
        timestampInSecs,
        etherscanApiKey,
        providerUrl
    }) {

        //lets check cached data 
        let cacheKey = md5(`balance_${contractAddress}_${userAddress}_${timestampInSecs}_${providerUrl}`)

        let cachedData = cacheCore.get(cacheKey)

        if(cachedData){
            return cachedData;
        }

        const provider = new ethers.providers.JsonRpcProvider(providerUrl);

        //lets get the data 
        let blockNo = await this.timestampToBlock(timestampInSecs, etherscanApiKey)

        if(blockNo.length == 0){
            throw new Error(`Failed to retrieve blockNo for timestamp ${timestampInSecs}`)
        }

        blockNo = parseInt(blockNo)

        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        const balanceBigInt = await contract.balanceOf(userAddress,{blockTag: blockNo});

        let tokenDecimalCacheKey = `token_decimal_${contractAddress}`
        
        let tokenDecimal = cacheCore.get(tokenDecimalCacheKey)

        //lets get token decimal 
        if(!tokenDecimal){
            tokenDecimal = await contract.decimals();
            cacheCore.set(cacheKey,tokenDecimalCacheKey, {life: (60 * 60 * 24 * 30)});
        }

        let balance = balanceBigInt.div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(tokenDecimal))).toNumber()
        
        cacheCore.set(cacheKey,balance, {life: (60 * 60)});

        return balance;
    }

    static async getBalanceSinceXDays(daysBack,{
        contractAddress,
        userAddress,
        etherscanApiKey,
        providerUrl
    }) {

        return this.getBalanceSinceXTime({
            contractAddress,
            userAddress,
            timeMode: "days",
            timeBack: daysBack,
            etherscanApiKey,
            providerUrl
        });
    }

    static async getBalanceSinceXHours(hoursBack,{
        contractAddress,
        userAddress,
        etherscanApiKey,
        providerUrl
    }) {

        return this.getBalanceSinceXTime({
            contractAddress,
            userAddress,
            timeMode: "hours",
            timeBack: hoursBack,
            etherscanApiKey,
            providerUrl
        });
    }


    static async getBalanceSinceXMonths(monthsBack,{
        contractAddress,
        userAddress,
        etherscanApiKey,
        providerUrl
    }) {

        return this.getBalanceSinceXTime({
            contractAddress,
            userAddress,
            timeMode: "months",
            timeBack: monthsBack,
            etherscanApiKey,
            providerUrl
        });
    }


    static async getBalanceSinceXYears(yearsBack,{
        contractAddress,
        userAddress,
        etherscanApiKey,
        providerUrl
    }) {

        return this.getBalanceSinceXTime({
            contractAddress,
            userAddress,
            timeMode: "years",
            timeBack: yearsBack,
            etherscanApiKey,
            providerUrl
        });
    }


    static async getBalanceSinceXTime({
        contractAddress,
        userAddress,
        timeMode,
        timeBack,
        etherscanApiKey,
        providerUrl
    }) {    

        let supportedTimeMode = ['hours','days','months','years']

        if(!supportedTimeMode.includes(timeMode)){
            throw new Error(`unknown timeMode ${timeMode}, supported are: ${JSON.stringify(supportedTimeMode)}`)
        }

        let balancesArray = []
        let balanceSum = 0;
        let totalHistory = 0;

        //lets loop and get the timestaps
        for(let i = 0; i <= timeBack; i++){
            
            let _timestamp = moment().subtract(i, timeMode)

            //if 0, means current time, which mean the timeMode has not ended
            _timestamp = (i == 0) ? _timestamp = _timestamp.unix() : _timestamp.endOf(timeMode).unix();
            
            //lets mow get balance history
            let balance = await this.getBalanceHistory({
                contractAddress,
                userAddress,
                timestampInSecs: _timestamp,
                etherscanApiKey,
                providerUrl
            })

            balancesArray.push({
                timestamp: _timestamp,
                balance
            })

            balanceSum += balance;

            totalHistory++;

            sleep.msleep(200)
        }

        if((totalHistory -1) != timeBack) {
            throw new Error("Failed to retrieve all balance history, kindly retry again")
        }

        //lets now find the average balance
        let averageBalance = (balanceSum / totalHistory); 

        let result = {
            averageBalance,
            balances: balancesArray
        }

        return Promise.resolve(result)
    } //end fun


    static async timestampToBlock(timestamp, etherscanApiKey){
        
        let cacheKey = `tsBlock_${timestamp}`

        let cachedData = cacheCore.get(cacheKey)

        if(cachedData){
            return cachedData
        }

        const etherscanAPIEndpoint = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${etherscanApiKey}`;

        let blockNoInfo = await this.httpRequest(etherscanAPIEndpoint)

        let blockNoInfoJson = JSON.parse(JSON.stringify(blockNoInfo || "{}"))

        let maxRetries = 5
        let retries = 0;

        if(blockNoInfo == null || blockNoInfoJson.status != '1'){

            while(true){

                 blockNoInfo = await this.httpRequest(etherscanAPIEndpoint)

                if(blockNoInfo != null){
                    break;
                }

                if(retries == maxRetries){
                    throw new Error(`Failed to fetch block using timestamp for ${etherscanAPIEndpoint}`)
                }

                retries++;

                sleep.msleep(2000);
            }

            blockNoInfoJson = JSON.parse(JSON.stringify(blockNoInfo));

            console.log(blockNoInfoJson)

            if( blockNoInfoJson.status != '1'){
                throw new Error(`Failed to fetch block using timestamp for ${etherscanAPIEndpoint}, message: ${message}`)
            }
        }


        let blockNo = blockNoInfoJson.result;


        //letc save cache
        cacheCore.set(cacheKey,blockNo, {life: (60 * 60)});//save cache for 1hr
       
        return blockNo;
    }


    static async  httpRequest(url){
        try {
            let result = await axios.get(url);

            if(result.status != 200){
                console.log(`${url} returned non 200 status code`)
                return null;
            }

            return Promise.resolve(result.data)
        } catch (e){
            return null;
        }
    }
}

