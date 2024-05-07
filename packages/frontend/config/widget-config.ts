import { http, createConfig } from '@wagmi/core'
import {
    arbitrum,
    base,
    mainnet,
    optimism,
    polygon,
    bsc,
    linea,
    metis,
    mode,
    gnosis,
    sepolia
  } from '@wagmi/core/chains';
import { Chain } from 'viem';
import { VAULT_ADPATER_CHAIN_ID } from '../constants';

export const wagmiConfigCore = createConfig({
    chains: [
        arbitrum as Chain,
        base as Chain,
        mainnet as Chain,
        optimism as Chain,
        polygon as Chain,
        bsc as Chain,
        linea as Chain,
        metis as Chain,
        mode as Chain,
        gnosis as Chain,
        sepolia as Chain
    ],
    transports: {
        [arbitrum.id]: http(),
        [base.id]: http(),
        [mainnet.id]: http(),
        [optimism.id]: http(),
        [polygon.id]: http(),
        [bsc.id]: http(),
        [linea.id]: http(),
        [metis.id]: http(),
        [mode.id]: http(),
        [gnosis.id]: http(),
        [sepolia.id]:http(),
    },
});


// returns chains config which will be passed into sdkConfig.chains key
const generateChainConfigurations = (chains: any[]) => {
    return chains.reduce((acc, chain) => {
        acc[chain.domain_id] = {
            providers: [chain.provider],
        };
        return acc;
    }, {});
};

export const chains = [
    {
        name: "Ethereum Mainnet",
        provider: "https://eth.llamarpc.com",
        domain_id: "6648936",
        chain_id: "1",
        nativeUSDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    {
        name: "Polygon",
        provider: "https://1rpc.io/matic",
        domain_id: "1886350457",
        chain_id: "137",
        nativeUSDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
    },
    {
        name: "Optimism",
        provider: "https://rpc.ankr.com/optimism",
        domain_id: "1869640809",
        chain_id: "10",
        nativeUSDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
    },
    {
        name: "Arbitrum One",
        provider: "https://arbitrum.llamarpc.com",
        domain_id: "1634886255",
        chain_id: "42161",
        nativeUSDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
    },
    {
        name: "Gnosis Chain",
        provider: "https://gnosis-rpc.publicnode.com",
        domain_id: "6778479",
        chain_id: "100",
        nativeUSDC: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
    },
    {
        name: "BNB Chain",
        provider: "https://endpoints.omniatech.io/v1/bsc/mainnet/public",
        domain_id: "6450786",
        chain_id: "56",
        nativeUSDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
    },
    {
        name: "Linea",
        provider: "https://linea.decubate.com",
        domain_id: "1818848877",
        chain_id: "59144",
        nativeUSDC: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff"
    },
    {
        name: "Metis",
        provider: "https://metis-mainnet.public.blastapi.io",
        domain_id: "1835365481",
        chain_id: "1088",
        nativeUSDC: "0xEA32A96608495e54156Ae48931A7c20f0dcc1a21"
    },
    {
        name: "Base",
        provider: "https://base.llamarpc.com",
        domain_id: "1650553709",
        chain_id: "8453",
        nativeUSDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
    },
    {
        name: "Mode",
        provider: "https://1rpc.io/mode",
        domain_id: "1836016741",
        chain_id: "34443",
        nativeUSDC: ''
    }
];


export const generateSDKConfig = (address: `0x${string}`, network: "testnet" | "mainnet" | "local" | undefined) => {
    const sdkConfig = {
        signerAddress: address, // address of the wallet owner
        // Use `mainnet` when you're ready...
        network,
        // Add more chains here! Use mainnet domains if `network: mainnet`.
        // This information can be found at https://docs.connext.network/resources/supported-chains
        chains: generateChainConfigurations(chains.filter(i => i.chain_id !== VAULT_ADPATER_CHAIN_ID)),
    };
    return sdkConfig;
}


export const WETH_CONFIG: Record<number, string> = {
    // gnosis (xdai)
    6778479: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
    // optimism
    1869640809: "0x4200000000000000000000000000000000000006",
    // bsc
    6450786: "0x4DB5a66E937A9F4473fA95b1cAF1d1E1D62E29EA", //"0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    // ethereum mainnet
    6648936: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    // arbitrum
    1634886255: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    // polygon
    1886350457: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    // base
    1650553709: "0x4200000000000000000000000000000000000006",
    // linea
    1818848877: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
    // metis
    1835365481: "0x420000000000000000000000000000000000000a",
    // mode
    1836016741: "0x4200000000000000000000000000000000000006",
};