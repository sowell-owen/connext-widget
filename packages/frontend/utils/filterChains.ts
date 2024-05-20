import { VAULT_ADPATER_CHAIN_ID } from "../constants";

export default function filterChains(data: any[]) {
    return data.filter(i => i.chainId !== +VAULT_ADPATER_CHAIN_ID)
}