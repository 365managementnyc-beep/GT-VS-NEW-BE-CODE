const { default: mongoose } = require('mongoose');
const Bookings = require('../models/Bookings');
const Message = require('../models/chat/Message');
const SavedMessagesModel = require('../models/chat/savedMessages');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Chat = require('../models/chat/Chat');
const saveMessage = catchAsync(async (req, res, next) => {
  const { chatId, questionId, answerId } = req.body;
  const userId = req.user._id;

  if (!chatId || !questionId || !answerId) {
    return next(new AppError('Chat ID, Question ID, and Answer ID are required', 400));
  }

  // Check if the message is already saved by this user in this chat
  const existing = await SavedMessagesModel.findOne({
    chat: chatId,
    savedBy: userId,
    questionId: questionId,
    answerId: answerId
  });

  if (existing) {
    return next(new AppError('Message already saved', 400));
  }

  const savedMessage = await SavedMessagesModel.create({
    chat: chatId,
    savedBy: userId,
    questionId: questionId,
    answerId: answerId
  });

  res.status(201).json({
    status: 'success',
    data: {
      savedMessage
    }
  });
});


const getSavedMessages = catchAsync(async (req, res) => {

  const allSavedMessages = await SavedMessagesModel.aggregate([
    {
      $lookup: {
        from: 'messages',
        localField: 'questionId',
        foreignField: '_id',
        as: 'questionData'
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'answerId',
        foreignField: '_id',
        as: 'answerData'
      }
    },
    {
      $unwind: '$questionData'
    },
    {
      $unwind: '$answerData'
    },
    {
      $project: {
        _id: 0,
        question: '$questionData.content',
        answer: '$answerData.content'
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: allSavedMessages || []
  });
});

const getMessageByBookingId = catchAsync(async (req, res, next) => {
  const { bookingId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  if (!bookingId) {
    return next(new AppError('Booking ID is required', 400));
  }

  const findBooking = await Bookings.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(bookingId) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'ClientInfo'
      }
    },
    {
      $unwind: '$ClientInfo'
    },
    {
      $lookup: {
        from: 'servicelistings',
        localField: 'service',
        foreignField: '_id',
        as: 'service'
      }
    },
    {
      $unwind: '$service'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'service.vendorId',
        foreignField: '_id',
        as: 'vendorInfo'
      }
    },
    {
      $unwind: '$vendorInfo'
    },

    {
      $project: {
        clientInfo: {
          _id: '$ClientInfo._id',
          firstName: "$ClientInfo.firstName",
          lastName: "$ClientInfo.lastName",
          email: '$ClientInfo.email',
          profilePicture: '$ClientInfo.profilePicture',
          role: '$ClientInfo.role'
        },
        vendorInfo: {
          _id: '$vendorInfo._id',
          firstName: "$vendorInfo.firstName",
          lastName: "$vendorInfo.lastName",
          email: '$vendorInfo.email',
          profilePicture: '$vendorInfo.profilePicture',
          role: '$vendorInfo.role'
        }
      }
    }
  ]);

  if (findBooking.length === 0) {
    return next(new AppError('Booking not found', 404));
  }

  const messages = await Message.aggregate([
    { $match: { bookingId: new mongoose.Types.ObjectId(bookingId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderInfo'
      }
    },
    { $unwind: '$senderInfo' },
    { $sort: { createdAt: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        content: 1,
        sender: 1,
        createdAt: 1,
        bookingId: 1,
        alert_result: 1,
        senderInfo: {
          _id: '$senderInfo._id',
          name: {
            $concat: ['$senderInfo.firstName', ' ', '$senderInfo.lastName']
          },
          email: '$senderInfo.email',
          profilePicture: '$senderInfo.profilePicture',
          role: '$senderInfo.role'
        }
      }
    }

  ]);

  const totalMessages = await Message.countDocuments({ bookingId: bookingId });

  res.status(200).json({
    status: 'success',
    data: messages || [],
    bookingDetails: findBooking[0],
    pagination: {
      total: totalMessages,
      page,
      limit,
      pages: Math.ceil(totalMessages / limit)
    }
  });
});
const getMessageByChatId = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  if (!chatId) {
    return next(new AppError('Chat ID is required', 400));
  }

  const findChat = await Chat.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(chatId) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participants'
      }
    }
  ]);

  const messages = await Message.aggregate([
    { $match: { chat: new mongoose.Types.ObjectId(chatId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderInfo'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'staff',
        foreignField: '_id',
        as: 'staffInfo'
      }
    },
    {
      $unwind: {
        path: '$staffInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    { 
      $unwind: {
        path: '$senderInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    { $sort: { createdAt: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        content: 1,
        sender: 1,
        createdAt: 1,
        bookingId: 1,
        alert_result: 1,
        senderInfo: {
          _id: '$senderInfo._id',
          name: {
            $concat: ['$senderInfo.firstName', ' ', '$senderInfo.lastName']
          },
          email: '$senderInfo.email',
          profilePicture: '$senderInfo.profilePicture',
          role: '$senderInfo.role'
        },
        staffInfo: {
          _id: '$staffInfo._id',
          name: {
            $concat: ['$staffInfo.firstName', ' ', '$staffInfo.lastName']
          },
          email: '$staffInfo.email',
          profilePicture: '$staffInfo.profilePicture',
          role: '$staffInfo.role'
        }
      }
    }
  ]);

  const totalMessages = await Message.countDocuments({ chat: chatId });

  res.status(200).json({
    status: 'success',
    data: messages || [],
    chat: findChat,
    pagination: {
      total: totalMessages,
      page,
      limit,
      pages: Math.ceil(totalMessages / limit)
    }
  });
});


const getUserChatsByMessageController = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const chatsByMessages = await Message.aggregate([
    { $match: { staff: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$chat' } },
    {
      $lookup: {
        from: 'chats',
        localField: '_id',
        foreignField: '_id',
        as: 'chatInfo',
        pipeline: [{
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participantsInfo',     
            pipeline: [{
              $project: {
                _id: 1,
                name: { $concat: ['$firstName', ' ', '$lastName'] },
                email: 1,
                profilePicture: 1,
                role: 1
              }
            }]
          }
        }]
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: chatsByMessages || []
  });
});

module.exports = {
  saveMessage,
  getSavedMessages,
  getMessageByBookingId,
  getMessageByChatId,
  getUserChatsByMessageController,
  getMessageByChatId
};
