#!/usr/bin/env python3
"""
Build script for Challenge Platform smart contracts
"""

import os
import sys
from pathlib import Path

# Add the contracts directory to Python path
contracts_dir = Path(__file__).parent
sys.path.insert(0, str(contracts_dir))

from algopy import compile_program
from challenge_contract import ChallengePlatform

def build_contract():
    """Build the challenge platform smart contract."""
    print("Building Challenge Platform Smart Contract...")
    
    try:
        # Compile the contract
        compiled_contract = compile_program(ChallengePlatform)
        
        # Create artifacts directory
        artifacts_dir = contracts_dir / "artifacts"
        artifacts_dir.mkdir(exist_ok=True)
        
        # Save compiled contract
        with open(artifacts_dir / "challenge_platform_approval.teal", "w") as f:
            f.write(compiled_contract.approval_program)
        
        with open(artifacts_dir / "challenge_platform_clear.teal", "w") as f:
            f.write(compiled_contract.clear_program)
        
        print("✅ Contract compiled successfully!")
        print(f"📁 Artifacts saved to: {artifacts_dir}")
        print(f"📄 Approval program: {len(compiled_contract.approval_program)} characters")
        print(f"📄 Clear program: {len(compiled_contract.clear_program)} characters")
        
        return True
        
    except Exception as e:
        print(f"❌ Error compiling contract: {e}")
        return False

if __name__ == "__main__":
    success = build_contract()
    sys.exit(0 if success else 1)
