"use client";

import { useEffect, useState } from "react";
import { EventBus } from "../EventBus";
import { WalletModal } from "@/components/WalletModal";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import ColyseusClient from "@/game/utils/ColyseusClient";

export function ReactPhaserBridge() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connected, account, signMessage } = useWallet();

  useEffect(() => {
    const loginHandler = async () => {
      try {
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to open wallet selector:", error);
      }
    };

    EventBus.on("phaser_loginRequest", loginHandler);

    return () => {
      EventBus.removeListener("phaser_loginRequest", loginHandler);
    };
  }, []);

  const handleGameStart = async () => {
    if (!connected || !account) {
      console.error("❌ Wallet not connected!");
      alert("Please connect your wallet first!");
      return;
    }

    const address = account.address;
    console.log("🎮 Connecting to Colyseus, wallet address:", address);

    try {
      const room = await ColyseusClient.joinRoom(address.toString());
      ColyseusClient.sendMessage("userLogin", { address });

      const loginChallenge = await new Promise<{ challenge: string }>((resolve, reject) => {
        room.onMessage("loginChallenge", (data) => {
          if (data.challenge) {
            resolve(data);
          } else {
            reject(new Error("No challenge received"));
          }
        });

        setTimeout(() => reject(new Error("⏳ Challenge timeout")), 5000);
      });

      const challenge = loginChallenge.challenge;
      console.log("Challenge:", challenge);

      // ✅ Aptos 签名方式
      const signatureResponse = await signMessage({
        message: challenge,
        nonce: "AptosDapp",
      });

      console.log("signature:", signatureResponse.signature);

      ColyseusClient.sendMessage("loginSignature", {
        address,
        signature: signatureResponse.signature,
        challenge: challenge,
      });

      const loginResponse = await new Promise<{ success: boolean; token?: string; reason?: string }>((resolve, reject) => {
        room.onMessage("loginResponse", (data) => {
          resolve(data);
        });

        setTimeout(() => reject(new Error("loginResponse timeout")), 5000);
      });

      console.log("loginResponse:", loginResponse);

      if (loginResponse.success) {
        EventBus.emit("phaser_loginResponse", {
          success: true,
          data: {
            walletName: account.address,
            walletAddress: address,
            token: loginResponse.token,
          },
        });

        setIsModalOpen(false); // 关闭钱包选择弹窗

        // 存储 Token
        if (loginResponse.token) {
          localStorage.setItem("token", loginResponse.token);
          sessionStorage.setItem("token", loginResponse.token);
        }
      } else {
        console.error("❌ Login failed:", loginResponse.reason);
      }
    } catch (error) {
      console.error("❌ Failed to enter game:", error);
    }
  };

  return (
    <>
      {isModalOpen && <WalletModal onClose={() => setIsModalOpen(false)} onGameStart={handleGameStart} />}
    </>
  );
}