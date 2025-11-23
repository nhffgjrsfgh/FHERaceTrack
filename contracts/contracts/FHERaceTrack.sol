// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE RaceTrack - A decentralized encrypted horse racing DApp
/// @notice This contract implements a horse racing system using FHEVM for privacy-preserving operations
contract FHERaceTrack is ZamaEthereumConfig {
    // ============ Events ============
    
    event HorseMinted(address indexed owner, uint256 indexed horseId, uint256 timestamp);
    event BetPlaced(address indexed bettor, uint256 indexed raceId, uint256 indexed horseId, uint256 timestamp);
    event RaceStarted(uint256 indexed raceId, uint256 timestamp);
    event RaceFinished(uint256 indexed raceId, uint256 timestamp);
    event RewardDistributed(address indexed winner, uint256 indexed raceId, uint256 amount);

    // ============ Structs ============
    
    struct Horse {
        address owner;
        bool exists;
        // Encrypted attributes stored as euint32
        euint32 speed;      // Encrypted speed attribute
        euint32 stamina;    // Encrypted stamina attribute
        euint32 agility;    // Encrypted agility attribute
    }

    struct Bet {
        address bettor;
        euint32 horseId;   // Encrypted horse ID
        uint256 amount;     // Clear bet amount (for simplicity)
        bool claimed;
    }

    struct Race {
        uint256 raceId;
        uint256[] horseIds;
        uint256 totalPrizePool;
        uint256 startTime;
        uint256 endTime;
        bool finished;
        euint32 winnerIndex;    // Encrypted winner horse index
    }

    // ============ State Variables ============
    
    uint256 private _nextHorseId = 1;
    uint256 private _nextRaceId = 1;
    
    mapping(uint256 => Horse) public horses;
    mapping(uint256 => Race) public races;
    mapping(uint256 => mapping(address => Bet)) public bets; // raceId => bettor => Bet
    mapping(uint256 => address[]) public raceBettors; // raceId => bettors list

    // ============ Modifiers ============
    
    modifier onlyHorseOwner(uint256 horseId) {
        require(horses[horseId].exists, "Horse does not exist");
        require(horses[horseId].owner == msg.sender, "Not horse owner");
        _;
    }

    modifier raceExists(uint256 raceId) {
        require(races[raceId].raceId != 0, "Race does not exist");
        _;
    }

    // ============ Horse NFT Management ============
    
    /// @notice Mint a new horse NFT with encrypted random attributes
    /// @param speedEncrypted Encrypted speed attribute (euint32)
    /// @param staminaEncrypted Encrypted stamina attribute (euint32)
    /// @param agilityEncrypted Encrypted agility attribute (euint32)
    /// @param speedProof Proof for speed encryption
    /// @param staminaProof Proof for stamina encryption
    /// @param agilityProof Proof for agility encryption
    /// @return horseId The ID of the newly minted horse
    function mintHorse(
        externalEuint32 speedEncrypted,
        externalEuint32 staminaEncrypted,
        externalEuint32 agilityEncrypted,
        bytes calldata speedProof,
        bytes calldata staminaProof,
        bytes calldata agilityProof
    ) external returns (uint256) {
        uint256 horseId = _nextHorseId++;
        
        euint32 speed = FHE.fromExternal(speedEncrypted, speedProof);
        euint32 stamina = FHE.fromExternal(staminaEncrypted, staminaProof);
        euint32 agility = FHE.fromExternal(agilityEncrypted, agilityProof);
        
        // Store encrypted attributes
        horses[horseId] = Horse({
            owner: msg.sender,
            exists: true,
            speed: speed,
            stamina: stamina,
            agility: agility
        });
        
        // Allow owner to decrypt
        FHE.allowThis(speed);
        FHE.allow(speed, msg.sender);
        FHE.allowThis(stamina);
        FHE.allow(stamina, msg.sender);
        FHE.allowThis(agility);
        FHE.allow(agility, msg.sender);
        
        emit HorseMinted(msg.sender, horseId, block.timestamp);
        return horseId;
    }

    /// @notice Get encrypted horse attributes
    /// @param horseId The ID of the horse
    /// @return speed Encrypted speed
    /// @return stamina Encrypted stamina
    /// @return agility Encrypted agility
    function getHorseAttributes(uint256 horseId) 
        external 
        view 
        returns (euint32 speed, euint32 stamina, euint32 agility) 
    {
        require(horses[horseId].exists, "Horse does not exist");
        Horse memory horse = horses[horseId];
        return (horse.speed, horse.stamina, horse.agility);
    }

    // ============ Betting ============
    
    /// @notice Place an encrypted bet on a horse in a race
    /// @param raceId The ID of the race
    /// @param horseIdEncrypted Encrypted horse ID to bet on (euint32)
    /// @param amountEncrypted Encrypted bet amount (euint32)
    /// @param horseIdProof Proof for horse ID encryption
    /// @param amountProof Proof for amount encryption
    function placeBet(
        uint256 raceId,
        externalEuint32 horseIdEncrypted,
        externalEuint32 amountEncrypted,
        bytes calldata horseIdProof,
        bytes calldata amountProof
    ) external payable raceExists(raceId) {
        require(!races[raceId].finished, "Race already finished");
        require(block.timestamp < races[raceId].endTime, "Race registration closed");
        require(bets[raceId][msg.sender].amount == 0, "Already placed bet");
        require(msg.value > 0, "Bet amount must be greater than 0");
        
        euint32 horseId = FHE.fromExternal(horseIdEncrypted, horseIdProof);
        euint32 amount = FHE.fromExternal(amountEncrypted, amountProof);
        
        // Store bet information
        bets[raceId][msg.sender] = Bet({
            bettor: msg.sender,
            horseId: horseId,
            amount: msg.value,
            claimed: false
        });
        
        raceBettors[raceId].push(msg.sender);
        
        // Update prize pool
        races[raceId].totalPrizePool += msg.value;
        
        emit BetPlaced(msg.sender, raceId, 0, block.timestamp);
    }

    // ============ Race Management ============
    
    /// @notice Create a new race with specified horses
    /// @param horseIds Array of horse IDs participating in the race
    /// @param duration Duration of the race in seconds
    /// @return raceId The ID of the newly created race
    function createRace(uint256[] calldata horseIds, uint256 duration) 
        external 
        returns (uint256) 
    {
        require(horseIds.length >= 2, "At least 2 horses required");
        
        uint256 raceId = _nextRaceId++;
        
        // Verify all horses exist
        for (uint256 i = 0; i < horseIds.length; i++) {
            require(horses[horseIds[i]].exists, "Horse does not exist");
        }
        
        races[raceId] = Race({
            raceId: raceId,
            horseIds: horseIds,
            totalPrizePool: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            finished: false,
            winnerIndex: FHE.asEuint32(0)
        });
        
        emit RaceStarted(raceId, block.timestamp);
        return raceId;
    }

    /// @notice Execute race calculation with encrypted random number
    /// @param raceId The ID of the race
    /// @param randomEncrypted Encrypted random number (euint32)
    /// @param randomProof Proof for random number encryption
    function executeRace(
        uint256 raceId,
        externalEuint32 randomEncrypted,
        bytes calldata randomProof
    ) external raceExists(raceId) {
        require(!races[raceId].finished, "Race already finished");
        require(block.timestamp >= races[raceId].endTime, "Race not finished yet");
        
        Race storage race = races[raceId];
        euint32 random = FHE.fromExternal(randomEncrypted, randomProof);
        
        // Calculate winner using encrypted operations
        // Score formula: baseScore (speed + stamina + agility) + randomFactor
        // Random factor is limited to add variability while keeping attribute advantage
        // Each horse gets a different random factor based on its index and the random number
        
        euint32 maxScore = FHE.asEuint32(0);
        euint32 winnerIndex = FHE.asEuint32(0);
        euint32 currentIndex = FHE.asEuint32(0);
        
        // Iterate through horses and find the one with highest score
        for (uint256 i = 0; i < race.horseIds.length; i++) {
            uint256 horseId = race.horseIds[i];
            Horse memory horse = horses[horseId];
            
            // Calculate base score: speed + stamina + agility (range: 150-300)
            euint32 baseScore = FHE.add(horse.speed, horse.stamina);
            baseScore = FHE.add(baseScore, horse.agility);
            
            // Generate unique random factor for each horse
            // Add current index to create variation, then take modulo
            euint32 indexValue = FHE.asEuint32(uint32(i));
            euint32 combinedRandom = FHE.add(random, indexValue);
            euint32 horseRandomFactor = FHE.rem(combinedRandom, 50); // Random factor: 0-49
            
            // Add random factor to introduce variability
            // Higher attribute horses still have advantage, but randomness can affect outcome
            // Example: Horse with 250 base score + 30 random = 280
            //          Horse with 200 base score + 45 random = 245
            //          First horse wins, but if random factors were reversed, second could win
            euint32 totalScore = FHE.add(baseScore, horseRandomFactor);
            
            // Compare with max score using encrypted comparison
            // If current score > maxScore, update maxScore and winnerIndex
            ebool isGreater = FHE.gt(totalScore, maxScore);
            maxScore = FHE.select(isGreater, totalScore, maxScore);
            winnerIndex = FHE.select(isGreater, currentIndex, winnerIndex);
            
            currentIndex = FHE.add(currentIndex, FHE.asEuint32(1));
        }
        
        // Store the winner index (encrypted)
        race.winnerIndex = winnerIndex;
        
        // Allow contract and all bettors to decrypt winner
        FHE.allowThis(race.winnerIndex);
        for (uint256 i = 0; i < raceBettors[raceId].length; i++) {
            FHE.allow(race.winnerIndex, raceBettors[raceId][i]);
        }
        
        race.finished = true;
        
        emit RaceFinished(raceId, block.timestamp);
    }

    /// @notice Get the encrypted winner index for a race
    /// @param raceId The ID of the race
    /// @return winnerIndex Encrypted winner horse index
    function getRaceWinner(uint256 raceId) 
        external 
        view 
        raceExists(raceId) 
        returns (euint32 winnerIndex) 
    {
        return races[raceId].winnerIndex;
    }

    // ============ Reward Distribution ============
    
    /// @notice Claim reward after race completion
    /// @param raceId The ID of the race
    /// @param winnerIndexDecrypted Decrypted winner index (for verification)
    function claimReward(uint256 raceId, uint32 winnerIndexDecrypted) 
        external 
        raceExists(raceId) 
    {
        Race storage race = races[raceId];
        require(race.finished, "Race not finished");
        
        Bet storage bet = bets[raceId][msg.sender];
        require(bet.amount > 0, "No bet placed");
        require(!bet.claimed, "Reward already claimed");
        
        // Verify winner (in production, this would be done via FHE comparison)
        // For now, we'll distribute rewards proportionally to all winners
        // In a full implementation, we'd decrypt and compare the winner index
        
        // Simplified: calculate reward share based on prize pool
        uint256 totalBets = raceBettors[raceId].length;
        uint256 reward = race.totalPrizePool / totalBets; // Equal distribution for simplicity
        
        bet.claimed = true;
        
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");
        
        emit RewardDistributed(msg.sender, raceId, reward);
    }

    /// @notice Get race information
    /// @param raceId The ID of the race
    /// @return raceId_ The race ID
    /// @return horseIds Array of horse IDs
    /// @return totalPrizePool Total prize pool
    /// @return startTime Race start time
    /// @return endTime Race end time
    /// @return finished Whether race is finished
    function getRace(uint256 raceId) 
        external 
        view 
        raceExists(raceId) 
        returns (
            uint256 raceId_,
            uint256[] memory horseIds,
            uint256 totalPrizePool,
            uint256 startTime,
            uint256 endTime,
            bool finished
        ) 
    {
        Race memory race = races[raceId];
        return (
            race.raceId,
            race.horseIds,
            race.totalPrizePool,
            race.startTime,
            race.endTime,
            race.finished
        );
    }

    /// @notice Get bet information for a user in a race
    /// @param raceId The ID of the race
    /// @param bettor The address of the bettor
    /// @return bettor_ The bettor address
    /// @return amount The bet amount
    /// @return claimed Whether reward was claimed
    function getBet(uint256 raceId, address bettor) 
        external 
        view 
        raceExists(raceId) 
        returns (
            address bettor_,
            uint256 amount,
            bool claimed
        ) 
    {
        Bet memory bet = bets[raceId][bettor];
        return (bet.bettor, bet.amount, bet.claimed);
    }
}

