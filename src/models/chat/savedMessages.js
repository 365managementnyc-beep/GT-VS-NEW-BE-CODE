const mongoose=require('mongoose');
const { Schema } = mongoose;
const savedMessagesSchema = new Schema({
    chat: {
        type: Schema.Types.ObjectId,
        ref: 'chats',
        required: true
    },
    savedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionId:{
        type: Schema.Types.ObjectId,
        ref: 'messages',
        required: true
    },
    answerId: {
        type: Schema.Types.ObjectId,
        ref: 'messages',
        required: true
    }
});

const SavedMessagesModel = mongoose.model('SavedMessages', savedMessagesSchema);
module.exports = SavedMessagesModel;