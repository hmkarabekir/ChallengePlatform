#!/usr/bin/env python3
"""
Real deployment script for Challenge Platform smart contracts
"""

import os
import sys
from pathlib import Path

# Add the contracts directory to Python path
contracts_dir = Path(__file__).parent
sys.path.insert(0, str(contracts_dir))

from algopy import compile_program
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn
from algosdk.account import generate_account
from algosdk import mnemonic
import json

def get_algod_client():
    """Get Algorand client for testnet."""
    algod_address = "https://testnet-api.algonode.cloud"
    algod_token = ""
    return algod.AlgodClient(algod_token, algod_address)

def deploy_contract():
    """Deploy the challenge platform smart contract."""
    print("Deploying Challenge Platform Smart Contract...")
    
    try:
        # Get client
        client = get_algod_client()
        
        # Generate or load account
        account_file = contracts_dir / "deployer_account.json"
        if account_file.exists():
            with open(account_file, 'r') as f:
                account_data = json.load(f)
            private_key = account_data['private_key']
            address = account_data['address']
        else:
            private_key, address = generate_account()
            account_data = {
                'private_key': private_key,
                'address': address,
                'mnemonic': mnemonic.from_private_key(private_key)
            }
            with open(account_file, 'w') as f:
                json.dump(account_data, f, indent=2)
        
        print(f"Using account: {address}")
        
        # Get account info
        account_info = client.account_info(address)
        print(f"Account balance: {account_info['amount']} microALGOs")
        
        if account_info['amount'] < 100000:  # 0.1 ALGO minimum
            print("❌ Insufficient balance. Please fund your account first.")
            print(f"Fund account at: https://testnet.algoexplorer.io/dispenser")
            return False
        
        # Compile contract
        from challenge_contract import ChallengePlatform
        compiled_contract = compile_program(ChallengePlatform)
        
        # Create application creation transaction
        app_args = []
        local_schema = {
            "num_byte_slices": 0,
            "num_uint": 0
        }
        global_schema = {
            "num_byte_slices": 0,
            "num_uint": 0
        }
        
        txn = ApplicationCreateTxn(
            sender=address,
            sp=client.suggested_params(),
            on_complete=0,  # NoOp
            approval_program=compiled_contract.approval_program,
            clear_program=compiled_contract.clear_program,
            global_schema=global_schema,
            local_schema=local_schema,
            app_args=app_args
        )
        
        # Sign and submit transaction
        signed_txn = txn.sign(private_key)
        tx_id = client.send_transaction(signed_txn)
        
        # Wait for confirmation
        print(f"Transaction submitted: {tx_id}")
        print("Waiting for confirmation...")
        
        import time
        time.sleep(5)  # Wait for confirmation
        
        # Get transaction info
        tx_info = client.pending_transaction_info(tx_id)
        if tx_info.get('confirmed-round'):
            app_id = tx_info['application-index']
            print(f"✅ Contract deployed successfully!")
            print(f"📱 Application ID: {app_id}")
            print(f"🔗 Transaction ID: {tx_id}")
            print(f"📍 Contract Address: {address}")
            
            # Save deployment info
            deployment_info = {
                'app_id': app_id,
                'tx_id': tx_id,
                'contract_address': address,
                'deployer': address,
                'network': 'testnet'
            }
            
            with open(contracts_dir / "deployment.json", 'w') as f:
                json.dump(deployment_info, f, indent=2)
            
            return True
        else:
            print("❌ Transaction not confirmed")
            return False
            
    except Exception as e:
        print(f"❌ Error deploying contract: {e}")
        return False

if __name__ == "__main__":
    success = deploy_contract()
    sys.exit(0 if success else 1)