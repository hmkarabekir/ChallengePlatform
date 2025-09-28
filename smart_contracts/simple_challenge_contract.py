#!/usr/bin/env python3
"""
Simple Challenge Platform Smart Contract in TEAL
"""

def create_approval_program():
    """Create approval program TEAL code."""
    teal = """
#pragma version 6

// Global state keys
byte "challenge_count"
byte "platform_fee"
byte "interest_rate"

// Application arguments
// 0: method selector
// 1: challenge_id (for join/leave)
// 2: stake_amount (for join)
// 3: name (for create)
// 4: description (for create)
// 5: max_participants (for create)
// 6: start_time (for create)
// 7: end_time (for create)

// Method selectors
byte "create_challenge"
byte "join_challenge"
byte "leave_challenge"
byte "complete_task"
byte "process_elimination"
byte "distribute_pool"

// Main approval program
txn ApplicationID
int 0
==
bnz creation

// Handle application calls
txn OnCompletion
int NoOp
==
bnz handle_noop

txn OnCompletion
int OptIn
==
bnz handle_optin

txn OnCompletion
int CloseOut
==
bnz handle_closeout

// Reject other transaction types
err

// Application creation
creation:
    // Initialize global state
    byte "challenge_count"
    int 0
    app_global_put
    
    byte "platform_fee"
    int 500  // 5% = 500/10000
    app_global_put
    
    byte "interest_rate"
    int 100  // 1% = 100/10000
    app_global_put
    
    int 1
    return

// Handle NoOp calls
handle_noop:
    // Get method selector
    txn ApplicationArgs 0
    byte "create_challenge"
    ==
    bnz create_challenge_method
    
    txn ApplicationArgs 0
    byte "join_challenge"
    ==
    bnz join_challenge_method
    
    txn ApplicationArgs 0
    byte "leave_challenge"
    ==
    bnz leave_challenge_method
    
    txn ApplicationArgs 0
    byte "complete_task"
    ==
    bnz complete_task_method
    
    txn ApplicationArgs 0
    byte "process_elimination"
    ==
    bnz process_elimination_method
    
    txn ApplicationArgs 0
    byte "distribute_pool"
    ==
    bnz distribute_pool_method
    
    // Unknown method
    err

// Create challenge method
create_challenge_method:
    // Validate arguments
    txn NumAppArgs
    int 8
    >=
    bz invalid_args
    
    // Get challenge count
    byte "challenge_count"
    app_global_get
    int 1
    +
    store 0  // challenge_id
    
    // Store challenge data
    byte "challenge_"
    load 0
    itob
    concat
    byte "_name"
    concat
    txn ApplicationArgs 3
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_description"
    concat
    txn ApplicationArgs 4
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_max_participants"
    concat
    txn ApplicationArgs 5
    btoi
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_start_time"
    concat
    txn ApplicationArgs 6
    btoi
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_end_time"
    concat
    txn ApplicationArgs 7
    btoi
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_creator"
    concat
    txn Sender
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_total_staked"
    concat
    int 0
    app_global_put
    
    byte "challenge_"
    load 0
    itob
    concat
    byte "_is_active"
    concat
    int 1
    app_global_put
    
    // Update challenge count
    byte "challenge_count"
    load 0
    app_global_put
    
    int 1
    return

// Join challenge method
join_challenge_method:
    // Validate arguments
    txn NumAppArgs
    int 2
    >=
    bz invalid_args
    
    // Get challenge_id and stake_amount
    txn ApplicationArgs 1
    btoi
    store 1  // challenge_id
    
    // Check if challenge exists and is active
    byte "challenge_"
    load 1
    itob
    concat
    byte "_is_active"
    concat
    app_global_get
    int 1
    ==
    bz challenge_not_found
    
    // Update total staked amount
    byte "challenge_"
    load 1
    itob
    concat
    byte "_total_staked"
    concat
    app_global_get
    txn ApplicationArgs 2
    btoi
    +
    store 2  // new_total_staked
    
    byte "challenge_"
    load 1
    itob
    concat
    byte "_total_staked"
    concat
    load 2
    app_global_put
    
    // Store participant info
    byte "participant_"
    txn Sender
    concat
    byte "_challenge_"
    concat
    load 1
    itob
    concat
    app_local_put
    txn ApplicationArgs 2
    btoi
    
    int 1
    return

// Leave challenge method
leave_challenge_method:
    // Validate arguments
    txn NumAppArgs
    int 2
    >=
    bz invalid_args
    
    // Get challenge_id
    txn ApplicationArgs 1
    btoi
    store 1  // challenge_id
    
    // Check if participant exists
    byte "participant_"
    txn Sender
    concat
    byte "_challenge_"
    concat
    load 1
    itob
    concat
    app_local_get
    store 3  // stake_amount
    
    // Stake remains in pool (forfeit)
    int 1
    return

// Complete task method
complete_task_method:
    // Simple implementation - just return success
    int 1
    return

// Process elimination method
process_elimination_method:
    // Simple implementation - just return success
    int 1
    return

// Distribute pool method
distribute_pool_method:
    // Simple implementation - just return success
    int 1
    return

// Handle OptIn
handle_optin:
    int 1
    return

// Handle CloseOut
handle_closeout:
    int 1
    return

// Error handlers
invalid_args:
    err

challenge_not_found:
    err
"""
    return teal.strip()

def create_clear_program():
    """Create clear program TEAL code."""
    teal = """
#pragma version 6
int 1
return
"""
    return teal.strip()

def main():
    """Main function to generate TEAL files."""
    print("Generating Challenge Platform Smart Contract TEAL...")
    
    # Create artifacts directory
    import os
    os.makedirs("artifacts", exist_ok=True)
    
    # Generate approval program
    approval_teal = create_approval_program()
    with open("artifacts/approval.teal", "w") as f:
        f.write(approval_teal)
    
    # Generate clear program
    clear_teal = create_clear_program()
    with open("artifacts/clear.teal", "w") as f:
        f.write(clear_teal)
    
    print("TEAL files generated successfully!")
    print("Files saved to: artifacts/")
    print(f"Approval program: {len(approval_teal)} characters")
    print(f"Clear program: {len(clear_teal)} characters")
    
    return {
        "approval_teal": approval_teal,
        "clear_teal": clear_teal
    }

if __name__ == "__main__":
    main()
