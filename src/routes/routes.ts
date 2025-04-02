import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { aiService } from "../services/aiService";
import { StoryService } from "../services/storyServices";
import { UserService } from "../services/userService";
import { TxnService } from "../services/txnService";
import { ReplyService } from "../services/replyService";
import { getStoryById } from "../database/storyDB";
import { generateJWT, verifyAptosSignature, verifyJWT, verifySuiSignature } from "../utils/jwtUtils";
import e from "express";

const router = express.Router();

const loginChallenges: Record<any, string> = {};

function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No JWT provided." });
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    console.log(`Token: ${token}`);
    const decoded = verifyJWT(token);
    if (!decoded || !("address" in decoded)) {
        return res.status(401).json({ error: "Invalid JWT." });
    }
    (req as any).userAddress = (decoded as any).address;
    next();
}

/**
 * POST /login
 * 生成登录挑战，要求传入 { address }
 */
router.post("/login", async (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ success: false, reason: "Address is required." });
    }
    // 生成一个随机挑战
    const challenge = crypto.randomBytes(32).toString("hex");
    // 存储挑战（以地址为 key）
    loginChallenges[address] = challenge;
    if (address instanceof Uint8Array) {
        const hexAddress = "0x" + Buffer.from(address).toString("hex");
        console.log(`Player ${hexAddress} login initiated with challenge ${challenge}`);
    } else {
        console.log(`Player ${address} login initiated with challenge ${challenge}`);
    }
    res.json({ success: true, challenge });
});

/**
 * POST /login-signature
 * 用户使用私钥对挑战签名，验证签名后返回 JWT
 * 请求体需要 { address, signature, challenge }
 */
router.post("/login_signature", async (req: Request, res: Response) => {
    const { address, signature, challenge } = req.body;
    if (!challenge || !address) {
        return res.status(400).json({ success: false, reason: "Address and challenge are required." });
    }
    // 验证挑战是否匹配
    if (loginChallenges[address] !== challenge) {
        return res.status(400).json({ success: false, reason: "Challenge mismatch. Please initiate login again." });
    }
    try {
        // 区分 Sui 和 Aptos 签名
        if (address instanceof Uint8Array) {
            console.log("Aptos signature detected.");
            const hexAddress = "0x" + Buffer.from(address).toString("hex");
            console.log("Hex Address:", hexAddress);
            if (await verifyAptosSignature(hexAddress, challenge, signature) === false) {
                throw new Error("Signature verification failed.");
            }
        } else {
            console.log("Sui signature detected.");
            if (await verifySuiSignature(address, challenge, signature) === false) {
                throw new Error("Signature verification failed.");
            }
        }


        // 读取用户信息
        const user = await UserService.getUser(address);
        const userState = await UserService.getDailyState(address);
        // 签名通过，生成 JWT
        const token = generateJWT({ address });
        // 清除挑战
        delete loginChallenges[address];
        res.json({ success: true, token });
    } catch (error: any) {
        res.status(400).json({ success: false, reason: error.message });
    }
});

/**
 * POST /stories
 * 发布故事。需要认证，且请求体包含 { title, storyText }
 */
router.post("/stories", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    const { title, storyText, isPay } = req.body; // 新增 isPay 参数
    try {
        // 将 isPay 传递给 service 层，默认为 false（普通故事）或 true（付费故事）
        const story = await StoryService.publishUserStory(address, title, storyText, isPay);
        res.json({ success: true, story });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

router.post("/stories/sync", async (req: Request, res: Response) => {
    const { wallet, title, content } = req.body;
    try {
        const story = await StoryService.publishUserStory(wallet, title, content);
        res.json({ success: true, story });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * DELETE /stories/:storyId
 * 删除故事。需要认证。
 */
router.delete("/stories/:storyId", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    const { storyId } = req.params;
    try {
        await StoryService.deleteStory(address, storyId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /stories
 * 获取用户所有故事（按时间倒序排序）。需要认证。
 */
router.get("/stories", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        const stories = await StoryService.getAllStory(address);
        res.json({ success: true, stories });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /stories/daily
 * 获取用户每日故事。需要认证。
 */
router.get("/stories/daily", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        const dailyStories = await StoryService.getDailyStories(address);
        res.json({ success: true, dailyStories });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /stories/random
 * 获取随机故事。需要认证。
 */
router.get("/stories/random", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        const story = await StoryService.fetchRandomStory(address);
        res.json({ success: true, story });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /whiskey/send
 * 赠送威士忌。需要认证，传 { storyId }
 */
router.post("/whiskey/send", authenticate, async (req: Request, res: Response) => {
    const fromAddress = (req as any).userAddress;
    const { storyId } = req.body;
    try {
        await StoryService.sendWhiskey(fromAddress, storyId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /whiskey/points
 * 获取威士忌积分。需要认证。
 */
router.get("/whiskey/points", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        const points = await UserService.getWhiskeyPoints(address);
        res.json({ success: true, points });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /whiskey/points
 * 更新威士忌积分。需要认证，传 { newPoints }
 */
router.post("/whiskey/points", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    const { newPoints } = req.body;
    try {
        await UserService.updateWhiskeyPoints(address, newPoints);
        res.json({ success: true, newPoints });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});


/**
 * POST /reply/story
 * 回复故事。需要认证，传 { storyId, replyText }
 */
router.post("/reply/story", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    const { storyId, replyText } = req.body;
    try {
        const reply = await ReplyService.replyStory(address, storyId, replyText);
        res.json({ success: true, reply });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /reply/user
 * 回复用户。需要认证，传 { targetUserAddress, replyText, storyId }
 */
router.post("/reply/user", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    const { targetUserAddress, replyText, storyId } = req.body;
    try {
        const reply = await ReplyService.replyBack(address, storyId, replyText, targetUserAddress);
        res.json({ success: true, reply });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /replies/story/:storyId
 * 获取某个故事的回复记录。需要认证。
 */
router.get("/replies/story/:storyId", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    console.log("GetReplyies Request by address:", address);
    const storyId = Number(req.params.storyId);
    try {
        const replies = await ReplyService.getRepliesForStoryByUser(address, storyId);
        console.log({ success: true, replies });
        res.json({ success: true, replies });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /replies/session/:target_address/:storyId
 * 获取用户之间的回复记录。需要认证。
 */
router.get("/replies/session/:target_address/:storyId", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    const targetAddress = req.params.target_address;
    const storyId = Number(req.params.storyId);
    try {
        const replies = await ReplyService.getRepliesBetweenAddressesForStory(address, targetAddress, storyId);
        res.json({ success: true, replies });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /replies/new
 * 获取新回复（未读）。需要认证。
 */
router.get("/replies/new", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        const newReplies = await ReplyService.getNewReply(address);
        res.json({ success: true, newReplies });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /replies/mark_read
 * 标记回复为已读。需要认证，传 { replyIds }
 */
router.post("/replies/mark_read", authenticate, async (req: Request, res: Response) => {
    const { replyIds } = req.body;
    try {
        await ReplyService.markReplyRead(replyIds);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /replies/mark_unread
 * 标记回复为未读。需要认证，传 { replyIds }
 */
router.post("/replies/mark_unread", authenticate, async (req: Request, res: Response) => {
    const { replyIds } = req.body;
    try {
        await ReplyService.markReplyUnread(replyIds);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * GET /stories/saved_stories
 * 获取用户收到的故事（基于收藏）。需要认证。
 */
router.get("/stories/saved_stories", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        await StoryService.getDailyStories(address);
        const likedStories = await UserService.getLikedStories(address);
        const recvStories = await Promise.all(
            likedStories.map(async (storyId: string) => await getStoryById(storyId))
        );
        res.json({ success: true, recvStories });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /stories/mark_saved
 * 收藏故事。需要认证，传 { storyId }
 */
router.post("/stories/mark_saved", authenticate, async (req: Request, res: Response) => {
    const { storyId } = req.body;
    const address = (req as any).userAddress;
    try {
        await StoryService.markLikedStory(address, storyId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /stories/unmark_saved
 * 取消收藏故事。需要认证，传 { storyId }
 */
router.post("/stories/unmark_saved", authenticate, async (req: Request, res: Response) => {
    const { storyId } = req.body;
    const address = (req as any).userAddress;
    try {
        await StoryService.unmarkLikedStory(address, storyId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});


/**
 * GET /stories/received_stories
 * 获取用户收到的故事（基于收藏）。需要认证。
 */
router.get("/stories/received_stories", authenticate, async (req: Request, res: Response) => {
    const address = (req as any).userAddress;
    try {
        const receivedStories = await UserService.getReceivedStories(address);
        const stories = await Promise.all(
            receivedStories.map(async (storyId: string) => await getStoryById(storyId))
        );
        res.json({ success: true, receivedStories: stories });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /stories/mark_received
 * 标记收到的故事。需要认证，传 { storyId }
 */
router.post("/stories/mark_received", authenticate, async (req: Request, res: Response) => {
    const { storyId } = req.body;
    const address = (req as any).userAddress;
    try {
        await StoryService.markReceivedStory(address, storyId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * POST /stories/unmark_received
 * 取消标记收到的故事。需要认证，传 { storyId }
 */
router.post("/stories/unmark_received", authenticate, async (req: Request, res: Response) => {
    const { storyId } = req.body;
    const address = (req as any).userAddress;
    try {
        await StoryService.unmarkReceivedStory(address, storyId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * 获取故事的合约地址
 */
router.get("/stories/contract_address/:storyId", authenticate, async (req: Request, res: Response) => {
    try {
        const { storyId } = req.params;
        if (!storyId) {
            return res.status(400).json({ success: false, reason: "storyId is required." });
        }
        const result = await StoryService.getContractAddress(storyId);
        res.json({ success: true, result });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * 根据合约地址获取故事
 */
router.get("/stories/story_by_contract/:contractAddress", authenticate, async (req: Request, res: Response) => {
    try {
        const { contractAddress } = req.params;
        if (!contractAddress) {
            return res.status(400).json({ success: false, reason: "contractAddress is required." });
        }
        const result = await StoryService.getStoryByContractAddress(contractAddress);
        res.json({ success: true, result });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * 更新故事的合约地址
 */
router.post("/stories/contract_address", authenticate, async (req: Request, res: Response) => {
    try {
        const { storyId, contractAddress } = req.body;
        if (!storyId || !contractAddress) {
            return res.status(400).json({ success: false, reason: "storyId and contractAddress are required." });
        }
        const result = await StoryService.updateStoryContractAddress(storyId, contractAddress);
        res.json({ success: true, result });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});

/**
 * ------------------------------
 * 以下是 AI 服务相关的路由
*/


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

/**
 * 写入用户和 AI 的聊天记录
 */
router.post("/store_chat_history", async (req, res) => {
    const { user_id, role, content } = req.body;
    // 参数校验
    if (!user_id || !role || !content) {
        return res.status(400).json({ error: "user_id, role, and content are required" });
    }

    if (!["user", "ai"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'user' or 'ai'." });
    }

    try {
        const result = await aiService.saveChatHistory(user_id, role, content);
        res.status(201).json(result);
    } catch (error) {
        console.error("❌ Failed to save chat history:", error);
        res.status(500).json({ error: "Failed to save chat history" });
    }
});

router.get("/get_intimacy", async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {
        return res.status(400).json({ error: "user_id are required" });
    }
    try {
        const intimacy = await UserService.getIntimacy(user_id as string);
        res.json({ success: true, intimacy });
    } catch (error) {
        console.error("❌ Failed to fetch intimacy:", error);
        res.status(500).json({ error: "Failed to fetch intimacy" });
    }
});

router.put("/update_intimacy", async (req, res) => {
    const { user_id, new_intimacy } = req.body;
    if (!user_id || !new_intimacy) {
        return res.status(400).json({ error: "user_id and new_intimacy are required" });
    }
    try {
        await UserService.updateIntimacy(user_id as string, Number(new_intimacy));
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Failed to update intimacy:", error);
        res.status(500).json({ error: "Failed to update intimacy" });
    }
})

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

router.get("/get_reply_num/:storyId", async (req, res) => {
    const { storyId } = req.params;
    try {
        const replies = await ReplyService.getRepliesForStory(Number(storyId));
        res.json({ reply_num: replies.length });
    } catch (error) {
        res.status(500).json({ error: "Failed to get reply num by story" });
    }
})

/**
 * ------------------------------
 * 以下是链上相关的路由
*/

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
 * @route GET /userSession/:userAddress
 * @desc 获取用户的活动会话
 */
router.get("/userSession", async (req, res) => {
    const { userAddress } = req.query;

    if (!userAddress) {
        return res.status(400).json({ success: false, message: "User address is required" });
    }

    try {
        const session = await TxnService.getActiveSession(userAddress.toString());
        res.json({ success: true, session });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /destroySession
 * @desc AI 端销毁会话
 */
router.post("/destroySession", async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    try {
        await TxnService.destroySession(sessionId);
        res.json({ success: true, message: "Session destroyed successfully." });
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

router.get("/stories/payment_pending", authenticate, async (req: Request, res: Response) => {
    try {
        const stories = await StoryService.getPaymentPendingStories();
        res.json({ success: true, stories });
    } catch (error: any) {
        res.status(500).json({ success: false, reason: error.message });
    }
});


export default router;