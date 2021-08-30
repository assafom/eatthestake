// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Staker is Ownable {
    using SafeMath for uint256;

    struct UserInfo {
        uint256 deposited;
        uint256 rewardsAlreadyConsidered;
    }

    uint256 public rewardPeriodEndTimestamp;
    uint256 public rewardPerSecond; // multiplied by 1e7

    uint256 public lastRewardTimestamp;
    uint256 public accumulatedRewardPerShare; // multiplied by 1e12

    IERC20 public depositToken;
    IERC20 public rewardToken;

    mapping (address => UserInfo) users;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    

    constructor(address _depositToken, address _rewardToken) {
        depositToken = IERC20(_depositToken);
        rewardToken = IERC20(_rewardToken);
    }

    // User should have allowed transfer before.
    function addRewards(uint256 _rewardsAmount, uint256 _lengthInDays)
    external onlyOwner {
        require(block.timestamp > rewardPeriodEndTimestamp, "Staker: can't add rewards before period finished"); // TODO: might be not necessary, need to check
        updateRewards();
        rewardPeriodEndTimestamp = block.timestamp.add(_lengthInDays.mul(24*60*60));
        rewardPerSecond = _rewardsAmount.mul(1e7).div(_lengthInDays).div(24*60*60);
        //lastRewardTimestamp = block.timestamp;
        require(rewardToken.transferFrom(msg.sender, address(this), _rewardsAmount), "Staker: transfer failed");
    }

    function updateRewards()
    public {
        if (block.timestamp <= lastRewardTimestamp) {
            return;
        }
        uint256 totalStaked = depositToken.balanceOf(address(this));
        if ((totalStaked == 0) || lastRewardTimestamp > rewardPeriodEndTimestamp) {
            lastRewardTimestamp = block.timestamp;
            return;
        }
        //uint256 multiplier
        uint256 endingTime;
        if (block.timestamp > rewardPeriodEndTimestamp) {
            endingTime = rewardPeriodEndTimestamp;
        } else {
            endingTime = block.timestamp;
        }
        uint256 secondsSinceLastRewardUpdate = endingTime.sub(lastRewardTimestamp);
        uint256 totalNewReward = secondsSinceLastRewardUpdate.mul(rewardPerSecond);
        accumulatedRewardPerShare = accumulatedRewardPerShare.add(totalNewReward.mul(1e12).div(totalStaked));
        lastRewardTimestamp = block.timestamp;
        if (block.timestamp > rewardPeriodEndTimestamp) {
            rewardPerSecond = 0;
        }
    }

    // User should have allowed transfer before.
    function deposit(uint256 _amount)
    public {
        UserInfo storage user = users[msg.sender];
        updateRewards();
        // Send reward for previous deposits
        if (user.deposited > 0) {
            uint256 pending = user.deposited.mul(accumulatedRewardPerShare).div(1e12).div(1e7).sub(user.rewardsAlreadyConsidered);
            require(rewardToken.transfer(msg.sender, pending), "Staker: transfer failed");
        }
        require(depositToken.transferFrom(msg.sender, address(this), _amount), "Staker: transferFrom failed");
        user.deposited = user.deposited.add(_amount);
        user.rewardsAlreadyConsidered = user.deposited.mul(accumulatedRewardPerShare).div(1e12).div(1e7);
        emit Deposit(msg.sender, _amount);
    }
    

    function withdraw(uint256 _amount)
    public {
        UserInfo storage user = users[msg.sender];
        require(user.deposited >= _amount, "Staker: balance not enough");
        updateRewards();
        uint256 pending = user.deposited.mul(accumulatedRewardPerShare).div(1e12).div(1e7).sub(user.rewardsAlreadyConsidered);
        require(rewardToken.transfer(msg.sender, pending), "Staker: reward transfer failed");
        user.deposited = user.deposited.sub(_amount);
        user.rewardsAlreadyConsidered = user.deposited.mul(accumulatedRewardPerShare).div(1e12).div(1e7);
        require(depositToken.transfer(msg.sender, _amount), "Staker: deposit withdrawal failed");
        emit Withdraw(msg.sender, _amount);
    }

    function claim()
    external {
        UserInfo storage user = users[msg.sender];
        if (user.deposited == 0)
            return;

        updateRewards();
        uint256 pending = user.deposited.mul(accumulatedRewardPerShare).div(1e12).div(1e7).sub(user.rewardsAlreadyConsidered);
        require(rewardToken.transfer(msg.sender, pending), "Staker: transfer failed");
        user.rewardsAlreadyConsidered = user.deposited.mul(accumulatedRewardPerShare).div(1e12).div(1e7);
        
    }

    function withdraw2(uint256 _amount)
    public {
        depositToken.transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount);
    }

    function pendingRewards(address _user)
    public view returns (uint256) {
        UserInfo storage user = users[_user];
        uint256 accumulated = accumulatedRewardPerShare;
        uint256 totalStaked = depositToken.balanceOf(address(this));
        if (block.timestamp > lastRewardTimestamp && lastRewardTimestamp <= rewardPeriodEndTimestamp && totalStaked != 0) {
            uint256 endingTime;
            if (block.timestamp > rewardPeriodEndTimestamp) {
                endingTime = rewardPeriodEndTimestamp;
            } else {
                endingTime = block.timestamp;
            }
            uint256 secondsSinceLastRewardUpdate = endingTime.sub(lastRewardTimestamp);
            uint256 totalNewReward = secondsSinceLastRewardUpdate.mul(rewardPerSecond);
            accumulated = accumulated.add(totalNewReward.mul(1e12).div(totalStaked));
        }
        return user.deposited.mul(accumulated).div(1e12).div(1e7).sub(user.rewardsAlreadyConsidered);
    }


    function getFrontendView()
    external view returns (uint256 _rewardPerSecond, uint256 _secondsLeft, uint256 _deposited, uint256 _pending) {
        if (block.timestamp <= rewardPeriodEndTimestamp) { // else, defaults to 0
            _secondsLeft = rewardPeriodEndTimestamp.sub(block.timestamp); 
            _rewardPerSecond = rewardPerSecond.div(1e7);
        }
        _deposited = users[msg.sender].deposited;
        _pending = pendingRewards(msg.sender);
    }
    
    // For testing
    function getTime()
    public view returns (uint256) {
        return block.timestamp;
    }
}