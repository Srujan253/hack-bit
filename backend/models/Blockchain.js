import mongoose from 'mongoose';
import crypto from 'crypto';

const blockchainSchema = new mongoose.Schema({
  blockNumber: {
    type: Number,
    required: true,
    unique: true
  },
  previousHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  transactions: [{
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    type: {
      type: String,
      enum: ['genesis', 'budget_creation', 'budget_allocation', 'expense_approval', 'transaction_completion'],
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  hash: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    default: 0
  },
  merkleRoot: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate hash for the block
blockchainSchema.methods.calculateHash = function() {
  const data = {
    blockNumber: this.blockNumber,
    previousHash: this.previousHash,
    timestamp: this.timestamp,
    transactions: this.transactions,
    nonce: this.nonce
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
};

// Calculate Merkle root for transactions
blockchainSchema.methods.calculateMerkleRoot = function() {
  if (this.transactions.length === 0) {
    return crypto.createHash('sha256').update('').digest('hex');
  }
  
  let hashes = this.transactions.map(tx => 
    crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex')
  );
  
  while (hashes.length > 1) {
    const newHashes = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      newHashes.push(combined);
    }
    hashes = newHashes;
  }
  
  return hashes[0];
};

// Mine block (simplified proof of work)
blockchainSchema.methods.mineBlock = function(difficulty = 2) {
  const target = Array(difficulty + 1).join('0');
  
  // Initialize hash if not present
  if (!this.hash) {
    this.hash = this.calculateHash();
  }
  
  while (this.hash && this.hash.substring(0, difficulty) !== target) {
    this.nonce++;
    this.hash = this.calculateHash();
  }
  
  console.log(`Block mined: ${this.hash}`);
};

// Pre-save middleware to calculate hash and merkle root
blockchainSchema.pre('save', function(next) {
  this.merkleRoot = this.calculateMerkleRoot();
  this.hash = this.calculateHash();
  next();
});

export default mongoose.model('Blockchain', blockchainSchema);
