// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract OldStaker is Ownable {
    using SafeMath for uint256;

    struct RewardPeriod {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardPerDay;

        // For calculation of each user's weighted contribution
        uint256 timeMultiplier;
        uint256 depositMultiplier;
        uint256 totalRewardPoints;
    }

    struct UserPeriodInfo {
        uint256 deposited;
        uint256 rewardPoints;
        uint256 rewardsClaimed;
    }

    IERC20 depositToken;
    IERC20 rewardToken;

    mapping (uint256 => RewardPeriod) periods;
    uint256 currentRewardPeriod;

    mapping (address => mapping (uint256 => UserPeriodInfo)) userRewards;
    mapping (address => uint256) userLastPeriodClaimed;

    constructor(address _depositToken, address _rewardToken) {
        depositToken = IERC20(_depositToken);
        rewardToken = IERC20(_rewardToken);
    }

    // Owner should have approved beforehand
    function addRewardPeriod(uint256 _totalRewards, uint256 _lengthInDays, uint256 _rewardPerDay, uint256 _timeMultiplier, uint256 _depositMultiplier)
    external onlyOwner {
        currentRewardPeriod++;
        RewardPeriod storage period;
        period.id = currentRewardPeriod;
        period.startTime = block.timestamp;
        period.endTime = block.timestamp + _lengthInDays.mul(24).mul(60).mul(60);
        period.rewardPerDay = _rewardPerDay;
        period.timeMultiplier = _timeMultiplier;
        period.depositMultiplier = _depositMultiplier;
        require(rewardToken.transferFrom(msg.sender, address(this), _totalRewards), "Staker: transfer failed");
        periods[currentRewardPeriod] = period;
    }

    // Should have approved before
    function stake(uint256 _amount)
    external {
        require(depositToken.transferFrom(msg.sender, address(this), _amount), "Staker: transfer failed");
        UserPeriodInfo storage user = userRewards[msg.sender][currentRewardPeriod];
        RewardPeriod storage period = periods[currentRewardPeriod];
        //if (user.deposited != 0) {
            user.deposited.add(_amount);
            uint256 stakeDays = period.endTime.sub(block.timestamp).div(24).div(60).div(60);
            uint256 stakeRewards = stakeDays.mul(period.timeMultiplier).add((_amount.mul(period.depositMultiplier)));
            user.rewardPoints.add(stakeRewards);
            period.totalRewardPoints.add(stakeRewards);
        //}
    }


    function claim(uint256 _amount)
    external {
        require(depositToken.transferFrom(msg.sender, address(this), _amount), "Staker: transfer failed");
        UserPeriodInfo storage user = userRewards[msg.sender][currentRewardPeriod];
        RewardPeriod storage period = periods[currentRewardPeriod];
        //if (user.deposited != 0) {
            user.deposited.add(_amount);
            uint256 stakeDays = period.endTime.sub(block.timestamp).div(24).div(60).div(60);
            uint256 stakeRewards = stakeDays.mul(period.timeMultiplier).add((_amount.mul(period.depositMultiplier)));
            user.rewardPoints.add(stakeRewards);
            period.totalRewardPoints.add(stakeRewards);
        //}
    }
    
}