pragma solidity 0.8.9;
import "./AllowanceStructure.sol";

contract SharedWallet is AllowanceStructure {
    event BalanceChange(address indexed _ChangedBy, int _difference, uint _newBalance);
    event PaymentOut(address indexed _beneficiary, uint _amount);
    event PaymentIn(address indexed _from, uint _amount);

      function PayOut(address payable _payee, uint _amount) public Permissions(_amount, _payee) {
        require(_amount <= address(this).balance, "Not enough funds in smart contract.");
       
        // This section can allow the owner to transfer funds without affecting the recipient's allowance, but updates the allowance when a user calls the function.
        //Since the owner can set the allowance at will this is not used for now.
       //if(!TrueOwner()) {
        //    UpdateAllowance(msg.sender, _amount);  
         //   }
         //else{...}
         
        UpdateAllowance(_payee, _amount);  
        emit BalanceChange( _payee, _x - int(_amount), address(this).balance - _amount);
        emit PaymentOut(_payee, _amount);
        _payee.transfer(_amount);
    }

    //function _SetAllowance(address _payee, uint _amount) public onlyOwner {
        //SetAllowance(_payee, _amount);
    //}
    
    function renounceOwnership() public view override onlyOwner {
        revert("Cannot renounce ownership"); //This overrides the renounceOwnership function in Ownable.sol
    }
    
    function ContractBalance() public view returns(uint) {
        return address(this).balance;
    }

    function ViewAllowance(address _user) public view returns(uint) {
        return allowance[_user]._allowance;
    }

    function ViewMyAllowance() public view returns(uint) {
        return allowance[msg.sender]._allowance;
    }

    function rViewAllowance(address _user) public view returns(uint _year, uint _month, uint _day, uint _hour, uint _minute, uint _second) {
        (_year, _month, _day, _hour, _minute, _second) = ts_to_dateTime(allowance[_user].initTime);
        return(_year, _month, _day, _hour, _minute, _second);
    }

    //function ContractAddress() public view returns(address) {
     //   return address(this);
    //}
    
    receive() external payable {
    emit BalanceChange(msg.sender, int(msg.value), address(this).balance);
    emit PaymentIn(msg.sender, msg.value);
    }
}
