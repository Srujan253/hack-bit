# Smart Contract Deployment Commands

## Prerequisites

1. **Install Ganache CLI**:
   ```bash
   npm install -g ganache-cli
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

## Step-by-Step Deployment

### 1. Start Ganache
Open a new terminal and run:
```bash
ganache-cli --host 127.0.0.1 --port 7545 --networkId 5777 --accounts 10 --defaultBalanceEther 100
```

Keep this terminal running throughout the process.

### 2. Deploy Smart Contracts (Simple Test)
In a new terminal, navigate to the backend directory and run:
```bash
cd backend
node scripts/deployContractOnly.js
```

This will:
- Deploy the BudgetManagement smart contract
- Test all contract functions
- Display contract address and account information

### 3. Deploy with Full Integration Test
For complete testing including MongoDB integration:
```bash
cd backend
node scripts/deploySmartContract.js
```

### 4. Start the Backend Server
```bash
cd backend
npm run dev
```

The server will automatically:
- Initialize smart contracts
- Register existing departments
- Sync existing budgets

## Verification Commands

### Check Web3 Connection
```bash
cd backend
node scripts/simpleTest.js
```

### View Contract Information
After deployment, check the generated file:
```bash
cat backend/config/contractInfo.json
```

## Environment Configuration

Ensure your `.env` file contains:
```env
# Ganache Configuration
GANACHE_URL=http://127.0.0.1:7545
GANACHE_NETWORK_ID=5777

# Smart Contract Configuration
USE_SMART_CONTRACTS=true
```

## Expected Output

Successful deployment should show:
```
🚀 Deploying Smart Contract Only...
📋 Step 1: Initializing Web3 Service...
✅ Connected successfully
📋 Step 2: Deploying Smart Contract...
✅ Contract deployed successfully!
Contract Address: 0x...
🧪 Test 1: Creating a budget...
✅ Budget created with ID: 1
🧪 Test 2: Registering a department...
✅ Department registered
🧪 Test 3: Allocating budget to department...
✅ Budget allocated
🧪 Test 4: Submitting an expense...
✅ Expense submitted
🧪 Test 5: Approving the expense...
✅ Expense approved
🎉 All smart contract tests completed successfully!
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**:
   ```
   Error: connect ECONNREFUSED 127.0.0.1:7545
   ```
   **Solution**: Make sure Ganache is running on port 7545

2. **Module Not Found**:
   ```
   Error: Cannot find module
   ```
   **Solution**: Run `npm install` in the backend directory

3. **Transaction Reverted**:
   ```
   TransactionRevertedWithoutReasonError
   ```
   **Solution**: Check Ganache accounts have sufficient ETH balance

### Reset Everything:
If you encounter persistent issues:
1. Stop Ganache (Ctrl+C)
2. Delete `backend/config/contractInfo.json`
3. Restart Ganache
4. Re-run deployment script

## Integration with Existing System

Once deployed successfully:

1. **Budget Creation**: Creates both MongoDB record and smart contract entry
2. **Department Allocation**: Syncs allocation to smart contract
3. **Expense Submission**: Records expense request on smart contract
4. **Approval Workflow**: Updates smart contract state

All operations maintain dual recording for redundancy and transparency.
