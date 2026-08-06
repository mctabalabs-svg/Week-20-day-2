const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const router = express.Router();

// Telegram Bot API base URL
// Note: Make sure to set your TELEGRAM_BOT_TOKEN in the .env file
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const redis = new Redis(process.env.REDIS_URL || { host: "127.0.0.1", port: 6379 });

const setState = async (chatId, state) => {
  await redis.set(`tg:state:${chatId}`, state, "EX", 300);
};

const clearState = async (chatId) => {
  await redis.del(`tg:state:${chatId}`);
};

// Webhook endpoint to receive updates from Telegram
router.post("/webhook", async (req, res) => {
  console.log("Telegram update:", JSON.stringify(req.body, null, 2));

  try {
    const callbackQuery = req.body.callback_query;
    if (callbackQuery) {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
        callback_query_id: callbackQuery.id,
      });

      if (data === "action:products") {
        await axios.post(`${TELEGRAM_API}/editMessageText`, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: "You picked Products. Loading...",
        });
        await setState(chatId, "products_list");
      } else if (data === "action:orders") {
        await axios.post(`${TELEGRAM_API}/editMessageText`, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: "You picked My orders. Loading...",
        });
        await setState(chatId, "orders_list");
      } else if (data === "action:support") {
        await axios.post(`${TELEGRAM_API}/editMessageText`, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: "You picked Support. Loading...",
        });
        await setState(chatId, "support");
      }

      return res.sendStatus(200);
    }

    const message = req.body.message;
    if (!message) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const state = await redis.get(`tg:state:${chatId}`);

    if (text === "/start") {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Karibu! I am your Mctaba bot. Send /help for commands.",
      });
    } else if (text === "/help") {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Available commands:\n/start - welcome message\n/help - show this help\n/menu - open the inline menu",
      });
    } else if (text === "/menu") {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Pick an option:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Products", callback_data: "action:products" }],
            [{ text: "My orders", callback_data: "action:orders" }],
            [{ text: "Support", callback_data: "action:support" }],
          ],
        },
      });
    } else if (state === "products_list") {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "You are in the products flow. Here are our product categories...",
      });
      await clearState(chatId);
    } else if (state === "orders_list") {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "You are in the orders flow. I can show your order history next.",
      });
      await clearState(chatId);
    } else if (state === "support") {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "You are in the support flow. Please send your question.",
      });
      await clearState(chatId);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Telegram webhook error:", error?.response?.data || error.message || error);
    res.sendStatus(500);
  }
});

module.exports = router;
