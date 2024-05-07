// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IXReceiver} from "@connext/interfaces/core/IXReceiver.sol";


contract DestinationVault is IXReceiver {
    IERC20 public immutable WETH;

    mapping(address => uint256) public balanceOf;

    constructor(address _WETH) {
        WETH = IERC20(_WETH);
    }

    function _deposit(address _token, uint256 _amount) internal {
        IERC20 token = IERC20(_token);

        require(_token == address(WETH), "Token must be WETH");
        require(_amount > 0, "Amount cannot be zero");
        require(
            token.allowance(msg.sender, address(this)) >= _amount,
            "User must approve amount"
        );

        token.transferFrom(msg.sender, address(this), _amount);

        balanceOf[msg.sender] += _amount;
    }

    function xReceive(
        bytes32 _transferId,
        uint256 _amount,
        address _asset,
        address _originSender,
        uint32 _origin,
        bytes memory _callData
    ) external returns (bytes memory) {
        // Check for the right token
        require(_asset == address(WETH), "Wrong asset received");
        // Enforce a cost to deposit
        require(_amount > 0, "Must pay at least 1 wei");

        // Unpack the _callData
        (address _token, uint256 _amountOut) = abi.decode(_callData, (address, uint256));
        
        _deposit(_token, _amountOut);
    }

}


