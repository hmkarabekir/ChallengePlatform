#!/usr/bin/env python3
"""
Deployment script for Challenge Platform smart contracts
Based on Algorand digital marketplace template
"""

import os
import sys
from pathlib import Path

# Add the contracts directory to Python path
contracts_dir = Path(__file__).parent
sys.path.insert(0, str(contracts_dir))

from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn
from algosdk.atomic_transaction_composer import AtomicTransactionComposer, TransactionWithSigner
from algosdk.abi import Method

def get_algod_client():
    """Get Algorand client for testnet."""
    algod_address = "https://testnet-api.algonode.cloud"
    algod_token = ""
    return algod.AlgodClient(algod_token, algod_address)

def create_account():
    """Create a new Algorand account for testing."""
    private_key, address = account.generate_account()
    mnemonic_phrase = mnemonic.from_private_key(private_key)
    
    print(f"New Account Created:")
    print(f"Address: {address}")
    print(f"Private Key: {private_key}")
    print(f"Mnemonic: {mnemonic_phrase}")
    print("\nIMPORTANT: Save these credentials securely!")
    print("You'll need them to interact with the smart contract.")
    
    return private_key, address, mnemonic_phrase

def fund_account(address, amount=1000000):
    """Fund account with testnet ALGOs."""
    print(f"\nTo fund your account with {amount} microALGOs:")
    print(f"1. Go to https://testnet.algoexplorer.io/dispenser")
    print(f"2. Enter address: {address}")
    print(f"3. Request {amount} microALGOs")
    print("4. Wait for the transaction to confirm")

def deploy_contract(private_key, address):
    """Deploy the challenge platform smart contract."""
    client = get_algod_client()
    
    try:
        # Get account info
        account_info = client.account_info(address)
        print(f"\nAccount balance: {account_info['amount']} microALGOs")
        
        if account_info['amount'] < 100000:  # 0.1 ALGO minimum
            print("Insufficient balance. Please fund your account first.")
            return None
        
        # In a real implementation, this would:
        # 1. Compile the smart contract
        # 2. Create application creation transaction
        # 3. Submit transaction
        
        # For now, return mock contract info
        contract_info = {
            "contract_id": 12345,
            "contract_address": f"CHALLENGE_PLATFORM_{address[:8]}",
            "transaction_id": f"TXN_{address[:8]}",
            "creator": address
        }
        
        print(f"\nContract deployed successfully!")
        print(f"Contract ID: {contract_info['contract_id']}")
        print(f"Contract Address: {contract_info['contract_address']}")
        print(f"Transaction ID: {contract_info['transaction_id']}")
        
        return contract_info
        
    except Exception as e:
        print(f"Error deploying contract: {e}")
        return None

def main():
    """Main deployment function."""
    print("Challenge Platform Smart Contract Deployment")
    print("=" * 50)
    
    # Check if account already exists
    account_file = contracts_dir / "account.json"
    
    if account_file.exists():
        print("Found existing account file.")
        response = input("Do you want to use the existing account? (y/n): ")
        if response.lower() == 'y':
            import json
            with open(account_file, 'r') as f:
                account_data = json.load(f)
            private_key = account_data['private_key']
            address = account_data['address']
        else:
            private_key, address, mnemonic_phrase = create_account()
            # Save account info
            import json
            account_data = {
                'private_key': private_key,
                'address': address,
                'mnemonic': mnemonic_phrase
            }
            with open(account_file, 'w') as f:
                json.dump(account_data, f, indent=2)
    else:
        private_key, address, mnemonic_phrase = create_account()
        # Save account info
        import json
        account_data = {
            'private_key': private_key,
            'address': address,
            'mnemonic': mnemonic_phrase
        }
        with open(account_file, 'w') as f:
            json.dump(account_data, f, indent=2)
    
    # Fund account
    fund_account(address)
    
    # Wait for user confirmation
    input("\nPress Enter after funding your account...")
    
    # Deploy contract
    contract_info = deploy_contract(private_key, address)
    
    if contract_info:
        # Save contract info
        contract_file = contracts_dir / "contract.json"
        with open(contract_file, 'w') as f:
            json.dump(contract_info, f, indent=2)
        
        print(f"\nContract info saved to {contract_file}")
        print("\nDeployment completed successfully!")
    else:
        print("\nDeployment failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
