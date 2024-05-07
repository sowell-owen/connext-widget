// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {DestinationVault} from "../src/DestinationVault.sol";


contract DeployDestinationVault is Script {
    function run(address WETH) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address account = vm.addr(deployerPrivateKey);

        console.log("Account:", account);

        vm.startBroadcast(deployerPrivateKey);

        new DestinationVault(WETH);

        vm.stopBroadcast();
    }
}