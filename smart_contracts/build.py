#!/usr/bin/env python3
"""
Build script for smart contracts
"""
import sys
import os
from pathlib import Path

# Add the contracts directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "contracts"))

from challenge_contract import ChallengePlatform

def main():
    """Build the smart contract"""
    print("Building Challenge Platform smart contract...")
    
    # Create artifacts directory
    artifacts_dir = Path(__file__).parent / "artifacts"
    artifacts_dir.mkdir(exist_ok=True)
    
    # Build the contract
    contract = ChallengePlatform()
    
    # Save the contract
    contract_path = artifacts_dir / "challenge_platform.py"
    with open(contract_path, "w") as f:
        f.write(str(contract))
    
    print(f"Contract built successfully: {contract_path}")
    print("Build completed!")

if __name__ == "__main__":
    main()
