import React, { Component } from "react";
import AllowanceStructuringContract from "./contracts/AllowanceStructure.json";
import SharedWalletContract from "./contracts/SharedWallet.json";
import getWeb3 from "./getWeb3";
import "./App.css";
//import axios from 'axios'
import { CoinGeckoClient } from 'coingecko-api-v3';
//import ReactDOM from 'react-dom'
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faEthereum } from '@fortawesome/free-brands-svg-icons';
//import { faCoins, faUsers, faCommentDollar, faPeopleArrows, faUserTie, faUsersSlash } from '@fortawesome/free-solid-svg-icons';
import mylogo from './mylogo.png';
const BigNumber = require('bignumber.js');

var CronJob = require('cron').CronJob;
//import styled from "styled-components";
//import { Button } from 'react-native-elements';
//import Icon from 'react-native-vector-icons/FontAwesome';
//https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
const client = new CoinGeckoClient({
  timeout: 1000,
  autoRetry: true,
});
var delay_map = [];
var repeat_map = [];
var timeout_map = [];
var interval_map = [];
var amount_map = [];
// var rInterval_map = {};
//Goals: all currencies update in state when 1 is changed
//Doesnt break after usd called

//console.log(client.simplePrice({vs_currencies:'usd', ids: 'ethereum'}).then(
 // this.state(price)));
  //console.log(res.data);

//const trendingSearch = await client.trendingSearch();
//client.simplePriceId()

const toETH = 10**(18);
const BNtoETH = new BigNumber(toETH);

class App extends Component {
  state = { price:4000, loaded:false, amount:"0",  usdamount:0, Eamount:0, address:"0x...", 
  pay_amount:0, Epay_amount:0, USDpay_amount:0, pay_address:"0x...", addbalance:0, Eaddbalance:0, newAddress:"0x...", 
  view_address:"0x...", usd:'0', Day:0, Month:0, Year:2021, Hour:0, 
  Minute:0, Interval:0, recurringAddress:"0x...", recurringAmount:0, rusdamount:0, rEamount:0,};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
      
      this.AllowanceStructuring = new this.web3.eth.Contract(
        AllowanceStructuringContract.abi,
        AllowanceStructuringContract.networks[this.networkId] && AllowanceStructuringContract.networks[this.networkId].address,
      );

      this.SharedWallet = new this.web3.eth.Contract(
        SharedWalletContract.abi,
        SharedWalletContract.networks[this.networkId] && SharedWalletContract.networks[this.networkId].address,
      );


      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToBalance();
      this.listenToPayOut();
      this.listenToPayIn();
      this.listenToAllowance();
      this.listenToNewOwner();
      this.setState({ loaded:true, price: this.priceSet() });
      
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  //
  //loadcoins = async() => {
   // const [setCoins] = useState([]);
//  
  //  const loadData = async () => {
    //  const cryptosResponse = await fetch('https://api.coingecko.com/api/v3/coins/ethereum');
      //console.log(cryptosResponse)
//      const cryptos = await cryptosResponse.json();
  //    setCoins(cryptos);
    //}
//    console.log(loadData);
  //  const price = loadData[1];
    //console.log(price);

  //};
  
  priceSet = async() => {
    let latest = await client.simplePrice({vs_currencies:'usd', ids: 'ethereum'});
    var BNprice = new BigNumber(latest.ethereum.usd);
    this.setState({price: BNprice});
  };

  listenToBalance = (event) => {
    this.SharedWallet.events.BalanceChange().on("data", async function(evtB){
    let BalChObj = await evtB.returnValues;
    console.log(typeof(BalChObj));
    alert(BalChObj._ChangedBy+" changed the contract balance to "+BalChObj._newBalance+" Wei , or " +BalChObj._newBalance/toETH+" Ether")
    })
  }

  listenToPayOut = (event) => {
    this.SharedWallet.events.PaymentOut().on("data", async function(evtOut){
    let PayOutObj = await evtOut.returnValues;
    alert(PayOutObj._beneficiary+" was paid "+PayOutObj._amount+" Wei , or "+PayOutObj._amount/toETH+" Ether");
    })
  }

  listenToPayIn = (event) => {
    this.SharedWallet.events.PaymentIn().on("data", async function(evtIn){
    let PayInObj = await evtIn.returnValues;
    alert(PayInObj._from+" added "+PayInObj._amount+" Wei to the contract balance, or "+PayInObj._amount/toETH+" Ether");
    })
  }

  listenToAllowance = (event) => {
    this.SharedWallet.events.AllowanceChange().on("data", async function(evtAl){
      let AlObj = await evtAl.returnValues;
    alert(AlObj._ChangedBy+" changed "+AlObj._forUser+" to "+AlObj._newAllowance+" Wei , or "+AlObj._newAllowance/toETH+" Ether");
    })
  }

  listenToNewOwner = (event) => {
    this.SharedWallet.events.OwnershipTransferred().on("data", async function(evtownCh){
      let OwnChObj = await evtownCh.returnValues;
    alert("The ownership was successfully transferred from "+OwnChObj.previousOwner+" to "+OwnChObj.newOwner)
    })
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    })
  }

  preDecimal = (val) => {
   let len = val.length;
   const dot = '.';
   if (val[len-1] === dot){
     return true;
   }
   else {
     return false;
   }
  }

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
  
  decimalHelper = (name, _value) =>{
 
          this.setState({
            [name]: _value
          })
        }

  BalanceChange = (event) => {
    this.priceSet();
    const {price} = this.state;
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    var BNvalue = BigNumber(value);
    
  if (target.name === "usd") {
        if(this.preDecimal(value)){
         this.decimalHelper(target.name, value);
        }
        
        else if (BNvalue.isNaN()){
          BNvalue = new BigNumber(0);
        this.setState({
          usd: BNvalue, Eaddbalance: BNvalue.div(price), addbalance: (BNvalue.div(price)).times(BNtoETH)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

        else {
          console.log(BNvalue.length)
          this.setState({
            usd: BNvalue, Eaddbalance: BNvalue.div(price), addbalance: (BNvalue.div(price)).times(BNtoETH)
          })
        }
      }
    

  else if (target.name === "Eaddbalance") {
        if(this.preDecimal(value)){
          this.decimalHelper(target.name, value);
        }
        
        else if (BNvalue.isNaN()){
          BNvalue = new BigNumber(0);
        this.setState({
          Eaddbalance: BNvalue, usd: BNvalue.times(price), addbalance: BNvalue.times(BNtoETH)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

        else {
          this.setState({
            Eaddbalance: BNvalue, usd: BNvalue.times(price), addbalance: BNvalue.times(BNtoETH)
          })
        }
      }

  else {
        if(this.preDecimal(value)){
          this.decimalHelper(target.name, value);
        }
        
        else if (BNvalue.isNaN()){
          BNvalue = new BigNumber(0);
          this.setState({
            addbalance: BNvalue, Eaddbalance: BNvalue.div(BNtoETH), usd: (BNvalue.div(BNtoETH)).times(price)
          })
        }

        else if (this.precisionLoss(value, BNvalue)){
          this.decimalHelper(target.name, value);
         }

        else {
          this.setState({
            addbalance: BNvalue, Eaddbalance: BNvalue.div(BNtoETH), usd: (BNvalue.div(BNtoETH)).times(price)
          })
        }
      }
  }

  AllowanceChange = (event) => {
    this.priceSet();
    const {price} = this.state;
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    var BNvalue = BigNumber(value);

    if (target.name === "usdamount") {
      if(this.preDecimal(value)){
       this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          usdamount: BNvalue, Eamount: BNvalue.div(price), amount: (BNvalue.div(price)).times(BNtoETH)
        })
    }

    else if (this.precisionLoss(value, BNvalue)){
      this.decimalHelper(target.name, value);
     }

      else {
        this.setState({
          usdamount: BNvalue, Eamount: BNvalue.div(price), amount: (BNvalue.div(price)).times(BNtoETH)
        })
      }
    }
  

else if (target.name === "Eamount") {
      if(this.preDecimal(value)){
        this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          Eamount: BNvalue, usdamount: BNvalue.times(price), amount: BNvalue.times(BNtoETH)
        })
    }

    else if (this.precisionLoss(value, BNvalue)){
      this.decimalHelper(target.name, value);
     }

      else {
        this.setState({
          Eamount: BNvalue, usdamount: BNvalue.times(price), amount: BNvalue.times(BNtoETH)
        })
      }
    }

else {
      if(this.preDecimal(value)){
        this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          amount: BNvalue, Eamount: BNvalue.div(BNtoETH), usdamount: (BNvalue.div(BNtoETH)).times(price)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

      else {
        this.setState({
          amount: BNvalue, Eamount: BNvalue.div(BNtoETH), usdamount: (BNvalue.div(BNtoETH)).times(price)
        })
      }
    }
}

  RecurringAllowanceChange = (event) => {
    this.priceSet();
    const {price} = this.state;
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    var BNvalue = BigNumber(value);

    if (target.name === "rusdamount") {
      if(this.preDecimal(value)){
       this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          rusdamount: BNvalue, rEamount: BNvalue.div(price), recurringAmount: (BNvalue.div(price)).times(BNtoETH)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }
    
      else {
        this.setState({
          rusdamount: BNvalue, rEamount: BNvalue.div(price), recurringAmount: (BNvalue.div(price)).times(BNtoETH)
        })    
      }
    }
  

    else if (target.name === "rEamount") {
      if(this.preDecimal(value)){
        this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          rEamount: BNvalue, rusdamount: BNvalue.times(price), recurringAmount: BNvalue.times(BNtoETH)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
      }

      else {
        this.setState({
          rEamount: BNvalue, rusdamount: BNvalue.times(price), recurringAmount: BNvalue.times(BNtoETH)
        })
      }
    }

    else {
      if(this.preDecimal(value)){
        this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          recurringAmount: BNvalue, rEamount: BNvalue.div(BNtoETH), rusdamount: (BNvalue.div(BNtoETH)).times(price)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

      else {
        this.setState({
          recurringAmount: BNvalue, rEamount: BNvalue.div(BNtoETH), rusdamount: (BNvalue.div(BNtoETH)).times(price)
        })
      }
    }
}

  PayChange = (event) => {
    this.priceSet();
    const {price} = this.state;
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    var BNvalue = BigNumber(value);

    if (target.name === "USDpay_amount") {
      if(this.preDecimal(value)){
       this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          USDpay_amount: BNvalue, Epay_amount: BNvalue.div(price), pay_amount: (BNvalue.div(price)).times(BNtoETH)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

      else {
        this.setState({
          USDpay_amount: BNvalue, Epay_amount: BNvalue.div(price), pay_amount: (BNvalue.div(price)).times(BNtoETH)
        }) 
      }
    }
  

    else if (target.name === "Epay_amount") {
      if(this.preDecimal(value)){
        this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          Epay_amount: BNvalue, USDpay_amount: BNvalue.times(price), pay_amount: BNvalue.times(BNtoETH)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

      else {
        this.setState({
          Epay_amount: BNvalue, USDpay_amount: BNvalue.times(price), pay_amount: BNvalue.times(BNtoETH)
        })
      }
    }

    else {
      if(this.preDecimal(value)){
        this.decimalHelper(target.name, value);
      }
      
      else if (BNvalue.isNaN()){
        BNvalue = new BigNumber(0);
        this.setState({
          pay_amount: BNvalue, Epay_amount: BNvalue.div(BNtoETH), USDpay_amount: (BNvalue.div(BNtoETH)).times(price)
        })
      }

      else if (this.precisionLoss(value, BNvalue)){
        this.decimalHelper(target.name, value);
       }

      else {
        this.setState({
          pay_amount: BNvalue, Epay_amount: BNvalue.div(BNtoETH), USDpay_amount: (BNvalue.div(BNtoETH)).times(price)
        })
      }
    }
  }

  AllowanceSubmit = async() => {
    const {amount, address} = this.state;
    const BNamount = amount.dp(0,4);
    await this.SharedWallet.methods.SetAllowance(address, BNamount.toString()).send({from: this.accounts[0]});
  }

  ViewAllowanceSub = async() => {
    const {view_address} = this.state;
    const ViewAllow = await this.SharedWallet.methods.ViewAllowance(view_address).call({from: this.accounts[0]});
    console.log(ViewAllow);
    alert("User "+view_address+" has an allowance of "+ViewAllow+" Wei , or "+this.web3.utils.fromWei(ViewAllow, 'ether')+" Ether");
  }

  rViewAllowanceSub = async() => {
    const {view_address} = this.state;
    //const {sYear, sMonth, sDay, sHour, sMinute, Int, period, reloadAmount} 
    const result = await this.SharedWallet.methods.getMap(view_address).call({from: this.accounts[0]});
    var sec = 1;
    var min = 1;
    if (result[4] < 10){
      sec = "0"+result[4];
    }
    else {
      sec = result[4];
    }
    if (result[3] < 10){
      min = "0"+result[3];
    }
    else {
      min = result[3];
    }
    alert("User "+view_address+" has an allowance of "+result[7]+" Wei , reloading every "+result[5]+" "+result[6]+". Starting on "+result[2]+"/"+result[1]+"/"+result[0]+" at "+min+":"+sec);
  }

  ViewMyAllowanceSub = async() => {
    const ViewMyAllow = await this.SharedWallet.methods.ViewMyAllowance().call({from: this.accounts[0]});
    alert("Your allowance is "+ViewMyAllow+" Wei, or "+this.web3.utils.fromWei(ViewMyAllow, 'ether')+" Ether");
  }

  rViewMyAllowanceSub = async() => {
    const result = await this.SharedWallet.methods.getMap(this.accounts[0]).call({from: this.accounts[0]});
    var sec = 1;
    var min = 1;
    if (result[4] < 10){
      sec = "0"+result[4];
    }
    else {
      sec = result[4];
    }
    if (result[3] < 10){
      min = "0"+result[3];
    }
    else {
      min = result[3];
    }
    alert("User "+this.accounts[0]+" has an allowance of "+result[7]+" Wei , reloading every "+result[5]+" "+result[6]+". Starting on "+result[2]+"/"+result[1]+"/"+result[0]+" at "+min+":"+sec);
  }

  payoutSubmit = async() => {
    const {pay_amount, pay_address} = this.state;
    const BNpay_amount = pay_amount.dp(0,4);
    await this.SharedWallet.methods.PayOut(pay_address, BNpay_amount.toString()).send({from: this.accounts[0]});
  }

  payinSubmit = async() => {
    alert("Please send funds to this address: "+SharedWalletContract.networks[this.networkId].address);
   // alert(PayInObj+" added "+evtIn.events.PaymentIn.returnValues._amount+" wei to the contract balance")
  }

  AddBalSubmit = async() => {
    const {addbalance} = this.state;
    await this.web3.eth.sendTransaction({to: SharedWalletContract.networks[this.networkId].address, from:this.accounts[0], value: addbalance.dp(0,4)});
    //alert(this.accounts[0]+" added "+addbalance+" wei to the contract balance")
  }

  balSubmit = async() => {
   const bal = await this.SharedWallet.methods.ContractBalance().call({from: this.accounts[0]});
   alert("The balance is "+bal+" Wei, or "+this.web3.utils.fromWei(bal, 'ether')+" Ether");
  }

  OwnerSubmit = async() => {
    const own = await this.SharedWallet.methods.owner().call({from: this.accounts[0]});
    alert("The owner is "+own);
   }

   OwnChangeSubmit = async() => {
    const {newAddress} = this.state;
    await this.SharedWallet.methods.transferOwnership(newAddress).send({from: this.accounts[0]});
   }

   rCancelSubmit = async() => {
    const {recurringAddress} = this.state;
    await this.SharedWallet.methods.stopReload(recurringAddress).send({from: this.accounts[0]});
    
    if (recurringAddress in timeout_map)
      {
        clearTimeout(timeout_map[recurringAddress]);
        alert("The upcoming recurring allowance has been canceled for: "+recurringAddress)
      }

      if (recurringAddress in interval_map)
      {
        clearInterval(interval_map[recurringAddress]);
        interval_map[recurringAddress].stop();
        alert("The current recurring allowance has been canceled for: "+recurringAddress)
      }
    
   }

   DaySubmit = async() => {
    const {Day, Month, Year, Hour, Minute, Interval, recurringAddress, recurringAmount} = this.state;
    this.rCancelSubmit();
    amount_map[recurringAddress] = recurringAmount.dp(0,4).toString();
    
    console.log(amount_map[recurringAddress])
    
    const delay = await this.SharedWallet.methods.diffSeconds(Year, Month, Day, Hour, Minute).call({from: this.accounts[0]}); //retrieves the number of seconds between current time and intended start time/date
    await this.SharedWallet.methods.setDaily(recurringAddress, amount_map[recurringAddress], Interval, Day, Month, Year, Hour, Minute).send({from: this.accounts[0]}); //sets the allowance to update in solidity
    const repeatSec = await this.SharedWallet.methods.getMap(recurringAddress).call({from: this.accounts[0]}); //gets variables from map in solidity- [9] for seconds between repeated calls
    //How do I vary this after each 'repeat' so that the number of days in each month is considered for monyhly calls (have the code to get number of days in next month in solidity so just need to vary the repeat based on that)
    console.log(delay);
    
    delay_map[recurringAddress] = delay; //need to modify so that the current delay (if exists) is overriden
    repeat_map[recurringAddress] = repeatSec[9]; //need to modify so that the current repeat (if exists) is overriden - originally tried: repeat_map[recurringAddress].push(repeatSec[9];

    this.Day_reccur(recurringAddress);
   }

    Day_reccur = async(user_address) => {

    timeout_map[user_address] = setTimeout(async() => { 
     console.log(typeof(amount_map[user_address])); 
  
        this.Day_interval(user_address);
        console.log(amount_map[user_address])
        await this.SharedWallet.methods.ReloadAllowance(user_address, amount_map[user_address]).send({from: this.accounts[0]});
        await this.SharedWallet.methods.PayOut(user_address, amount_map[user_address]).send({from: this.accounts[0]});
    }, delay_map[user_address]*1000); //convert delay to milliseconds
}

    Day_interval = async(user_address) => {
      interval_map[user_address] = setInterval(async() => {
        await this.SharedWallet.methods.ReloadAllowance(user_address, amount_map[user_address]).send({from: this.accounts[0]});
        await this.SharedWallet.methods.PayOut(user_address, amount_map[user_address]).send({from: this.accounts[0]});
      }, repeat_map[user_address]*1000);
    }

    MonthSubmit = async() => {
      const {Day, Month, Year, Hour, Minute, Interval, recurringAddress, recurringAmount} = this.state;
      this.rCancelSubmit();
      amount_map[recurringAddress] = recurringAmount.dp(0,4).toString();
      
      const delay = await this.SharedWallet.methods.diffSeconds(Year, Month, Day, Hour, Minute).call({from: this.accounts[0]}); //retrieves the number of seconds between current time and intended start time/date
      await this.SharedWallet.methods.setMonthly(recurringAddress, amount_map[recurringAddress], Interval, Day, Month, Year, Hour, Minute).send({from: this.accounts[0]}); //sets the allowance to update in solidity
      const repeatSec = await this.SharedWallet.methods.getMap(recurringAddress).call({from: this.accounts[0]}); //gets variables from map in solidity- [9] for seconds between repeated calls
     
      delay_map[recurringAddress] = delay; //need to modify so that the current delay (if exists) is overriden
      repeat_map[recurringAddress] = repeatSec[9]; //need to modify so that the current repeat (if exists) is overriden - originally tried: repeat_map[recurringAddress].push(repeatSec[9];
  
      this.Month_reccur(recurringAddress, Hour, Day, Minute, Interval);
      alert('Allowance will reload every '+Interval+' months.');
     }
  
      Month_reccur = async(user_address, H, D, Min, Int) => {
  
      timeout_map[user_address] = setTimeout(async() => { 

        interval_map[user_address] = new CronJob(`${Min} ${H} ${D} */${Int} *`, async() => {
          alert('Scheduled recurring allowance has started, and will reload every '+Int+' months.');
          await this.SharedWallet.methods.ReloadAllowance(user_address, amount_map[user_address]).send({from: this.accounts[0]});
          await this.SharedWallet.methods.PayOut(user_address, amount_map[user_address]).send({from: this.accounts[0]});
        }, null, true, 'America/New_York');
        interval_map[user_address].start();
    
          //this.Month_interval(user_address);
          //await this.SharedWallet.methods.ReloadAllowance(user_address, amount_map[user_address]).send({from: this.accounts[0]});
          //await this.SharedWallet.methods.PayOut(user_address, amount_map[user_address]).send({from: this.accounts[0]});

      }, delay_map[user_address]*1000); //convert delay to milliseconds
  }
  
      //Month_interval = async(user_address) => {
        //interval_map[user_address] = setTimeout(async() => {

          
            //await this.SharedWallet.methods.ReloadAllowance(user_address, amount_map[user_address]).send({from: this.accounts[0]});
            //await this.SharedWallet.methods.PayOut(user_address, amount_map[user_address]).send({from: this.accounts[0]});
        

          //await this.SharedWallet.methods.ReloadAllowance(user_address, amount_map[user_address]).send({from: this.accounts[0]});
          //await this.SharedWallet.methods.PayOut(user_address, amount_map[user_address]).send({from: this.accounts[0]});

          //this.reset_Month_interval(user_address);
        //}, repeat_map[user_address]*1000);
      //}

      //reset_Month_interval = async(user_address) => {

        //alert("Interval cleared, resetting for new month")
              //var new_repeatSec = await this.SharedWallet.methods.getMap(user_address).call({from: this.accounts[0]});
              //repeat_map[user_address] = new_repeatSec[9]; 
              //this.Month_interval(user_address);
      //}

   priceview = async() => {
    await this.priceSet();
    const {price} = this.state;
    alert("The price is $"+price);
   }

   handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    })
  }


   hideElement = (event) => {
    const target = event.target.name; 
    //var x = target;
    var x = document.getElementById(target);
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
       }
    }

   //<FontAwesomeIcon icon={faEthereum} /> line 715
   //<FontAwesomeIcon icon={faEthereum} /> 718
   //<FontAwesomeIcon icon={faUserTie} /> 722
   //<FontAwesomeIcon icon={faCoins} /> 741
   //<FontAwesomeIcon icon={faUsers} /> 755
   //<FontAwesomeIcon icon={faUsers} /> 780
   //<FontAwesomeIcon icon={faUsers} /> 782
   //<FontAwesomeIcon icon={faUsersSlash} /> 785
   //<FontAwesomeIcon icon={faCommentDollar} /> 793
   //<FontAwesomeIcon icon={faPeopleArrows} /> 798
   
  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
        
    return (
      <div className="App">
        <header className='App-header' ><img className='App-logo' src={mylogo} alt="logo"/></header>

        <h1>Shared Wallet:</h1>
        <h2>MAKE CHANGES TO THE ALLOWANCE AND TRANSFER FUNDS HERE </h2>
        <p>Amounts are in Wei for highest accuracy. 1 Wei is 1x10<sup>-18</sup> Ether.
        <br></br>Timezone is set to EST.</p>
        <h2>Check current Ethereum price in USD</h2>
        
        <button type="button" className='price-btn' onClick={this.priceview}><strong>Ethereum Price</strong></button>
        
        <h2>View Contract Owner:</h2>
        <button type="button" className='nrml-btn' onClick={this.OwnerSubmit}>View Owner Address</button>

        <h2>View Contract Balance:</h2>
        <button type="button" className='nrml-btn' onClick={this.balSubmit}>Balance</button>

        <h2>View User Allowance or Recurring Allowance Schedule:</h2>
        User Address: <input type="text" name="view_address" value={this.state.view_address} onChange={this.handleInputChange} />
        <button type="button" className='nrml-btn' onClick={this.ViewAllowanceSub}>View User Allowance</button> Or <button type="button" className='btn' onClick={this.rViewAllowanceSub}>View User Recurring Allowance Schedule</button><br></br>
        Alternatively check your own allowance (No address input needed)<br></br>
        <button type="button" className='nrml-btn' onClick={this.ViewMyAllowanceSub}>View My Allowance</button> Or <button type="button" className='btn' onClick={this.rViewMyAllowanceSub}>View My Recurring Allowance Schedule</button><br></br>
<div style={{ borderTop: "2px solid #0f0f0f ", marginLeft: 500, marginRight: 500 }}></div>
<br></br>

      <button name="addFunds" type="button" className= 'addbalance-btn' onClick={this.hideElement}>Add funds to wallet</button>
      <div id="addFunds">
        <h2>Send funds to contract using Metamask:</h2>
        Amount in Wei: <input type="text" name="addbalance" value={this.state.addbalance} onChange={this.BalanceChange} />
        <br></br>
        Amount in Ether: <input type="text" name="Eaddbalance" value={this.state.Eaddbalance} onChange={this.BalanceChange} />
        <br></br>
        Amount in USD: <input type="text" name="usd" value={this.state.usd} onChange={this.BalanceChange} />
        <br></br>
        <button type="button" className='addbalance-btn' onClick={this.AddBalSubmit}><strong>Add funds to contract balance </strong></button>

        <h2>Send Funds to Contract Externally:</h2>
        <button type="button" className='nrml-btn' onClick={this.payinSubmit}>Add to balance</button>
        </div>
<div style={{ borderTop: "2px solid #0f0f0f ", marginLeft: 500, marginRight: 500 }}></div>
      <br></br>

      <button name="setAllow" type="button" className= 'addallowance-btn' onClick={this.hideElement}>Set a one-time allowance</button>
      <div id="setAllow">
        <h2>Set Allowance:</h2>
        Wallet Address: <input type="text" name="address" value={this.state.address} onChange={this.handleInputChange} />
        <br></br>
        Amount in Wei: <input type="text" name="amount" value={this.state.amount} onChange={this.AllowanceChange} />
        <br></br>
        Amount in Ether: <input type="text" name="Eamount" value={this.state.Eamount} onChange={this.AllowanceChange} />
        <br></br>
        Amount in USD: <input type="text" name="usdamount" value={this.state.usdamount} onChange={this.AllowanceChange} />
        <br></br>
        <button type="button" className='addallowance-btn' onClick={this.AllowanceSubmit}><strong>Set user allowance</strong> </button>
        </div>
<div style={{ borderTop: "2px solid #0f0f0f ", marginLeft: 500, marginRight: 500 }}></div>
      <br></br>


      <button name="rsetAllow" type="button" className= 'addallowance-btn' onClick={this.hideElement}>Set a recurring allowance</button>
      <div id="rsetAllow" background-color="white">
        <h2>Set Recurring Allowance:</h2>
        <p>The amount will be <strong>added</strong> to the user's allowance at every interval and transferred to their account <br></br> The recurrance can be set for a specified number of days or months (not both) and will trigger at every interval after the start date set</p>
        Wallet Address: <input type="text" name="recurringAddress" value={this.state.recurringAddress} onChange={this.handleInputChange} />
        <br></br>
        Amount in Wei: <input type="text" name="recurringAmount" value={this.state.recurringAmount} onChange={this.RecurringAllowanceChange} />
        <br></br>
        Amount in Ether: <input type="text" name="rEamount" value={this.state.rEamount} onChange={this.RecurringAllowanceChange} />
        <br></br>
        Amount in USD: <input type="text" name="rusdamount" value={this.state.rusdamount} onChange={this.RecurringAllowanceChange} />
        <br></br>
        <strong>Set the start date and time- this will also determine when the intervals start</strong>
        <br></br>
        Day(1-31): <input type="text" name="Day" value={this.state.Day} onChange={this.handleInputChange} />
        Month(1-12): <input type="text" name="Month" value={this.state.Month} onChange={this.handleInputChange} />
        Year(YYYY): <input type="text" name="Year" value={this.state.Year} onChange={this.handleInputChange} />
        Hour(0-23): <input type="text" name="Hour" value={this.state.Hour} onChange={this.handleInputChange} />
        Minute(0-59): <input type="text" name="Minute" value={this.state.Minute} onChange={this.handleInputChange} />
        <br></br>
        Interval(eg '2' for repeating every 2 months): <input type="text" name="Interval" value={this.state.Interval} onChange={this.handleInputChange} />
        <br></br>
        <button type="button" className='addallowance-btn' onClick={this.DaySubmit}><strong>Set recurring allowance in days</strong> </button>
        <button type="button" className='addallowance-btn' onClick={this.MonthSubmit}><strong>Set recurring allowance in Months</strong> </button>
        <br></br>
        <button type="button" className='pay-btn' onClick={this.rCancelSubmit}><strong>Cancel current recurring allowance (only input address)</strong> </button>
        </div>
<div style={{ borderTop: "2px solid #0f0f0f ", marginLeft: 500, marginRight: 500 }}></div>
      <br></br>

        <h2>Payout:</h2>
        Wallet Address: <input type="text" name="pay_address" value={this.state.pay_address} onChange={this.handleInputChange} />
        <br></br>
        Amount in Wei: <input type="text" name="pay_amount" value={this.state.pay_amount} onChange={this.PayChange} />
        <br></br>
        Amount in Ether: <input type="text" name="Epay_amount" value={this.state.Epay_amount} onChange={this.PayChange} />
        <br></br>
        Amount in USD: <input type="text" name="USDpay_amount" value={this.state.USDpay_amount} onChange={this.PayChange} />
        <br></br>
        <button type="button" className='pay-btn' onClick={this.payoutSubmit}><strong>Pay user </strong></button>
        
        <h2>Transfer Contract Ownership</h2>
        New Owner Address: <input type="text" name="newAddress" value={this.state.newAddress} onChange={this.handleInputChange} />
        <button type="button" className='btn' onClick={this.OwnChangeSubmit}>Transfer Ownership </button>

      </div>
    );
  }
}

export default App;
