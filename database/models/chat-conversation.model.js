import { model, Schema, models } from "mongoose";

const ChatConversationSchema = new Schema({
    clerkId: { type: String, required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    messages: [
        {
            role: { type: String, enum: ['user', 'assistant'], required: true },
            content: { type: String, required: true },
            mode: { type: String, enum: ['voice', 'text'], default: 'text' },
            createdAt: { type: Date, default: Date.now },
        }
    ],
}, { timestamps: true });

ChatConversationSchema.index({ clerkId: 1, bookId: 1 }, { unique: true });

const ChatConversation = models.ChatConversation || model('ChatConversation', ChatConversationSchema);

export default ChatConversation;
