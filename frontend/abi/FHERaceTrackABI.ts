
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const FHERaceTrackABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "bettor",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "horseId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "BetPlaced",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "horseId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "HorseMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "RaceFinished",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "RaceStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "RewardDistributed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "bets",
      "outputs": [
        {
          "internalType": "address",
          "name": "bettor",
          "type": "address"
        },
        {
          "internalType": "euint32",
          "name": "horseId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "claimed",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "internalType": "uint32",
          "name": "winnerIndexDecrypted",
          "type": "uint32"
        }
      ],
      "name": "claimReward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256[]",
          "name": "horseIds",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "createRace",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32",
          "name": "randomEncrypted",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "randomProof",
          "type": "bytes"
        }
      ],
      "name": "executeRace",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "bettor",
          "type": "address"
        }
      ],
      "name": "getBet",
      "outputs": [
        {
          "internalType": "address",
          "name": "bettor_",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "claimed",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "horseId",
          "type": "uint256"
        }
      ],
      "name": "getHorseAttributes",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "speed",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "stamina",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "agility",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        }
      ],
      "name": "getRace",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "raceId_",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "horseIds",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256",
          "name": "totalPrizePool",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "finished",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        }
      ],
      "name": "getRaceWinner",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "winnerIndex",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "horses",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        },
        {
          "internalType": "euint32",
          "name": "speed",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "stamina",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "agility",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "speedEncrypted",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "staminaEncrypted",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "agilityEncrypted",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "speedProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "staminaProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "agilityProof",
          "type": "bytes"
        }
      ],
      "name": "mintHorse",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32",
          "name": "horseIdEncrypted",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "amountEncrypted",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "horseIdProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "amountProof",
          "type": "bytes"
        }
      ],
      "name": "placeBet",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "raceBettors",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "races",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "raceId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalPrizePool",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "finished",
          "type": "bool"
        },
        {
          "internalType": "euint32",
          "name": "winnerIndex",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

