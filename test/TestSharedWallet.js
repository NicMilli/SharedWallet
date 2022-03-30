const SharedWallet = artifacts.require("./SharedWallet.sol");

contract("SharedWallet", accounts => {
    //it("...Should be able to receive funds", async function(){
        //const SharedWalletInstance = await SharedWallet.deployed();
        //await SharedWalletInstance

   // });

    it("...Should be able to create and change an allowance", async function(){
        const SharedWalletInstance = await SharedWallet.deployed();
        const user = "0xb9DF736A00F50c419Eab8dFAf4216Ab733846A57";
        const amount = 12;
        const amount2 = 15;

        await SharedWalletInstance.SetAllowance(user, amount, {from: accounts[0]});
        const result = await SharedWalletInstance.allowance(user);
        assert.equal(result, amount, "The initial allowance was not set properly");
        
        await SharedWalletInstance.SetAllowance(user, amount2, {from: accounts[0]});
        const result2 = await SharedWalletInstance.allowance(user);
        assert.equal(result2, amount2, "The allowance was not changed correctly");
    });

    it("...Should be able to receive funds and pay users", async function(){
        const SharedWalletInstance = await SharedWallet.deployed();
        const user = "0xb9DF736A00F50c419Eab8dFAf4216Ab733846A57";
        const allowanceAmount = 10;
        const balanceAmount = 20;
        const amount = 8;

        await SharedWalletInstance.SetAllowance(user, allowanceAmount, {from: accounts[0]});

        await SharedWalletInstance.sendTransaction({from:accounts[0] ,value:balanceAmount});
        const initBalance = await SharedWalletInstance.ContractBalance.call({from: accounts[0]});
        assert.equal(initBalance, balanceAmount, "The contract balance was not properly updated or the view function did not work correctly.");

        await SharedWalletInstance.PayOut(user, amount);
        const finalBalance = await SharedWalletInstance.ContractBalance.call({from: accounts[0]});
        assert.equal(finalBalance, initBalance-amount, "The balance was not updated correctly");
    });

    it("...Should be able to retrieve the contract states (balance, allowances and owner) as well as transfer the owner", async function(){
        const SharedWalletInstance = await SharedWallet.deployed();
        const user = "0xb9DF736A00F50c419Eab8dFAf4216Ab733846A57";
        const allowanceAmount = 10;
        const balanceAmount = 20;

        await SharedWalletInstance.SetAllowance(user, allowanceAmount, {from: accounts[0]});
        await SharedWalletInstance.sendTransaction({from:accounts[0] ,value:balanceAmount});

        const owner = await this.SharedWallet.methods.owner().call({from: this.accounts[0]});
        assert.equal(owner, accounts[0], "The contract balance was not properly updated or the view function did not work correctly.");

        await SharedWalletInstance.PayOut(user, amount);
        const finalBalance = await SharedWalletInstance.ContractBalance.call({from: accounts[0]});
        assert.equal(finalBalance, initBalance-amount, "The balance was not updated correctly");
    });

});