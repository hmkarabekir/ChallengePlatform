#!/usr/bin/env python3
"""
Deploy the real Challenge Platform smart contract
"""

import json
import os
import sys
import base64
from pathlib import Path

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Testnet configuration
ALGOD_TOKEN = ""
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"

def create_account():
    """Use the funded account."""
    # Use the account that was funded
    mnemonic_phrase = "police manual laptop wheat exist burst nice congress equal vacuum swamp among exhibit clown into medal language gym dream forum giraffe bag smoke absent tissue"
    
    # Convert mnemonic to private key
    private_key = mnemonic.to_private_key(mnemonic_phrase)
    address = account.address_from_private_key(private_key)
    
    print(f"Using funded account:")
    print(f"Address: {address}")
    print(f"Mnemonic: {mnemonic_phrase}")
    
    return {
        "address": address,
        "private_key": private_key,
        "mnemonic": mnemonic_phrase
    }

def fund_account_from_dispenser(address, amount=2000000):  # 2 ALGO
    """Check if account has sufficient funds."""
    print(f"Checking account {address} balance...")
    
    try:
        # Create algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get account info
        account_info = algod_client.account_info(address)
        current_balance = account_info.get('amount', 0)
        
        print(f"Current balance: {current_balance} microALGOs")
        
        if current_balance >= amount:
            print(f"Account has sufficient funds ({current_balance} microALGOs)")
            return True
        
        print(f"Account needs more funds. Current: {current_balance}, Required: {amount}")
        return False
        
    except Exception as e:
        print(f"Balance check failed: {e}")
        return False

def compile_contract():
    """Compile the real smart contract from TEAL files."""
    try:
        print("Compiling real smart contract from TEAL...")
        
        # Read approval program
        with open("artifacts/approval.teal", "r") as f:
            approval_teal = f.read()
        
        # Read clear program
        with open("artifacts/clear.teal", "r") as f:
            clear_teal = f.read()
        
        # Compile TEAL to bytecode
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        approval_result = algod_client.compile(approval_teal)
        approval_program = base64.b64decode(approval_result['result'])
        
        clear_result = algod_client.compile(clear_teal)
        clear_program = base64.b64decode(clear_result['result'])
        
        print("Contract compiled successfully")
        print(f"Approval program size: {len(approval_program)} bytes")
        print(f"Clear program size: {len(clear_program)} bytes")
        
        return {
            "approval_program": approval_program,
            "clear_program": clear_program
        }
    except Exception as e:
        print(f"Compilation failed: {str(e)}")
        return None

def deploy_contract(account_info, compiled_contract):
    """Deploy the smart contract to Algorand testnet."""
    print("Deploying real smart contract...")
    
    # Initialize Algod client
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    try:
        # Get account info
        account_info_response = algod_client.account_info(account_info["address"])
        print(f"Account balance: {account_info_response['amount']} microALGOs")
        
        if account_info_response['amount'] < 1000000:  # 1 ALGO minimum
            print("Insufficient balance. Please fund the account.")
            return None
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Create application creation transaction
        txn = transaction.ApplicationCreateTxn(
            sender=account_info["address"],
            sp=params,
            on_complete=transaction.OnComplete.NoOpOC,
            approval_program=compiled_contract["approval_program"],
            clear_program=compiled_contract["clear_program"],
            global_schema=transaction.StateSchema(num_uints=10, num_byte_slices=10),
            local_schema=transaction.StateSchema(num_uints=5, num_byte_slices=5)
        )
        
        # Sign transaction
        signed_txn = txn.sign(account_info["private_key"])
        
        # Send transaction
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"Transaction ID: {tx_id}")
        
        # Wait for confirmation
        from algosdk.transaction import wait_for_confirmation
        confirmed_txn = wait_for_confirmation(algod_client, tx_id, 4)
        
        # Get application ID
        app_id = confirmed_txn['application-index']
        print(f"Application deployed successfully!")
        print(f"Application ID: {app_id}")
        
        return {
            "success": True,
            "app_id": app_id,
            "tx_id": tx_id,
            "account": account_info
        }
        
    except Exception as e:
        print(f"Deployment failed: {str(e)}")
        return None

def create_contract_interface(app_id):
    """Create contract interface for interaction."""
    print(f"Creating contract interface for App ID: {app_id}")
    
    # Define ABI methods
    methods = [
        {
            "name": "create_challenge",
            "args": [
                {"name": "name", "type": "string"},
                {"name": "description", "type": "string"},
                {"name": "max_participants", "type": "uint64"},
                {"name": "start_time", "type": "uint64"},
                {"name": "end_time", "type": "uint64"}
            ],
            "returns": {"type": "uint64"}
        },
        {
            "name": "join_challenge",
            "args": [
                {"name": "challenge_id", "type": "uint64"},
                {"name": "stake_amount", "type": "uint64"}
            ],
            "returns": {"type": "void"}
        },
        {
            "name": "leave_challenge",
            "args": [
                {"name": "challenge_id", "type": "uint64"}
            ],
            "returns": {"type": "void"}
        },
        {
            "name": "complete_task",
            "args": [
                {"name": "challenge_id", "type": "uint64"},
                {"name": "task_id", "type": "uint64"}
            ],
            "returns": {"type": "void"}
        },
        {
            "name": "process_elimination",
            "args": [
                {"name": "challenge_id", "type": "uint64"}
            ],
            "returns": {"type": "void"}
        },
        {
            "name": "distribute_pool",
            "args": [
                {"name": "challenge_id", "type": "uint64"}
            ],
            "returns": {"type": "void"}
        }
    ]
    
    return {
        "app_id": app_id,
        "methods": methods
    }

def main():
    """Main deployment function."""
    print("Challenge Platform Real Smart Contract Deployment")
    print("=" * 60)
    
    # Step 1: Create account
    print("\n1. Creating account...")
    account_info = create_account()
    
    # Step 2: Fund account
    print("\n2. Funding account...")
    funding_success = fund_account_from_dispenser(account_info["address"])
    if not funding_success:
        print("Please fund the account manually and run the script again.")
        return None
    
    # Step 3: Compile contract
    print("\n3. Compiling contract...")
    compiled_contract = compile_contract()
    if not compiled_contract:
        print("Compilation failed. Exiting.")
        return None
    
    # Step 4: Deploy contract
    print("\n4. Deploying contract...")
    deployment_result = deploy_contract(account_info, compiled_contract)
    if not deployment_result:
        print("Deployment failed. Exiting.")
        return None
    
    # Step 5: Create interface
    print("\n5. Creating contract interface...")
    contract_interface = create_contract_interface(deployment_result["app_id"])
    
    # Save deployment info
    deployment_info = {
        "account": account_info,
        "deployment": deployment_result,
        "contract": contract_interface,
        "network": "testnet",
        "algod_address": ALGOD_ADDRESS
    }
    
    with open("deployment.json", "w") as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"\nDeployment completed successfully!")
    print(f"Deployment info saved to: deployment.json")
    print(f"View on AlgoExplorer: https://testnet.algoexplorer.io/application/{deployment_result['app_id']}")
    
    return deployment_info

if __name__ == "__main__":
    try:
        result = main()
        if result:
            print("\nReady to use the Challenge Platform!")
        else:
            print("\nDeployment failed!")
    except KeyboardInterrupt:
        print("\nDeployment cancelled by user.")
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
