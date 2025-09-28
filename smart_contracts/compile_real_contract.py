#!/usr/bin/env python3
"""
Compile the real Challenge Platform smart contract using Algopy
"""

import os
import sys
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def compile_challenge_contract():
    """Compile the real challenge contract using Algopy."""
    try:
        print("Compiling real Challenge Platform smart contract...")
        
        # Import the contract
        from contracts.challenge_contract import ChallengePlatform
        
        # Create contract instance
        contract = ChallengePlatform()
        
        # Compile to TEAL
        print("Generating TEAL bytecode...")
        
        # Get approval program
        approval_program = contract.approval_program()
        print(f"Approval program size: {len(approval_program)} bytes")
        
        # Get clear program  
        clear_program = contract.clear_program()
        print(f"Clear program size: {len(clear_program)} bytes")
        
        # Save compiled programs
        artifacts_dir = Path("artifacts")
        artifacts_dir.mkdir(exist_ok=True)
        
        with open(artifacts_dir / "approval.teal", "w") as f:
            f.write(approval_program)
            
        with open(artifacts_dir / "clear.teal", "w") as f:
            f.write(clear_program)
        
        print("Contract compiled successfully!")
        print(f"Artifacts saved to: {artifacts_dir}")
        
        return {
            "approval_program": approval_program.encode('utf-8'),
            "clear_program": clear_program.encode('utf-8'),
            "approval_teal": approval_program,
            "clear_teal": clear_program
        }
        
    except Exception as e:
        print(f"Compilation failed: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main compilation function."""
    print("Challenge Platform Smart Contract Compilation")
    print("=" * 60)
    
    result = compile_challenge_contract()
    
    if result:
        print("\n✅ Compilation successful!")
        print(f"Approval program: {len(result['approval_program'])} bytes")
        print(f"Clear program: {len(result['clear_program'])} bytes")
        return result
    else:
        print("\n❌ Compilation failed!")
        return None

if __name__ == "__main__":
    main()
