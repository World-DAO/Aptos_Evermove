import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

import { cacheWithSessionStorageDecorator } from "./dex";

import siteConfig from "./config";

const suiNetwork = siteConfig.SUI_NETWORK as
  | "testnet"
  | "mainnet"
  | "devnet"
  | "localnet";
const WALRUS_PUBLISHER_URL = siteConfig.WALRUS_PUBLISHER_URL;
const WALRUS_AGGREGATOR_URL = siteConfig.WALRUS_AGGREGATOR_URL;
const numEpochs = 1;

function detectMediaType(buffer: ArrayBuffer, contentType: string) {
  const header = new Uint8Array(buffer.slice(0, 12));
  
  // 视频类型检测
  if (contentType.startsWith('video/')) {
    if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) 
      return 'video/mp4';
    if (header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3)
      return 'video/webm';
    return 'video';
  }

  // 图片类型检测
  if (contentType.startsWith('image/')) {
    if (header[0] === 0xFF && header[1] === 0xD8) return 'image/jpeg';
    if (header[0] === 0x89 && header[1] === 0x50) return 'image/png';
    return 'image';
  }

  // 音频类型检测
  if (contentType.startsWith('audio/')) {
    if (header[0] === 0x49 && header[1] === 0x44) return 'audio/mpeg';
    if (header[0] === 0x4F && header[1] === 0x67) return 'audio/ogg';
    return 'audio';
  }

  // 默认文本类型
  return 'text';
}

export async function getBlob(id: string) {
  try {
    // 获取完整文件
    const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${id}`);
    if (!response.ok) return null;

    // 检测内容类型
    const contentType = response.headers.get('Content-Type') || '';
    const buffer = await response.arrayBuffer();
    
    // 增强类型检测
    const mediaType = detectMediaType(buffer, contentType);
    
    return {
      content: mediaType === 'text' 
        ? new TextDecoder().decode(buffer) 
        : `${WALRUS_AGGREGATOR_URL}/v1/blobs/${id}`,
      mediaType
    };
  } catch (error) {
    console.error('获取失败:', error);
    return null;
  }
}

export const getBlobWithCache = cacheWithSessionStorageDecorator(getBlob);

export async function storeBlob(inputFiles: (File | string)[]) {
  const results = await Promise.all(
    inputFiles.map(async (input) => {
      const formData = new FormData();
      const isFile = typeof input !== 'string';
      const blob = isFile ? input : new Blob([input], { type: 'text/plain' });

      // 添加存储参数
      const params = new URLSearchParams({
        epochs: numEpochs.toString(),
        deletable: 'true', // 允许后续删除
        // send_object_to: '目标地址' // 可选参数
      });

      // 构建请求
      const response = await fetch(
        `${WALRUS_PUBLISHER_URL}/v1/blobs?${params}`,
        {
          method: 'PUT',
          body: isFile ? blob : JSON.stringify(blob),
          headers: isFile ? {} : { 'Content-Type': 'application/json' }
        }
      );
      console.log(response);
      // 统一处理响应
      if (!response.ok) throw new Error(`存储失败: ${response.statusText}`);
      return response.json();
    })
  );

  // 提取存储结果
  return results.map(res => ({
    blobId: res.newlyCreated?.blobObject.blobId || res.alreadyCertified?.blobId,
    objectId: res.newlyCreated?.blobObject.id || res.alreadyCertified?.event.txDigest
  }));
}


async function getObjectFromTx(txId: string) {
  const suiClient = new SuiClient({
    url: getFullnodeUrl(suiNetwork),
  });

  const rst = await suiClient.getTransactionBlock({
    digest: txId,
    options: {
      showInput: true,
    },
  });

  if (!rst.transaction) {
    throw new Error("Transaction data not found");
  }
  // @ts-expect-error We know this is the correct type for the Sui SDK
  const inputs = rst.transaction.data.transaction.inputs;
  const { objectId } = inputs.find(
    // @ts-expect-error We know this is the correct type for the Sui SDK
    ({ type, objectType }) =>
      type === "object" && objectType === "immOrOwnedObject",
  );

  return objectId;
}
