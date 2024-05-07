# Deploy Contracts

Uses Forge scripting to deploy, verify, and run various tasks on contracts. By default the commands are set to act on Polygon contracts.


## Destination-Vault
Deploy

Contract Address: 0x6Ff7eBC8cC7Ac82eA4E50c98536363721d39AB65
Block: 206076262

```
forge script script/DeployDestinationVault.s.sol:DeployDestinationVault --sig 'run(address)' 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 --rpc-url https://arbitrum.drpc.org --broadcast --priority-gas-price 1000000
```

Verify

Response: `OK`
GUID: `v3ayy2hm34fj1xqweljbr9kvknjuaseacmtx8gdkayt9knh9cs`
URL: https://arbiscan.io/address/0x53aa333027888f51c10e309610748ce371d85eef

```
forge verify-contract <destination_vault> src/DestinationVault.sol:DestinationVault --chain 42161 --etherscan-api-key <arbiscan_api_key> --constructor-args $(cast abi-encode "constructor(address)" 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1)
```

## Source-Vault-Adapter
Deploy

Contract Address: 0x9827C9A21EE4E31502707354433fcC1CCE9E46F6
Block: 206077397

```
forge script script/DeploySourceVaultAdapter.s.sol:DeploySourceVaultAdapter --sig 'run(address,address)' 0xEE9deC2712cCE65174B561151701Bf54b99C24C8 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 --rpc-url https://arbitrum.llamarpc.com --broadcast --priority-gas-price 1000000
```

Verify

Response: `OK`
GUID: `gjtvblhenahplcpf7d4spy8zbshcbx6ah9lv8hbgfutudbdrk5`
URL: https://arbiscan.io/address/0x39a249102fb7d13e86ca7ee88222529be76ae4ce

```
forge verify-contract <source_vault_adapter> src/SourceVaultAdapter.sol:SourceVaultAdapter --chain 42161 --etherscan-api-key <arbiscan_api_key> --constructor-args $(cast abi-encode "constructor(address,address)" 0xEE9deC2712cCE65174B561151701Bf54b99C24C8 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1)
```

