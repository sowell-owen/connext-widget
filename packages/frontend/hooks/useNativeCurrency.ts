import { useAccount } from 'wagmi';

// returns current user's wallet native currency
export function useNativeCurrency(): string {
  const { chain } = useAccount();
  return chain?.nativeCurrency.symbol.toUpperCase() || 'BNB';
}