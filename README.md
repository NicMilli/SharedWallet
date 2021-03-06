# SharedWallet
# [View the web app here!](https://nicmilli.github.io/SharedWallet)

This is a simple escrow contract that I edited from the ['Ethereum Blockchain Developer With Solidity'](https://www.udemy.com/course/blockchain-developer) on Udemy.com.

This is my first project that I edited and deployed. Expanding the code taught me a lot about the inner workings of solidity. I had to convert unix timestamps to date-time format. I encountered many problems related to stack depth, a lesson which has been very useful in consequent projects. It was a great introduction to mappings, structs, parent contracts, events, payable functions and modifiers.

This was also the first time I had to think about usability when creating user interfaces which was both fun and challenging. I had a lot of fun styling the web app. Using images to add a personal touch to the app header and browser tab was an exciting change to strict data analysis as it allowed for creativity and outputs which are easier to see and visualize. Even simply using CSS to style JSX elements added a creativity to coding that I had not experienced before (except for styling tables and graphs).

I experimented with various methods to overcome the inefficiencies of JavaScript's double precision number system when working with the large numbers inherent in solidity (1 Ether is 10^18 Wei which often exceeds the 15 digits of accuracy that JavaScript provides). I used strings initially before using big numbers from both web3.utils.BN and the bignumber.js library. I learnt to use APIs to import data- in this case the CoinGecko API used to gather real-time cryptocurrency prices. Lastly, creating function delays and intervals was challenging and introduced me to various methods such as cron and timeouts.

Most importantly this introduced me to *arrow functions, asynchronous functions, promises and state variables.*

# Skills Used:
* Blockchain:  
  Smart contract development   
   -Solidity  
   -Event triggers  
   -conversion from unix timestamps to date-time  
   -Workflow with Truffle  
  Smart contract deployment to Ropsten test network through Infura.io  
  Smart contract testing with Truffle  
* Front-end:  
  APIs
  BigNumbers
  Arrow Functions  
  Alerts  
  Asynchronous functions  
  Smart contract interaction  

# Technologies Used:
* Solidity
* Ropsten Test Network
* CoinGecko API
* OpenZeppelin
* MetaMask
* Truffle
* Web3
* React
* CSS3
* HTML5
* Infura
* Git
* GitHub
* JavaScript
* BigNumber.js
* Cron

# Approach:
I started with the Shared Wallet project from ['Ethereum Blockchain Developer With Solidity'](https://www.udemy.com/course/blockchain-developer). The project was designed to handle allowances for registered addresses, allowing the owner of the address to withdraw the specified amount. This amount had to be withdrawn manually by the recipient as well as refilled manually by the contract owner.

I thought about the possible uses for this and decided that a payroll system or an inheritance payout would be the best fits. In both these cases it would not be very practical for the owner to have to update the allowance each time the recipient withdrew their allowance. Furthermore, one may want to set a time when the allowance became active- payday for employees or maybe a child's 18th birthday for an inheritance. I also decided that these payments may need to be recurring- resetting after a defined time interval. Lastly, it may be best to transfer automatically to recipients rather than requiring them to interact with the contract and have to pay the gas fees associated with the withdrawal.

This created more issues to consider. The security of the contract would need to be adjusted to ensure malicious actors cannot deplete the contract. For this the OnlyOwner function from OpenZeppelin was employed and front-end checks put in place to stop unauthorized calls going through. Gas costs would also need to be considered as the owner is now responsible for all gas costs. For this other networks such as the XRP Ledger (or the newer Flare Network) may be a better place to deploy this contract in the future. Furthermore, MetaMask does not allow for pre-authorized transactions so the owner would still need to approve all function calls. Using another wallet to fund the transactions may solve this problem but for now MetaMask is the most readily available way for new users to interact with this contract. 
# Successes and short-comings:
* Success:
  * Full-stack development of a smart contract
  * Using APIs to import data

* Short-comings:
  * The monthly recurring allowance still does not work as intended
# Code Highlights:
Converting to datetime was an interesting process. This code was used from pipermerriam on [github](https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary). This function converts the number of days since 01/01/1970 (which can be calculated from the unix thimestamp using a previous function) to a datetime using the Julian Date formula.

```solidity AllowanceStructure Contract
 function _daysToDate(uint _days) internal pure returns (uint year, uint month, uint day) {
        int __days = int(_days);

        int L = __days + 68569 + start_19700101;
        int N = 4 * L / 146097;
        L = L - (146097 * N + 3) / 4;
        int _year = 4000 * (L + 1) / 1461001;
        L = L - 1461 * _year / 4 + 31;
        int _month = 80 * L / 2447;
        int _day = L - 2447 * _month / 80;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;

        year = uint(_year);
        month = uint(_month);
        day = uint(_day);
    }
```

I learnt so much creating this app that it is hard to choose specific functions to highlight. This is a function that I built to attempt to avoid precision loss when converting to BigNumbers (I noticed that decimals would get rounded when converted to BN- this can be  aproblem when working with Wei and Ether simultaneously).

```javascript App.js
 precisionLoss = (val, BNv) => {
    let len = val.length;
    let STRval = BNv.toString();
    let lenBN = STRval.length;
    if (val[0] === '0' && val[1]!=='.') {
      len = len-1;
    }
    
    if (len === lenBN){
      return false;
    }
    else {
      return true;
    }
   }
```

