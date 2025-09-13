import mongoose from 'mongoose';

const chatbotQASchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ChatbotQA', chatbotQASchema);
