// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;


import "forge-std/Script.sol";
import "forge-std/console.sol";
import { SourceVaultAdapter } from "../src/SourceVaultAdapter.sol";


contract DeploySourceVaultAdapter is Script {
    function run(address connext, address token) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address account = vm.addr(deployerPrivateKey);

        console.log("Account:", account);

        vm.startBroadcast(deployerPrivateKey);

        new SourceVaultAdapter(connext, token);

        vm.stopBroadcast();
    }
}
 