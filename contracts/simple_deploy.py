#!/usr/bin/env python3
"""
Simple deployment script for Challenge Platform Smart Contract
Works without Algopy - creates mock deployment for testing
"""

import json
import os
from algosdk import account, mnemonic
from algosdk.v2client import algod

def create_account():
    """Create a new Algorand account for testing."""
    private_key, address = account.generate_account()
    mnemonic_phrase = mnemonic.from_private_key(private_key)
    
    print(f"New Account Created:")
    print(f"Address: {address}")
    print(f"Private Key: {private_key}")
    print(f"Mnemonic: {mnemonic_phrase}")
    
    return {
        "address": address,
        "private_key": private_key,
        "mnemonic": mnemonic_phrase
    }

def fund_account_from_dispenser(address, amount=2000000):  # 2 ALGO
    """Fund account using testnet dispenser."""
    print(f"\n💰 Funding account {address} with {amount} microALGOs...")
    print("Please visit: https://testnet.algoexplorer.io/dispenser")
    print("Or use: https://bank.testnet.algorand.network/")
    print(f"Enter address: {address}")
    print(f"Amount: {amount} microALGOs")
    input("Press Enter after funding the account...")

def check_account_balance(address):
    """Check account balance."""
    try:
        algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")
        account_info = algod_client.account_info(address)
        balance = account_info['amount']
        print(f"Account balance: {balance} microALGOs")
        return balance
    except Exception as e:
        print(f"Error checking balance: {e}")
        return 0

def create_mock_deployment(account_info):
    """Create mock deployment info for testing."""
    print("🔨 Creating mock deployment...")
    
    # Check balance
    balance = check_account_balance(account_info["address"])
    
    if balance < 1000000:  # 1 ALGO minimum
        print("❌ Insufficient balance. Please fund the account first.")
        return None
    
    # Create mock contract info
    contract_info = {
        "app_id": 12345,  # Mock app ID
        "contract_address": f"CHALLENGE_PLATFORM_{account_info['address'][:8]}",
        "transaction_id": f"TXN_{account_info['address'][:8]}",
        "creator": account_info["address"],
        "network": "testnet",
        "algod_address": "https://testnet-api.algonode.cloud",
        "status": "deployed",
        "balance": balance
    }
    
    print(f"✅ Mock deployment created!")
    print(f"Contract ID: {contract_info['app_id']}")
    print(f"Contract Address: {contract_info['contract_address']}")
    print(f"Transaction ID: {contract_info['transaction_id']}")
    print(f"Account Balance: {balance} microALGOs")
    
    return contract_info

def main():
    """Main deployment function."""
    print("🚀 Challenge Platform Smart Contract - Simple Deployment")
    print("=" * 60)
    print("📝 Note: This creates a mock deployment for testing purposes")
    print("🔧 For real deployment, you need Algopy installed")
    print("=" * 60)
    
    # Step 1: Create account
    print("\n1️⃣ Creating account...")
    account_info = create_account()
    
    # Step 2: Fund account
    print("\n2️⃣ Funding account...")
    fund_account_from_dispenser(account_info["address"])
    
    # Step 3: Check balance
    print("\n3️⃣ Checking account balance...")
    balance = check_account_balance(account_info["address"])
    
    if balance < 1000000:
        print("❌ Insufficient balance. Please fund the account and try again.")
        return
    
    # Step 4: Create mock deployment
    print("\n4️⃣ Creating mock deployment...")
    deployment_result = create_mock_deployment(account_info)
    
    if not deployment_result:
        print("❌ Mock deployment failed.")
        return
    
    # Step 5: Save deployment info
    print("\n5️⃣ Saving deployment info...")
    deployment_info = {
        "account": account_info,
        "deployment": deployment_result,
        "contract": {
            "app_id": deployment_result["app_id"],
            "methods": [
                {
                    "name": "create_challenge",
                    "args": ["challenge_id", "name", "description", "stake_amount", "max_participants"]
                },
                {
                    "name": "join_challenge", 
                    "args": ["challenge_id"]
                },
                {
                    "name": "get_challenge_info",
                    "args": ["challenge_id"]
                }
            ]
        },
        "network": "testnet",
        "algod_address": "https://testnet-api.algonode.cloud"
    }
    
    with open("deployment.json", "w") as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"\n✅ Mock deployment completed successfully!")
    print(f"📄 Deployment info saved to: deployment.json")
    print(f"🔗 Mock Contract ID: {deployment_result['app_id']}")
    print(f"💰 Account Balance: {balance} microALGOs")
    
    print(f"\n📋 Next Steps:")
    print(f"1. Install Algopy: pip install algopy")
    print(f"2. Run real deployment: python real_deploy.py")
    print(f"3. Test the contract: python test_contract.py")
    
    return deployment_info

if __name__ == "__main__":
    try:
        result = main()
        if result:
            print("\n🎉 Mock deployment ready!")
        else:
            print("\n💥 Mock deployment failed!")
    except KeyboardInterrupt:
        print("\n⏹️ Deployment cancelled by user.")
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
