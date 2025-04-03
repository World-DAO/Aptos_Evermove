import { Aptos, Network } from "@aptos-labs/ts-sdk";

// 等合约完成了需要修改这里

// 合约参数
const CONTRACT_ADDRESS = "0x339d344092acf1fb4872b0a6bedc5a558ba170931905a2265da10eeb9c203795";
const MODULE_NAME = "send";
const FUNCTION_NAME = "add";

// 调用合约的参数
interface PublishParams {
  title: string;
  content: string;
}

/**
 * 调用合约内的 publishAndEarn 函数，发起交易并等待确认
 *
 * @param signAndSubmitTransaction 钱包提供的签名并提交交易的方法
 * @param params 合约函数所需参数
 * @param aptos 已初始化的 Aptos SDK 实例
 * @returns 成功返回 true，否则返回 false
 */
export async function executePublishAndEarnTransaction(
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>,
  params: PublishParams,
  aptos: Aptos
): Promise<boolean> {
  try {
    // 构造调用合约函数的 payload
    const payload = {
      data: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::${FUNCTION_NAME}`,
        typeArguments: [],
        // 将合约函数参数放到 functionArguments 中，这里以故事标题和内容为例
        //functionArguments: [params.title, params.content],
      },
    };

    // 请求签名并提交交易
    const response = await signAndSubmitTransaction(payload);
    console.log("Transaction submitted, hash:", response.hash);

    // 等待交易确认（此处可以根据需要增加超时或重试逻辑）
    await aptos.waitForTransaction({ transactionHash: response.hash });
    console.log("Transaction confirmed.");
    return true;
  } catch (error: any) {
    console.error("Transaction failed:", error);
    return false;
  }
}
