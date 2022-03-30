pragma solidity 0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";

contract AllowanceStructure is Ownable {

    event AllowanceChange(address indexed _forUser, address indexed _ChangedBy, uint _newAllowance, uint _oldAllowance ,int _difference);
   struct userData {
        uint _allowance;
        uint repeatSec;
        uint _reloadAmount;
        uint i; //reload interval
        uint j;
        uint initTime;
        bool recurrance;
        bool DailyOrMonthly; //true=daily, false=monthly
        bool isDeleted; //used to delete the recurring allowance
    }

   struct dateTimeData {
        uint _startYear;
        uint _startMonth;
        uint _startDay;
        uint _startHour;
        uint _startMinute;
   }

    mapping(address => userData) public allowance;
    mapping(address => dateTimeData) public reload;
    int _x;
    uint toWei = 1e18;

    modifier Permissions(uint _amount, address _user) {
        require(allowance[_user]._allowance >= _amount, "The amount exceeds your allowance.");
        _;
    }

    //Payment Scheduling:
    uint public constant sec_per_day = 24 * 60 * 60;
    uint public constant sec_per_hour = 60 * 60;
    uint public constant sec_per_minute = 60;
    int public constant start_19700101 = 2440588;
    
    uint public constant mon = 1;
    uint public constant tue = 2;
    uint public constant wed = 3;
    uint public constant thu = 4;
    uint public constant fri = 5;
    uint public constant sat = 6;
    uint public constant sun = 7;

//CREDIT FOR DATE TIME CONVERSIONS TO BOKKYPOOBAH ON GITHUB: https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary
     // ------------------------------------------------------------------------
    // Calculate year/month/day from the number of days since 1970/01/01 using
    // the date conversion algorithm from
    //   http://aa.usno.navy.mil/faq/docs/JD_Formula.php
    // and adding the offset 2440588 so that 1970/01/01 is day 0
    //
    // int L = days + 68569 + offset
    // int N = 4 * L / 146097
    // L = L - (146097 * N + 3) / 4
    // year = 4000 * (L + 1) / 1461001
    // L = L - 1461 * year / 4 + 31
    // month = 80 * L / 2447
    // dd = L - 2447 * month / 80
    // L = month / 11
    // month = month + 2 - 12 * L
    // year = 100 * (N - 49) + year + L
    // ------------------------------------------------------------------------
    
    function _daysFromDate(uint year, uint month, uint day) internal pure returns (uint _days) {
        require(year >= 1970);
        int _year = int(year);
        int _month = int(month);
        int _day = int(day);

        int __days = _day
          - 32075
          + 1461 * (_year + 4800 + (_month - 14) / 12) / 4
          + 367 * (_month - 2 - (_month - 14) / 12 * 12) / 12
          - 3 * ((_year + 4900 + (_month - 14) / 12) / 100) / 4
          - start_19700101;

        _days = uint(__days);
    }
    
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

     
    function ts_to_dateTime(uint timestamp) public pure returns (uint year, uint month, uint day, uint hour, uint minute, uint second) {
        (year, month, day) = _daysToDate(timestamp/ sec_per_day);
        uint secs = timestamp % sec_per_day;
        hour = secs / sec_per_hour;
        secs = secs % sec_per_hour;
        minute = secs / sec_per_minute;
        second = secs % sec_per_minute;
        require(verifyDate(year, month, day) == true, "Date conversion failed");
    }

    function ts_to_MY(uint timestamp) public pure returns (uint year, uint month, uint day) {
        (year, month,  day) = _daysToDate(timestamp/ sec_per_day);
        require(verifyDate(year, month, day) == true, "Date conversion failed");
    }
    
    function verifyDate(uint year, uint month, uint day) internal pure returns (bool valid) {
        if (year >= 1970 && month > 0 && month <= 12) {
            uint daysInMonth = _getDaysInMonth(year, month);
            if (day > 0 && day <= daysInMonth) {
                valid = true;
            }
        }
    }
    
    function getDaysInMonth(uint timestamp) internal pure returns (uint daysInMonth) {
        (uint year, uint month,) = _daysToDate(timestamp / sec_per_day);
        daysInMonth = _getDaysInMonth(year, month);
    }
    function _getDaysInMonth(uint year, uint month) internal pure returns (uint daysInMonth) {
        if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
            daysInMonth = 31;
        } else if (month != 2) {
            daysInMonth = 30;
        } else {
            daysInMonth = _isLeapYear(year) ? 29 : 28;
        }
    }
    
    function isLeapYear(uint timestamp) internal pure returns (bool leapYear) {
        (uint year,,) = _daysToDate(timestamp / sec_per_day);
        leapYear = _isLeapYear(year);
    }
    function _isLeapYear(uint year) internal pure returns (bool leapYear) {
        leapYear = ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
    }
    
    function addMonths(uint timestamp, uint _months) internal pure returns (uint newTimestamp) {
        (uint year, uint month, uint day) = _daysToDate(timestamp / sec_per_day);
        month += _months;
        year += (month - 1) / 12;
        month = (month - 1) % 12 + 1;
        uint daysInMonth = _getDaysInMonth(year, month);
        if (day > daysInMonth) {
            day = daysInMonth;
        }
        newTimestamp = _daysFromDate(year, month, day) * sec_per_day + timestamp % sec_per_day;
        require(newTimestamp >= timestamp, "Add months function failed");
    }
    
    function addDays(uint timestamp, uint _days) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp + _days * sec_per_day;
        require(newTimestamp >= timestamp, "Add days function failed");
    }
    
    function timestampFromDateTime(uint year, uint month, uint day, uint hour, uint minute, uint second) internal pure returns (uint timestamp) {
        timestamp = _daysFromDate(year, month, day) * sec_per_day + hour * sec_per_hour + minute * sec_per_minute + second;
    }
    
    function setMonthly(address _user, uint amount, uint interval, uint startDay, uint startMonth, uint startYear, uint startHour, uint startMin) public onlyOwner {
        uint _startHour = startHour + 5; //EST to UTC
        allowance[_user].initTime = timestampFromDateTime(startYear, startMonth, startDay, _startHour, startMin, 0);
        require(allowance[_user].initTime >= block.timestamp, "The date set is not far enough into the future");
        allowance[_user]._reloadAmount = amount;
        reload[_user]._startYear = startYear;
        reload[_user]._startMonth = startMonth;
        reload[_user]._startDay = startDay;
        reload[_user]._startHour = startHour;
        reload[_user]._startMinute = startMin;
        allowance[_user].DailyOrMonthly = false;
        allowance[_user].recurrance = true;
        allowance[_user].i = interval;
        allowance[_user].j = 0;
        allowance[_user].isDeleted = false;
        (uint _year, uint _month, uint _day) = ts_to_MY(allowance[_user].initTime);
        uint daysinM = _getDaysInMonth(_year, _month);
        allowance[_user].repeatSec = daysinM*sec_per_day;
        // repeat sec for monthly to change each month
    }
    
    function setDaily(address _user, uint amount, uint interval, uint startDay, uint startMonth, uint startYear, uint startHour, uint startMin) public onlyOwner {
        uint _startHour = startHour + 5; //EST to UTC
        allowance[_user].initTime = timestampFromDateTime(startYear, startMonth, startDay, _startHour, startMin, 0);
        require(allowance[_user].initTime >= block.timestamp, "The date set is not far enough into the future");
        allowance[_user]._reloadAmount = amount;
        reload[_user]._startYear = startYear;
        reload[_user]._startMonth = startMonth;
        reload[_user]._startDay = startDay;
        reload[_user]._startHour = startHour;
        reload[_user]._startMinute = startMin;
        allowance[_user].DailyOrMonthly = true;
        allowance[_user].recurrance = true;
        allowance[_user].i = interval;
        allowance[_user].j = 0;
        allowance[_user].isDeleted = false;
        allowance[_user].repeatSec = interval*sec_per_day;
    }    
 //End scheduling Section

    function TrueOwner() internal view returns(bool) {
        return owner() == msg.sender;
    }

    function SetAllowance(address _user, uint _amount) public onlyOwner {
        allowance[_user]._allowance+= _amount;
        emit AllowanceChange(_user, msg.sender, _amount, allowance[_user]._allowance, int(_amount) - int(allowance[_user]._allowance));
    }
    
     function UpdateAllowance(address _user, uint _amount) internal onlyOwner Permissions(_amount, _user) {
        emit AllowanceChange(_user, msg.sender, allowance[_user]._allowance - _amount, allowance[_user]._allowance, _x - int(_amount));
        allowance[_user]._allowance -= _amount;
    }

    function ReloadAllowance(address _user, uint _amount) public returns(uint) {
        require(allowance[_user].recurrance == true && allowance[_user].isDeleted == false , "recurring allowance is not active");
        require(allowance[_user]._reloadAmount >= _amount, "You are trying to reload an amount greater than that set by the owner");

        if (allowance[_user].DailyOrMonthly==true) {
            uint nextT = addDays(allowance[_user].initTime, allowance[_user].i*allowance[_user].j);
            uint EST = nextT - 5*sec_per_hour; //Convert to EST
            require(EST <= block.timestamp+120, "It is too early"); //+80 to allow for descrepencies caused by mining time
            allowance[_user]._allowance += _amount;
            allowance[_user].j += 1;
        }
        else {
            // uint nextT = addMonths(allowance[_user].initTime, allowance[_user].i*allowance[_user].j);
            // uint EST = nextT - 5*sec_per_hour;
            return(allowance[_user].j);
            // require(EST <= block.timestamp+120, "It is too early to reload the allowance"); //+80 to allow for descrepencies caused by mining time
            // allowance[_user]._allowance += _amount;
            // allowance[_user].j += 1;
            // (uint _year, uint _month, uint _day) = ts_to_MY(EST);
            // uint daysinM = _getDaysInMonth(_year, _month);
            // allowance[_user].repeatSec = daysinM*sec_per_day;
        }
     }

     function stopReload(address _user) public {
         allowance[_user].isDeleted = true;
     }

    function diffSeconds(uint year, uint month, uint day, uint hour, uint minute) public view returns (uint _seconds) {
        uint ts = block.timestamp;
        uint _hour = hour+5; //convert to UTC
        uint toTimestamp = timestampFromDateTime(year, month, day, _hour, minute, 0);
        //uint toTimestamp = _daysFromDate(year, month, day) * sec_per_day + hour * sec_per_hour + minute * sec_per_minute + second;
        require(ts <= toTimestamp, "The date is not in the future");
        _seconds = toTimestamp - ts;
        return (_seconds);
     }

     function getMap(address _user) public view returns (uint startYear, uint startMonth, uint startDay, uint startHour, uint startMinute, uint interval, string memory period, uint reloadAmount, bool deleteStatus, uint repeatSeconds ) {
        require(allowance[_user].isDeleted == false, "The most recent recurring allowance was  or has not been created yet");
        startYear = reload[_user]._startYear;
        startMonth = reload[_user]._startMonth;
        startDay = reload[_user]._startDay;
        startHour = reload[_user]._startHour;
        startMinute = reload[_user]._startMinute;
        interval = allowance[_user].i;
        if (allowance[_user].DailyOrMonthly == true){
            period = 'Day(s)';
        }
        else {
            period = 'Month(s)';
        }
        reloadAmount = allowance[_user]._reloadAmount;
        deleteStatus = allowance[_user].isDeleted;
        repeatSeconds = allowance[_user].repeatSec;
        return(startYear, startMonth, startDay, startHour, startMinute, interval, period, reloadAmount, deleteStatus, repeatSeconds);
        
     }

}
