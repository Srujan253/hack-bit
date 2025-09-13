import crypto from 'crypto';
import Blockchain from '../models/Blockchain.js';

class BlockchainService {
  constructor() {
    this.difficulty = 2; // Proof of work difficulty
  }

  // Initialize blockchain with genesis block
  async initializeBlockchain() {
    try {
      const blockCount = await Blockchain.countDocuments();
      
      if (blockCount === 0) {
        const genesisBlock = new Blockchain({
          blockNumber: 0,
          previousHash: '0',
          transactions: [{
            type: 'genesis',
            data: {
              message: 'Genesis block for Transparent Fund Tracking Platform',
              timestamp: new Date(),
              version: '1.0.0'
            }
          }],
          nonce: 0,
          merkleRoot: '', // Will be calculated in pre-save middleware
          hash: '' // Will be calculated in pre-save middleware
        });

        // Calculate merkle root and initial hash
        genesisBlock.merkleRoot = genesisBlock.calculateMerkleRoot();
        genesisBlock.hash = genesisBlock.calculateHash();
        
        // Mine the block
        genesisBlock.mineBlock(this.difficulty);
        await genesisBlock.save();
        
        console.log('Genesis block created:', genesisBlock.hash);
        return genesisBlock;
      }
      
      return await Blockchain.findOne().sort({ blockNumber: -1 });
    } catch (error) {
      console.error('Error initializing blockchain:', error);
      throw error;
    }
  }

  // Get the latest block
  async getLatestBlock() {
    try {
      return await Blockchain.findOne().sort({ blockNumber: -1 });
    } catch (error) {
      console.error('Error getting latest block:', error);
      throw error;
    }
  }

  // Add a new transaction to blockchain
  async addTransaction(transactionData) {
    try {
      const latestBlock = await this.getLatestBlock();
      
      if (!latestBlock) {
        await this.initializeBlockchain();
        return await this.addTransaction(transactionData);
      }

      const newBlock = new Blockchain({
        blockNumber: latestBlock.blockNumber + 1,
        previousHash: latestBlock.hash,
        transactions: [transactionData],
        nonce: 0
      });

      // Mine the block
      newBlock.mineBlock(this.difficulty);
      await newBlock.save();

      console.log(`New block added: ${newBlock.hash}`);
      return newBlock;
    } catch (error) {
      console.error('Error adding transaction to blockchain:', error);
      throw error;
    }
  }

  // Record budget creation on blockchain
  async recordBudgetCreation(budget, adminId) {
    const transactionData = {
      transactionId: budget._id,
      type: 'budget_creation',
      data: {
        budgetId: budget._id,
        title: budget.title,
        totalAmount: budget.totalAmount,
        financialYear: budget.financialYear,
        category: budget.category,
        createdBy: adminId,
        timestamp: new Date()
      }
    };

    return await this.addTransaction(transactionData);
  }

  // Record budget allocation on blockchain
  async recordBudgetAllocation(budget, departmentId, allocatedAmount, adminId) {
    const transactionData = {
      transactionId: budget._id,
      type: 'budget_allocation',
      data: {
        budgetId: budget._id,
        departmentId: departmentId,
        allocatedAmount: allocatedAmount,
        allocatedBy: adminId,
        timestamp: new Date()
      }
    };

    return await this.addTransaction(transactionData);
  }

  // Record expense approval on blockchain
  async recordExpenseApproval(transaction, adminId) {
    const transactionData = {
      transactionId: transaction._id,
      type: 'expense_approval',
      data: {
        transactionId: transaction._id,
        budgetId: transaction.budgetId,
        departmentId: transaction.departmentId,
        amount: transaction.amount,
        description: transaction.description,
        vendorName: transaction.vendorName,
        approvedBy: adminId,
        timestamp: new Date()
      }
    };

    return await this.addTransaction(transactionData);
  }

  // Record transaction completion on blockchain
  async recordTransactionCompletion(transaction) {
    const transactionData = {
      transactionId: transaction._id,
      type: 'transaction_completion',
      data: {
        transactionId: transaction._id,
        budgetId: transaction.budgetId,
        departmentId: transaction.departmentId,
        amount: transaction.amount,
        completedAt: new Date(),
        timestamp: new Date()
      }
    };

    return await this.addTransaction(transactionData);
  }

  // Validate blockchain integrity
  async validateChain() {
    try {
      const blocks = await Blockchain.find().sort({ blockNumber: 1 });
      
      for (let i = 1; i < blocks.length; i++) {
        const currentBlock = blocks[i];
        const previousBlock = blocks[i - 1];

        // Check if current block's hash is valid
        if (currentBlock.hash !== currentBlock.calculateHash()) {
          console.log(`Invalid hash at block ${currentBlock.blockNumber}`);
          return false;
        }

        // Check if current block points to previous block
        if (currentBlock.previousHash !== previousBlock.hash) {
          console.log(`Invalid previous hash at block ${currentBlock.blockNumber}`);
          return false;
        }
      }

      console.log('Blockchain is valid');
      return true;
    } catch (error) {
      console.error('Error validating blockchain:', error);
      return false;
    }
  }

  // Get blockchain statistics
  async getBlockchainStats() {
    try {
      const totalBlocks = await Blockchain.countDocuments();
      const latestBlock = await this.getLatestBlock();
      
      const transactionStats = await Blockchain.aggregate([
        { $unwind: '$transactions' },
        {
          $group: {
            _id: '$transactions.type',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        totalBlocks,
        latestBlockNumber: latestBlock ? latestBlock.blockNumber : 0,
        latestBlockHash: latestBlock ? latestBlock.hash : null,
        transactionTypes: transactionStats,
        isValid: await this.validateChain()
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      throw error;
    }
  }

  // Get transaction history from blockchain
  async getTransactionHistory(transactionId) {
    try {
      const blocks = await Blockchain.find({
        'transactions.transactionId': transactionId
      }).sort({ blockNumber: 1 });

      const history = [];
      
      for (const block of blocks) {
        const transaction = block.transactions.find(
          tx => tx.transactionId.toString() === transactionId.toString()
        );
        
        if (transaction) {
          history.push({
            blockNumber: block.blockNumber,
            blockHash: block.hash,
            timestamp: block.timestamp,
            type: transaction.type,
            data: transaction.data
          });
        }
      }

      return history;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  // Generate hash for verification
  generateHash(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Verify transaction authenticity
  async verifyTransaction(transactionId, expectedData) {
    try {
      const history = await this.getTransactionHistory(transactionId);
      
      if (history.length === 0) {
        return { verified: false, message: 'Transaction not found in blockchain' };
      }

      // Check if the latest entry matches expected data
      const latestEntry = history[history.length - 1];
      const expectedHash = this.generateHash(expectedData);
      const actualHash = this.generateHash(latestEntry.data);

      return {
        verified: expectedHash === actualHash,
        message: expectedHash === actualHash ? 'Transaction verified' : 'Transaction data mismatch',
        blockchainHistory: history
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { verified: false, message: 'Error during verification' };
    }
  }
}

export default new BlockchainService();
