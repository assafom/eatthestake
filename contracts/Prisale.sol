	// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
//import {BytesLib} from "./BytesLib.sol";


contract Prisale {
    using SafeMath for uint256;
    //using BytesLib for bytes;
	
	struct Campaign {
        uint256 id;
		string name;
        IERC20 token;
        uint256 tokenDecimals;

        bool presaleEnabled;
        uint256 pricePerToken;
		uint256 totalTokensBought;

        uint256 lastKnownTokenBalance;
        uint256[] accumulatedTokenDeposits;
	}

    struct UserCampaignInfo {
        uint256 tokensBought;       // Without decimals (eg. 1) - we don't know the token decimals at presale stage
        uint256 lastClaimIndex;
        uint256 totalClaimed;       // Including decimals (eg. 1 * 10**18)
    }
	
    uint256 public numCampaigns;
    mapping(uint256 => Campaign) campaigns;
    mapping(address => mapping (uint256 => UserCampaignInfo)) users;
	
	event newTokenRelease(uint256 campaignId, uint256 amount);
    event newCampaignAdded(uint256 campaignId, string name);
	
	address public owner;
    IERC20 USDTToken;
	
	modifier onlyOwner() {
		require(msg.sender == owner, "Caller is not owner");
		_;
	}

	constructor() {
		owner = msg.sender;
	}

    function setUSDTToken(address _addr)
    public onlyOwner {
        USDTToken = IERC20(_addr);
    }

    /***********************************************
    
            Set up and configure campaign
    
    ************************************************/

    function addCampaign(string calldata _name, uint256 _pricePerToken)
    public onlyOwner returns (uint256 _id) {
        Campaign storage newCampaign = campaigns[numCampaigns];
        newCampaign.id = numCampaigns;
		newCampaign.name = _name;
        newCampaign.pricePerToken = _pricePerToken;
		newCampaign.presaleEnabled = true;

        _id = numCampaigns;
        numCampaigns++;

        emit newCampaignAdded(_id, _name);
    }


    function setCampaignToken(uint256 _id, address _token, uint256 _decimals)
    public onlyOwner {
        campaigns[_id].token = IERC20(_token);
        campaigns[_id].accumulatedTokenDeposits.push(campaigns[_id].token.balanceOf(address(this)));
        //campaigns[_id].tokenDecimals = _decimals;
        campaigns[_id].tokenDecimals = 10**18;
    }

    function endPresale(uint256 _id)
    public onlyOwner {
        campaigns[_id].presaleEnabled = false;
    }


    /***********************************************

                    Import campaign
    
    ************************************************/

    // For efficiency we don't update campaign's setTotalBought here; importer has to call it manually after.
    function addPreviousPurchase(uint256[] calldata _cId, address[] calldata _addr, uint256[] calldata _amountOfTokens, uint256[] calldata _alreadyClaimed )
    external onlyOwner {
        uint256 i;
        for (i=0; i < _cId.length; i++) {
            UserCampaignInfo storage user = users[_addr[i]][_cId[i]];
            user.tokensBought = _amountOfTokens[i];
            user.totalClaimed = _alreadyClaimed[i];
        }
        
    }

    function setTotalBought(uint256 _cId, uint256 _bought)
    external onlyOwner {
        campaigns[_cId].totalTokensBought = _bought;
    }

    function getUserCampaignDetails(uint256 _cId, address _addr)
    external view onlyOwner returns (uint256 bought, uint256 claimed) {
        UserCampaignInfo storage user = users[_addr][_cId];
        bought = user.tokensBought;
        claimed = user.totalClaimed;
    }



    /***********************************************

                    Presale buyers
    
    ************************************************/



    // user must have approved before
    function buy(uint256 _cId, uint256 _amountOfTokens) public {
        Campaign storage campaign = campaigns[_cId];
        UserCampaignInfo storage user = users[msg.sender][_cId];
        require(campaign.presaleEnabled, "presale finished");
        user.tokensBought = user.tokensBought.add(_amountOfTokens);
        campaign.totalTokensBought = campaign.totalTokensBought.add(_amountOfTokens);
        require(USDTToken.transferFrom(msg.sender, address(this), _amountOfTokens.mul(campaign.pricePerToken)), "transfer failed");
    }

    // Claims all the user tokens according to how much was already deposited
    function claim(uint256 _cId)
    public {
        Campaign storage c = campaigns[_cId];
        require(!c.presaleEnabled, "presale hasn't finished");
        UserCampaignInfo storage user = users[msg.sender][_cId];
        require(user.tokensBought > 0, "user didn't participate in presale");
        // Get amount of total released (deposited) tokens. If bigger than last known, save as new latest snapshot.
        (uint256 amountToWithdraw, uint256 totalAccumulatedDeposits) = getClaimableAmountAndTotalReleased(_cId, msg.sender);
        if (totalAccumulatedDeposits > c.accumulatedTokenDeposits[c.accumulatedTokenDeposits.length - 1]) {
            c.accumulatedTokenDeposits.push(totalAccumulatedDeposits);
        }
        // TODO maybe change to return and not revert, will make the user pay for saving the new snapshot.
        require(amountToWithdraw > 0, "no new tokens to claim");
        user.lastClaimIndex = c.accumulatedTokenDeposits.length - 1;
        user.totalClaimed = user.totalClaimed.add(amountToWithdraw);
        uint256 currTokenBalance = c.token.balanceOf(address(this));
        c.lastKnownTokenBalance = currTokenBalance.sub(amountToWithdraw);
        require(c.token.transfer(msg.sender, amountToWithdraw), "transfer failed");
    }


    /***********************************************

                        Views
    
    ************************************************/

    function getFrontendView(uint256 _campaignId)
    external view returns (uint256 _price, uint256 _decimals, uint256 _userBought, uint256 _totalBought, uint256 _released ,uint256 _claimed, uint256 _unclaimed, bool _presaleEnabled, string memory _name) {
        Campaign memory c = campaigns[_campaignId];
        UserCampaignInfo memory u = users[msg.sender][_campaignId];
        _price = c.pricePerToken;
        _decimals = c.tokenDecimals;
        _userBought = u.tokensBought;
        _totalBought = c.totalTokensBought;
        _claimed = u.totalClaimed;
        (_unclaimed, _released) = getClaimableAmountAndTotalReleased(_campaignId, msg.sender);
        _presaleEnabled = c.presaleEnabled;
        _name = c.name;
    }

    function getClaimableAmountAndTotalReleased(uint256 _campaignId, address _addr)
    internal view returns (uint256 amount, uint256 currentTotalReleased) {
        Campaign memory c = campaigns[_campaignId];
        UserCampaignInfo memory user = users[_addr][_campaignId];

        // If presale hasn't ended, we don't know campaign's token yet. User can't claim and nothing has been released.
        if (c.presaleEnabled || c.totalTokensBought == 0) {
            return (0, 0);
        }

        // Calculate total released (deposited) tokens so far
        uint256 currTokenBalance = c.token.balanceOf(address(this));
        if (currTokenBalance > c.lastKnownTokenBalance) {
            // If we have received new tokens since last claim, need to calculate new total tokens released.
            uint256 depositedSinceLastClaim = currTokenBalance.sub(c.lastKnownTokenBalance);
            uint256 lastTotalAccumulatedReleased = c.accumulatedTokenDeposits[c.accumulatedTokenDeposits.length - 1];
            currentTotalReleased = (lastTotalAccumulatedReleased.add(depositedSinceLastClaim));
        } else {
            currentTotalReleased = c.accumulatedTokenDeposits[c.accumulatedTokenDeposits.length - 1];
        }

        // Calculate user's claimable amount: (total deposits from last claimed snapshot) * (his share)
        uint256 newTokensReleased = currentTotalReleased.sub(c.accumulatedTokenDeposits[user.lastClaimIndex]);
        amount = newTokensReleased.mul(user.tokensBought).div(c.totalTokensBought);
        // In the unlikely case that we received more tokens than we should have, make sure user gets only what he deserves
        if (user.totalClaimed.add(amount) > user.tokensBought.mul(c.tokenDecimals)) {
            amount = user.tokensBought.mul(c.tokenDecimals).sub(user.totalClaimed);
        }
    }

    function getPoolTotalAllocation(uint256 _campaignId)
    external view returns (uint256 totalAlloc) {
        totalAlloc = campaigns[_campaignId].totalTokensBought;
    }
}