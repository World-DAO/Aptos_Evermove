import express from "express";
import { aiService } from "../services/aiService";
import { StoryService } from "../services/storyServices";
import { UserService } from "../services/userService";
import { TxnService } from "../services/txnService";

const router = express.Router();

/**
 * 获取用户和 AI 的聊天记录
 */
router.get("/chat_history", async (req, res) => {
    const { user_id, prev_cnt } = req.query;
    if (!user_id) {
        return res.status(400).json({ error: "userId is required" });
    }
    const prevCnt = Number(prev_cnt);
    try {
        const history = await aiService.getChatHistory(user_id as string, prevCnt);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

router.get("/sent_bottle_msg", async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {
        return res.status(400).json({ error: "userId is required" });
    }
    try {
        const bottles = await aiService.getStoryByAuthor(user_id as string);
        res.json(bottles);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sent bottle messages" });
    }
});

router.get("/recv_bottle_msg", async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {
        return res.status(400).json({ error: "userId is required" });
    }
    try {
        const bottles = await aiService.getLikedStories(user_id as string);
        res.json(bottles);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch receive bottle messages" });
    }
})

/**
 * @route POST /createTxn
 * @desc 创建一笔新的交易
 */
router.post("/createTxn", async (req, res) => {
    const { objectId, replyId, sender, receiver, amount, tokenType } = req.body;

    if (!objectId || !replyId || !sender || !receiver || !amount || !tokenType) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const response = await TxnService.createNewTransaction(objectId, replyId, sender, receiver, amount, tokenType);
    res.json(response);
});

/**
 * @route GET /getTxnByReply/:replyId
 * @desc 根据 replyId 获取绑定的交易信息
 */
router.get("/getTxnByReply/:replyId", async (req, res) => {
    const { replyId } = req.params;

    if (!replyId) {
        return res.status(400).json({ success: false, message: "Reply ID is required" });
    }

    const response = await TxnService.fetchTransactionByReply(replyId);
    res.json(response);
});

/**
 * @route PUT /updateTxn
 * @desc 更新交易状态
 */
router.put("/updateTxn", async (req, res) => {
    const { objectId, status } = req.body;

    if (!objectId || !status) {
        return res.status(400).json({ success: false, message: "Object ID and status are required" });
    }

    const response = await TxnService.modifyTransactionStatus(objectId, status);
    res.json(response);
});

/**
 * @route POST /claim
 * @desc 领取交易
 */
router.post("/claim", async (req, res) => {
    const { receiver, objectId } = req.body;

    if (!receiver || !objectId) {
        return res.status(400).json({ success: false, message: "Receiver and Object ID are required" });
    }

    const response = await TxnService.claimUserTransaction(receiver, objectId);
    res.json(response);
});

/**
 * @route POST /userSession
 * @desc 用户支付并创建会话
 */
router.post("/userSession", async (req, res) => {
    const { txnObjectId, sessionId, userAddress, receiverAddress, amount, tokenType } = req.body;

    if (!txnObjectId || !sessionId || !userAddress || !receiverAddress || !amount || !tokenType) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const response = await TxnService.startUserSession(txnObjectId, sessionId, userAddress, receiverAddress, amount, tokenType);
        res.json({ success: true, data: response });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /aiCreateNft
 * @desc AI 创建 NFT
 */
router.post("/aiCreateNft", async (req, res) => {
    const { nftObjectId, userAddress } = req.body;

    if (!nftObjectId || !userAddress) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const response = await TxnService.aiReplyWithNFT(nftObjectId, userAddress);
        res.json({ success: true, data: response });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /claimRewards
 * @desc 领取 AI 会话奖励（NFT）
 */
router.post("/claimRewards", async (req, res) => {
    const { userAddress } = req.body;

    if (!userAddress) {
        return res.status(400).json({ success: false, message: "User address is required" });
    }

    try {
        const response = await TxnService.claimRewards(userAddress);
        res.json({ success: true, data: response });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});
export default router;