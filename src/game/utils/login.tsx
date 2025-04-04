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

    const room = await ColyseusClient.joinRoom(address.toString());

    try {

      // 先尝试使用 JWT 登录
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        console.log("📝 尝试使用 JWT 登录");
        ColyseusClient.sendMessage("jwtLogin", { token: storedToken });

        try {
          const jwtLoginResponse = await new Promise<{
            success: boolean;
            token?: string;
            user?: any;
            userState?: any;
            reason?: string;
          }>((resolve, reject) => {
            room.onMessage("loginResponse", (data) => {
              resolve(data);
            });

            setTimeout(() => reject(new Error("JWT 登录超时")), 5000);
          });

          if (jwtLoginResponse.success) {
            console.log("✅ JWT 登录成功");
            EventBus.emit("phaser_loginResponse", {
              success: true,
              data: {
                walletName: account.address,
                walletAddress: address,
                token: jwtLoginResponse.token,
                user: jwtLoginResponse.user,
                userState: jwtLoginResponse.userState,
              },
            });

            setIsModalOpen(false);

            if (jwtLoginResponse.token) {
              localStorage.setItem("token", jwtLoginResponse.token);
              sessionStorage.setItem("token", jwtLoginResponse.token);
            }
            return;
          } else {
            console.log("❌ JWT 登录失败，清除 token");
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
          }
        } catch (error) {
          console.log("❌ JWT 登录超时，清除 token");
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
      }

      // 如果 JWT 登录失败或超时，继续尝试签名登录
      console.log("尝试签名登录");
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
        address: address,
        signature: signatureResponse.signature,
        challenge: challenge,
      });

      const loginResponse = await new Promise<{
        success: boolean;
        token?: string;
        user?: any;
        userState?: any;
        reason?: string;
      }>((resolve, reject) => {
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
            user: loginResponse.user,
            userState: loginResponse.userState,
          },
        });

        setIsModalOpen(false);

        if (loginResponse.token) {
          localStorage.setItem("token", loginResponse.token);
          sessionStorage.setItem("token", loginResponse.token);
        }
      } else {
        console.error("❌ 登录失败:", loginResponse.reason);
      }
    } catch (error) {
      console.error("❌ 进入游戏失败:", error);
      // 确保在任何错误情况下都清除可能无效的 token
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  };

  return (
    <>
      {isModalOpen
        &&
        <WalletModal
          onClose={() => setIsModalOpen(false)} onGameStart={handleGameStart}
        />
      }
    </>
  );
}