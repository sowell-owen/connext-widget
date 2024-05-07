export type TChain = {
    name: string;
    chainId: number;
    domainId: string;
    assets: string[];
}

export type TBalanceInChain = {
    chainId: number;
    balance: string;
}

export type TBalanceCfg = {
    address: `0x${string}`;
    chainId: `0x${string}`;
    token? : `0x${string}`;
}