# Error constants for challenge platform smart contract

# Challenge-related errors
CHALLENGE_ALREADY_EXISTS = "Challenge already exists"
CHALLENGE_NOT_ACTIVE = "Challenge is not active"
CHALLENGE_STILL_ACTIVE = "Challenge is still active"
CHALLENGE_NOT_ENDED = "Challenge has not ended"
CHALLENGE_FULL = "Challenge is full"
CHALLENGE_NOT_FOUND = "Challenge not found"

# Participant-related errors
ALREADY_PARTICIPATING = "Already participating in this challenge"
NOT_PARTICIPATING = "Not participating in this challenge"
INSUFFICIENT_PARTICIPANTS = "Insufficient participants for elimination"

# Transaction-related errors
DIFFERENT_SENDER = "Transaction sender does not match expected sender"
WRONG_RECEIVER = "Transaction receiver is not the contract address"
INSUFFICIENT_STAKE = "Insufficient stake amount"

# Authorization errors
UNAUTHORIZED = "Unauthorized access"

# Time-related errors
NOT_TIME_FOR_ELIMINATION = "Not time for weekly elimination"

# General errors
INVALID_ARGUMENTS = "Invalid arguments provided"
