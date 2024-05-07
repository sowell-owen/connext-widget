// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IConnext} from "@connext/interfaces/core/IConnext.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SourceVaultAdapter {
    // The Connext contract on this domain
    IConnext public immutable connext;

    // The token to be paid on this domain
    IERC20 public immutable token;

    constructor(address _connext, address _token) {
        connext = IConnext(_connext);
        token = IERC20(_token);
    }

    function xDeposit (
        address targetContarctAddress, 
        uint32 destinationDomainId,
        uint256 slippage,
        uint256 amount,
        uint256 relayerFee
    ) external payable {
        require(token.allowance(msg.sender, address(this)) >= amount, "User must approve amount");

        // User sends funds to this contract
        token.transferFrom(msg.sender, address(this), amount);

        // This contract approves transfer to Connext
        token.approve(address(connext), amount);

        bytes memory encodedData = abi.encode(address(token), amount);

        connext.xcall{value: relayerFee}(
            destinationDomainId,   // _destination: Domain ID of the destination chain
            targetContarctAddress, // _to: address of the target contract
            address(token),        // _asset: address of the token contract
            msg.sender,            // _delegate: address that can revert or forceLocal on destination
            amount,                // _amount: amount of tokens to transfer
            slippage,              // _slippage: max slippage the user will accept in BPS (e.g. 300 = 3%)
            encodedData            // _callData: the encoded calldata to send
        );
    }
}