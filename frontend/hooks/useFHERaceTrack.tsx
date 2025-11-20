"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { FHERaceTrackAddresses } from "@/abi/FHERaceTrackAddresses";
import { FHERaceTrackABI } from "@/abi/FHERaceTrackABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

export type RaceInfo = {
  raceId: number;
  horseIds: number[];
  totalPrizePool: bigint;
  startTime: bigint;
  endTime: bigint;
  finished: boolean;
};

type FHERaceTrackInfoType = {
  abi: typeof FHERaceTrackABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getFHERaceTrackByChainId(
  chainId: number | undefined
): FHERaceTrackInfoType {
  if (!chainId) {
    return { abi: FHERaceTrackABI.abi };
  }

  const entry =
    FHERaceTrackAddresses[chainId.toString() as keyof typeof FHERaceTrackAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: FHERaceTrackABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: FHERaceTrackABI.abi,
  };
}

export const useFHERaceTrack = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [message, setMessage] = useState<string>("");
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isCreatingRace, setIsCreatingRace] = useState<boolean>(false);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [isExecutingRace, setIsExecutingRace] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [horses, setHorses] = useState<number[]>([]);
  const [isLoadingHorses, setIsLoadingHorses] = useState<boolean>(false);
  const [races, setRaces] = useState<RaceInfo[]>([]);
  const [isLoadingRaces, setIsLoadingRaces] = useState<boolean>(false);

  const fheRaceTrackRef = useRef<FHERaceTrackInfoType | undefined>(undefined);

  const fheRaceTrack = useMemo(() => {
    const c = getFHERaceTrackByChainId(chainId);
    fheRaceTrackRef.current = c;
    return c;
  }, [chainId]);

  // Manage deployment message separately to avoid interfering with operation messages
  useEffect(() => {
    // Only show deployment message when chainId is defined and address is missing
    if (chainId !== undefined && !fheRaceTrack.address) {
      setMessage((prevMessage) => {
        // Only update if current message is empty or is a deployment message
        if (prevMessage === "" || prevMessage.startsWith("FHERaceTrack deployment not found")) {
          return `FHERaceTrack deployment not found for chainId=${chainId}.`;
        }
        return prevMessage;
      });
    } else {
      // Clear deployment message when chainId is undefined or address exists
      setMessage((prevMessage) => {
        // Only clear if current message is a deployment message
        if (prevMessage.startsWith("FHERaceTrack deployment not found")) {
          return "";
        }
        return prevMessage;
      });
    }
  }, [chainId, fheRaceTrack.address]);

  const isDeployed = useMemo(() => {
    if (!fheRaceTrack) {
      return undefined;
    }
    return Boolean(fheRaceTrack.address && fheRaceTrack.address !== ethers.ZeroAddress);
  }, [fheRaceTrack]);

  // Mint Horse
  const mintHorse = useCallback(
    async (speed: number, stamina: number, agility: number) => {
      if (!fheRaceTrack.address || !instance || !ethersSigner) {
        setMessage("Contract not available");
        return;
      }

      setIsMinting(true);
      setMessage("Encrypting horse attributes...");

      try {
        const input = instance.createEncryptedInput(
          fheRaceTrack.address,
          ethersSigner.address
        );
        input.add32(speed);
        input.add32(stamina);
        input.add32(agility);

        const enc = await input.encrypt();

        setMessage("Minting horse...");

        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersSigner
        );

        const tx = await contract.mintHorse(
          enc.handles[0], // speed
          enc.handles[1], // stamina
          enc.handles[2], // agility
          enc.inputProof,
          enc.inputProof,
          enc.inputProof
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Extract horse ID from event
        const mintEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === "HorseMinted";
          } catch {
            return false;
          }
        });
        
        if (mintEvent) {
          const parsed = contract.interface.parseLog(mintEvent);
          const horseId = parsed?.args[1];
          if (horseId !== undefined) {
            setHorses((prev) => {
              const id = Number(horseId);
              return prev.includes(id) ? prev : [...prev, id].sort((a, b) => a - b);
            });
          }
        }
        
        setMessage(`Horse minted! Transaction: ${receipt.hash}`);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsMinting(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, instance, ethersSigner]
  );

  // Create Race
  const createRace = useCallback(
    async (horseIds: number[], duration: number) => {
      if (!fheRaceTrack.address || !ethersSigner) {
        setMessage("Contract not available");
        return;
      }

      setIsCreatingRace(true);
      setMessage("Creating race...");

      try {
        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersSigner
        );

        const tx = await contract.createRace(horseIds, duration);
        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Parse RaceStarted event from receipt
        let raceId: number | null = null;
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsedLog = contract.interface.parseLog(log);
              if (parsedLog && parsedLog.name === "RaceStarted") {
                raceId = Number(parsedLog.args.raceId);
                break;
              }
            } catch (e) {
              // Not a RaceStarted event, continue
            }
          }
        }
        
        if (raceId !== null) {
          setMessage(`Race created! Race ID: ${raceId}`);
        } else {
          setMessage(`Race created! Transaction: ${receipt.hash}`);
        }
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsCreatingRace(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, ethersSigner]
  );

  // Place Bet
  const placeBet = useCallback(
    async (raceId: number, horseId: number, amount: string) => {
      if (!fheRaceTrack.address || !instance || !ethersSigner) {
        setMessage("Contract not available");
        return;
      }

      setIsPlacingBet(true);
      setMessage("Encrypting bet data...");

      try {
        const input = instance.createEncryptedInput(
          fheRaceTrack.address,
          ethersSigner.address
        );
        input.add32(horseId);
        input.add32(parseInt(amount));

        const enc = await input.encrypt();

        setMessage("Placing bet...");

        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersSigner
        );

        const tx = await contract.placeBet(
          raceId,
          enc.handles[0], // horseId
          enc.handles[1], // amount
          enc.inputProof,
          enc.inputProof,
          { value: ethers.parseEther(amount) }
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`Bet placed! Transaction: ${receipt.hash}`);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsPlacingBet(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, instance, ethersSigner]
  );

  // Execute Race
  const executeRace = useCallback(
    async (raceId: number, random: number) => {
      if (!fheRaceTrack.address || !instance || !ethersSigner) {
        setMessage("Contract not available");
        return;
      }

      setIsExecutingRace(true);
      setMessage("Encrypting random number...");

      try {
        const input = instance.createEncryptedInput(
          fheRaceTrack.address,
          ethersSigner.address
        );
        input.add32(random);

        const enc = await input.encrypt();

        setMessage("Executing race...");

        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersSigner
        );

        const tx = await contract.executeRace(
          raceId,
          enc.handles[0],
          enc.inputProof
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`Race executed! Transaction: ${receipt.hash}`);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsExecutingRace(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, instance, ethersSigner]
  );

  // Decrypt Winner
  const decryptWinner = useCallback(
    async (raceId: number) => {
      if (!fheRaceTrack.address || !instance || !ethersSigner) {
        setMessage("Contract not available");
        return null;
      }

      setIsDecrypting(true);
      setMessage("Getting winner handle...");

      try {
        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersReadonlyProvider
        );

        const winnerHandle = await contract.getRaceWinner(raceId);

        if (!winnerHandle || winnerHandle === ethers.ZeroHash) {
          setMessage("No winner handle found");
          return null;
        }

        setMessage("Loading decryption signature...");

        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [fheRaceTrack.address],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          setMessage("Unable to build decryption signature");
          return null;
        }

        setMessage("Decrypting winner...");

        const result = await instance.userDecrypt(
          [{ handle: winnerHandle, contractAddress: fheRaceTrack.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const winnerIndex = result[winnerHandle];
        setMessage(`Winner decrypted! Winner index: ${winnerIndex}`);
        return winnerIndex;
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      } finally {
        setIsDecrypting(false);
      }
    },
    [
      fheRaceTrack.address,
      fheRaceTrack.abi,
      instance,
      ethersSigner,
      ethersReadonlyProvider,
      fhevmDecryptionSignatureStorage,
    ]
  );

  // Get Horses List
  const getHorses = useCallback(
    async (maxId: number = 100) => {
      if (!fheRaceTrack.address || !ethersReadonlyProvider) {
        return;
      }

      setIsLoadingHorses(true);
      try {
        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersReadonlyProvider
        );

        const horseIds: number[] = [];
        // Query horses sequentially until we find a gap
        for (let i = 1; i <= maxId; i++) {
          try {
            const horse = await contract.horses(i);
            if (horse && horse.exists) {
              horseIds.push(i);
            } else {
              // If we hit a non-existent horse, stop searching
              // (assuming IDs are sequential)
              break;
            }
          } catch (error: any) {
            // If error indicates horse doesn't exist, stop searching
            if (error?.code === "CALL_EXCEPTION" || error?.message?.includes("revert")) {
              break;
            }
            // For other errors, continue but log
            console.warn(`Error checking horse ${i}:`, error);
          }
        }

        setHorses(horseIds);
      } catch (error) {
        console.error("Error loading horses:", error);
      } finally {
        setIsLoadingHorses(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, ethersReadonlyProvider]
  );

  // Load horses when contract is available
  useEffect(() => {
    if (fheRaceTrack.address && ethersReadonlyProvider && horses.length === 0) {
      getHorses();
    }
  }, [fheRaceTrack.address, ethersReadonlyProvider, getHorses, horses.length]);

  // Get Races List
  const getRaces = useCallback(
    async (maxId: number = 100, creatorAddress?: string) => {
      if (!fheRaceTrack.address || !ethersReadonlyProvider) {
        return;
      }

      setIsLoadingRaces(true);
      try {
        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersReadonlyProvider
        );

        const raceList: RaceInfo[] = [];

        // Primary path: enumerate races via events to avoid reverting calls
        let raceIds: number[] = [];
        try {
          const filter = contract.filters.RaceStarted();
          const logs = await contract.queryFilter(filter, 0n);
          
          // Filter by creator address if provided
          if (creatorAddress) {
            // Get transaction receipts to find the actual sender (creator)
            const raceIdToCreator = new Map<number, string>();
            // Check if ethersReadonlyProvider is a Provider (has getTransaction method)
            const provider = ethersReadonlyProvider && 'getTransaction' in ethersReadonlyProvider 
              ? (ethersReadonlyProvider as ethers.Provider)
              : null;
            
            if (provider) {
              for (const log of logs) {
                try {
                  const tx = await provider.getTransaction(log.transactionHash);
                  if (tx && tx.from) {
                    // Check if log is EventLog (has args property)
                    const eventLog = log as ethers.EventLog;
                    const raceId = eventLog?.args ? Number(eventLog.args.raceId ?? eventLog.args[0]) : 0;
                    if (raceId > 0) {
                      raceIdToCreator.set(raceId, tx.from);
                    }
                  }
                } catch (e) {
                  // Skip if can't get transaction
                }
              }
            }
            
            // Filter race IDs by creator address
            const creatorRaceIds = Array.from(raceIdToCreator.entries())
              .filter(([_, addr]) => ethers.getAddress(addr) === ethers.getAddress(creatorAddress))
              .map(([raceId, _]) => raceId);
            
            raceIds = creatorRaceIds.sort((a, b) => b - a);
          } else {
            const ids = logs
              .map((log) => {
                const eventLog = log as ethers.EventLog;
                return eventLog?.args ? Number(eventLog.args.raceId ?? eventLog.args[0]) : 0;
              })
              .filter((id: number) => Number.isFinite(id) && id > 0);
            raceIds = Array.from(new Set(ids)).sort((a, b) => b - a);
          }
        } catch (e) {
          // If provider/logs are not available, we'll fall back to sequential probing below
        }

        if (raceIds.length > 0) {
          for (const id of raceIds) {
            try {
              const race = await contract.getRace(id);
              const raceIdValue = Number((race as any).raceId_ ?? (race as any)[0]);
              const horseIds = ((race as any).horseIds ?? (race as any)[1]).map((hid: bigint) => Number(hid));
              const totalPrizePool = (race as any).totalPrizePool ?? (race as any)[2];
              const startTime = (race as any).startTime ?? (race as any)[3];
              const endTime = (race as any).endTime ?? (race as any)[4];
              const finished = (race as any).finished ?? (race as any)[5];

              raceList.push({
                raceId: raceIdValue,
                horseIds,
                totalPrizePool,
                startTime,
                endTime,
                finished,
              });
            } catch (error) {
              console.warn(`Error loading race ${id}:`, error);
            }
          }
        } else {
          // Fallback path: sequential probing with fixed consecutive failure cap
          let consecutiveFailures = 0;
          const maxConsecutiveFailures = 5;
          let foundAnyRace = false;

          for (let i = 1; i <= maxId; i++) {
            try {
              const race = await contract.getRace(i);
              consecutiveFailures = 0;
              foundAnyRace = true;

              const raceIdField = (race as any).raceId_ ?? (race as any)[0];
              if (race && raceIdField && raceIdField.toString() !== "0") {
                // If filtering by creator, check if this race was created by the creator
                if (creatorAddress) {
                  try {
                    // Try to find the RaceStarted event for this race to get the creator
                    const filter = contract.filters.RaceStarted(raceIdField);
                    const logs = await contract.queryFilter(filter, 0n);
                    if (logs.length > 0) {
                      // Check if ethersReadonlyProvider is a Provider (has getTransaction method)
                      const provider = ethersReadonlyProvider && 'getTransaction' in ethersReadonlyProvider 
                        ? (ethersReadonlyProvider as ethers.Provider)
                        : null;
                      
                      if (provider) {
                        const tx = await provider.getTransaction(logs[0].transactionHash);
                        if (tx && tx.from && ethers.getAddress(tx.from) !== ethers.getAddress(creatorAddress)) {
                          // Skip this race if not created by the creator
                          consecutiveFailures++;
                          if (foundAnyRace && consecutiveFailures >= maxConsecutiveFailures) {
                            break;
                          }
                          continue;
                        }
                      }
                    } else {
                      // If no event found, skip this race when filtering by creator
                      consecutiveFailures++;
                      if (foundAnyRace && consecutiveFailures >= maxConsecutiveFailures) {
                        break;
                      }
                      continue;
                    }
                  } catch (e) {
                    // If can't verify creator, skip when filtering
                    consecutiveFailures++;
                    if (foundAnyRace && consecutiveFailures >= maxConsecutiveFailures) {
                      break;
                    }
                    continue;
                  }
                }

                const horseIds = ((race as any).horseIds ?? (race as any)[1]).map((hid: bigint) => Number(hid));
                raceList.push({
                  raceId: Number(raceIdField),
                  horseIds,
                  totalPrizePool: (race as any).totalPrizePool ?? (race as any)[2],
                  startTime: (race as any).startTime ?? (race as any)[3],
                  endTime: (race as any).endTime ?? (race as any)[4],
                  finished: (race as any).finished ?? (race as any)[5],
                });
              } else {
                consecutiveFailures++;
                if (foundAnyRace && consecutiveFailures >= maxConsecutiveFailures) {
                  break;
                }
              }
            } catch (error: any) {
              if (
                error?.code === "CALL_EXCEPTION" ||
                error?.code === 3 ||
                error?.message?.includes("revert") ||
                error?.message?.includes("Race does not exist") ||
                error?.message?.includes("execution reverted")
              ) {
                consecutiveFailures++;
                if (foundAnyRace && consecutiveFailures >= maxConsecutiveFailures) {
                  break;
                }
              } else {
                consecutiveFailures = 0;
                console.warn(`Error checking race ${i}:`, error);
              }
            }
          }
        }

        // ensure descending by raceId (largest first)
        raceList.sort((a, b) => b.raceId - a.raceId);
        setRaces(raceList);
        console.log(`Loaded ${raceList.length} races`);
      } catch (error) {
        console.error("Error loading races:", error);
      } finally {
        setIsLoadingRaces(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, ethersReadonlyProvider]
  );

  // Claim Reward
  const claimReward = useCallback(
    async (raceId: number, winnerIndex: number) => {
      if (!fheRaceTrack.address || !ethersSigner) {
        setMessage("Contract not available");
        return;
      }

      setIsClaiming(true);
      setMessage("Claiming reward...");

      try {
        const contract = new ethers.Contract(
          fheRaceTrack.address,
          fheRaceTrack.abi,
          ethersSigner
        );

        const tx = await contract.claimReward(raceId, winnerIndex);
        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`Reward claimed! Transaction: ${receipt.hash}`);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsClaiming(false);
      }
    },
    [fheRaceTrack.address, fheRaceTrack.abi, ethersSigner]
  );

  return {
    contractAddress: fheRaceTrack.address,
    isDeployed,
    message,
    mintHorse,
    createRace,
    placeBet,
    executeRace,
    decryptWinner,
    claimReward,
    isMinting,
    isCreatingRace,
    isPlacingBet,
    isExecutingRace,
    isDecrypting,
    isClaiming,
    horses,
    isLoadingHorses,
    getHorses,
    races,
    isLoadingRaces,
    getRaces,
  };
};

