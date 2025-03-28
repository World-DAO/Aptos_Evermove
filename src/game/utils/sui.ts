import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

interface Profile {
  address: string;
  suiBalance: number;
  suiName: string;
  avatar: string;
}
// use getFullnodeUrl to define Devnet RPC location
const rpcUrl = getFullnodeUrl('testnet');
const suiClient = new SuiClient({ url: rpcUrl });

export const getSuiBalance = async (address: string) => {
  const balance = await suiClient.call("suix_getBalance", [address]);
  const balanceInSui = (balance as any).totalBalance/10**9;
  return Number(balanceInSui.toFixed(2))
};

export const getProfile = async (address: string): Promise<Profile> => {
  const balance = await getSuiBalance(address);
  const profile = await suiClient.call("suix_getProfile", [address]);
  return {
    address,
    suiBalance: balance,
    suiName: "32",
    avatar: "323"
  };
};

