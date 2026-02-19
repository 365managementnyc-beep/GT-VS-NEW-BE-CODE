const express = require('express');
const { saveMessage, getSavedMessages, getMessageByBookingId,getUserChatsByMessageController ,getMessageByChatId   } = require('../controllers/messageController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router.post("/save",requireAuth, saveMessage)
router.get("/savedMessage",requireAuth, getSavedMessages);
router.get("/getMessageByBookingId/:bookingId", requireAuth,restrictTo(['admin']), getMessageByBookingId);
router.get("/getUserChatsByMessage/:id", requireAuth, getUserChatsByMessageController);
router.get("/getMessageByChatId/:chatId", requireAuth, getMessageByChatId);

module.exports = router;