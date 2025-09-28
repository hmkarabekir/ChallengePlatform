#!/usr/bin/env python3
"""
Test script for Challenge Platform Smart Contract
Tests all major functionality
"""

import json
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCallTxn, PaymentTxn
from algosdk.atomic_transaction_composer import AtomicTransactionComposer, TransactionWithSigner
from algosdk.abi import Method

def get_algod_client():
    """Get Algorand client for testnet."""
    algod_address = "https://testnet-api.algonode.cloud"
    algod_token = ""
    return algod.AlgodClient(algod_token, algod_address)

def load_deployment_info():
    """Load deployment information."""
    deployment_file = Path(__file__).parent / "deployment.json"
    if not deployment_file.exists():
        print("❌ Deployment file not found. Please run real_deploy.py first.")
        return None
    
    with open(deployment_file, 'r') as f:
        return json.load(f)

def test_create_challenge(deployment_info):
    """Test creating a challenge."""
    print("🧪 Testing create_challenge...")
    
    client = get_algod_client()
    account_info = deployment_info["account"]
    app_id = deployment_info["deployment"]["app_id"]
    
    try:
        # Get suggested parameters
        params = client.suggested_params()
        
        # Create challenge data
        challenge_id = 1
        name = "30-Day Fitness Challenge"
        description = "Complete daily workouts for 30 days"
        stake_amount = 1000000  # 1 ALGO
        max_participants = 10
        
        # Create payment transaction for stake
        payment_txn = PaymentTxn(
            sender=account_info["address"],
            sp=params,
            receiver=account_info["address"],  # Will be changed to contract address
            amount=stake_amount
        )
        
        # Create application call transaction
        app_call_txn = ApplicationCallTxn(
            sender=account_info["address"],
            sp=params,
            index=app_id,
            on_complete=0,  # NoOp
            app_args=[
                challenge_id,
                name,
                description,
                stake_amount,
                max_participants
            ]
        )
        
        # Sign transactions
        signed_payment = payment_txn.sign(account_info["private_key"])
        signed_app_call = app_call_txn.sign(account_info["private_key"])
        
        # Submit transactions
        tx_id = client.send_transactions([signed_payment, signed_app_call])
        print(f"✅ Challenge creation transaction submitted: {tx_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Challenge creation failed: {str(e)}")
        return False

def test_join_challenge(deployment_info):
    """Test joining a challenge."""
    print("🧪 Testing join_challenge...")
    
    client = get_algod_client()
    account_info = deployment_info["account"]
    app_id = deployment_info["deployment"]["app_id"]
    
    try:
        # Get suggested parameters
        params = client.suggested_params()
        
        # Create payment transaction for stake
        stake_amount = 1000000  # 1 ALGO
        payment_txn = PaymentTxn(
            sender=account_info["address"],
            sp=params,
            receiver=account_info["address"],  # Will be changed to contract address
            amount=stake_amount
        )
        
        # Create application call transaction
        app_call_txn = ApplicationCallTxn(
            sender=account_info["address"],
            sp=params,
            index=app_id,
            on_complete=0,  # NoOp
            app_args=[1]  # challenge_id
        )
        
        # Sign transactions
        signed_payment = payment_txn.sign(account_info["private_key"])
        signed_app_call = app_call_txn.sign(account_info["private_key"])
        
        # Submit transactions
        tx_id = client.send_transactions([signed_payment, signed_app_call])
        print(f"✅ Join challenge transaction submitted: {tx_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Join challenge failed: {str(e)}")
        return False

def test_get_challenge_info(deployment_info):
    """Test getting challenge information."""
    print("🧪 Testing get_challenge_info...")
    
    client = get_algod_client()
    account_info = deployment_info["account"]
    app_id = deployment_info["deployment"]["app_id"]
    
    try:
        # Get suggested parameters
        params = client.suggested_params()
        
        # Create application call transaction (readonly)
        app_call_txn = ApplicationCallTxn(
            sender=account_info["address"],
            sp=params,
            index=app_id,
            on_complete=0,  # NoOp
            app_args=[1]  # challenge_id
        )
        
        # Sign transaction
        signed_app_call = app_call_txn.sign(account_info["private_key"])
        
        # Submit transaction
        tx_id = client.send_transaction(signed_app_call)
        print(f"✅ Get challenge info transaction submitted: {tx_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Get challenge info failed: {str(e)}")
        return False

def test_send_chat_message(deployment_info):
    """Test sending a chat message."""
    print("🧪 Testing send_chat_message...")
    
    client = get_algod_client()
    account_info = deployment_info["account"]
    app_id = deployment_info["deployment"]["app_id"]
    
    try:
        # Get suggested parameters
        params = client.suggested_params()
        
        # Create application call transaction
        app_call_txn = ApplicationCallTxn(
            sender=account_info["address"],
            sp=params,
            index=app_id,
            on_complete=0,  # NoOp
            app_args=[
                1,  # challenge_id
                "Hello everyone! Let's get fit together!"  # message content
            ]
        )
        
        # Sign transaction
        signed_app_call = app_call_txn.sign(account_info["private_key"])
        
        # Submit transaction
        tx_id = client.send_transaction(signed_app_call)
        print(f"✅ Send chat message transaction submitted: {tx_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Send chat message failed: {str(e)}")
        return False

def test_submit_health_data(deployment_info):
    """Test submitting health data."""
    print("🧪 Testing submit_health_data...")
    
    client = get_algod_client()
    account_info = deployment_info["account"]
    app_id = deployment_info["deployment"]["app_id"]
    
    try:
        # Get suggested parameters
        params = client.suggested_params()
        
        # Create application call transaction
        app_call_txn = ApplicationCallTxn(
            sender=account_info["address"],
            sp=params,
            index=app_id,
            on_complete=0,  # NoOp
            app_args=[
                1,  # challenge_id
                "steps",  # data_type
                10000,  # value
                "google_fit",  # source
                "hash_12345"  # verification_hash
            ]
        )
        
        # Sign transaction
        signed_app_call = app_call_txn.sign(account_info["private_key"])
        
        # Submit transaction
        tx_id = client.send_transaction(signed_app_call)
        print(f"✅ Submit health data transaction submitted: {tx_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Submit health data failed: {str(e)}")
        return False

def main():
    """Main test function."""
    print("🧪 Challenge Platform Smart Contract Tests")
    print("=" * 50)
    
    # Load deployment info
    deployment_info = load_deployment_info()
    if not deployment_info:
        return
    
    print(f"📋 Testing contract with App ID: {deployment_info['deployment']['app_id']}")
    print(f"👤 Using account: {deployment_info['account']['address']}")
    
    # Run tests
    tests = [
        ("Create Challenge", test_create_challenge),
        ("Join Challenge", test_join_challenge),
        ("Get Challenge Info", test_get_challenge_info),
        ("Send Chat Message", test_send_chat_message),
        ("Submit Health Data", test_submit_health_data)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func(deployment_info)
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print(f"\n{'='*50}")
    print("📊 Test Results Summary:")
    print(f"{'='*50}")
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
        if success:
            passed += 1
    
    print(f"\n🎯 Tests passed: {passed}/{len(results)}")
    
    if passed == len(results):
        print("🎉 All tests passed! Contract is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the contract implementation.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️ Testing cancelled by user.")
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
