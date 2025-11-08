"use client";

import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useFHERaceTrack } from "@/hooks/useFHERaceTrack";
import { useState, useEffect } from "react";

export const FHERaceTrackDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const fheRaceTrack = useFHERaceTrack({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Form states
  const [speed, setSpeed] = useState("75");
  const [stamina, setStamina] = useState("80");
  const [agility, setAgility] = useState("70");
  const [raceHorseIds, setRaceHorseIds] = useState("");
  const [raceDuration, setRaceDuration] = useState("3600");
  const [betRaceId, setBetRaceId] = useState("");
  const [betHorseId, setBetHorseId] = useState("");
  const [betAmount, setBetAmount] = useState("0.01");
  const [executeRaceId, setExecuteRaceId] = useState("");
  const [decryptRaceId, setDecryptRaceId] = useState("");
  const [claimRaceId, setClaimRaceId] = useState("");
  const [claimWinnerIndex, setClaimWinnerIndex] = useState("");
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"mint" | "bet" | "race" | "claim">("bet");

  // Load races when entering Race Management tab
  useEffect(() => {
    if (activeTab === "race" && fheRaceTrack.contractAddress && fheRaceTrack.races.length === 0 && accounts?.[0]) {
      fheRaceTrack.getRaces(100, accounts[0]);
    }
  }, [activeTab, fheRaceTrack.contractAddress, fheRaceTrack.races.length, fheRaceTrack.getRaces, accounts]);

  const buttonClass =
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg " +
    "transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const cardClass =
    "bg-white rounded-xl shadow-lg p-6 border border-gray-200";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={cardClass + " max-w-md w-full text-center"}>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Connect to MetaMask
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your MetaMask wallet to start using FHE RaceTrack
          </p>
          <button className={buttonClass} onClick={connect}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Only show error when chainId is defined and contract is explicitly not deployed
  if (chainId !== undefined && fheRaceTrack.isDeployed === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={cardClass + " max-w-md w-full text-center"}>
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Contract Not Deployed
          </h2>
          <p className="text-gray-600">
            FHERaceTrack contract is not deployed on chainId={chainId}. Please
            deploy the contract first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Status Bar */}
      <div className={cardClass}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Chain ID:</span>
            <span className="ml-2 font-mono font-semibold">{chainId}</span>
          </div>
          <div>
            <span className="text-gray-600">Account:</span>
            <span className="ml-2 font-mono text-xs">
              {accounts?.[0]?.slice(0, 6)}...{accounts?.[0]?.slice(-4)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">FHEVM Status:</span>
            <span className="ml-2 font-semibold">{fhevmStatus}</span>
          </div>
          <div>
            <span className="text-gray-600">Contract:</span>
            <span className="ml-2 font-mono text-xs">
              {fheRaceTrack.contractAddress?.slice(0, 6)}...
              {fheRaceTrack.contractAddress?.slice(-4)}
            </span>
          </div>
        </div>
        {fheRaceTrack.message && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{fheRaceTrack.message}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className={cardClass}>
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveTab("bet")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "bet"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            💰 Place Bet
          </button>
          <button
            onClick={() => setActiveTab("claim")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "claim"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🎁 Claim Reward
          </button>
          <button
            onClick={() => setActiveTab("race")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "race"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🏁 Race Management
          </button>
          <button
            onClick={() => setActiveTab("mint")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "mint"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🏇 Mint Horse
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {/* Mint Horse Tab */}
        {activeTab === "mint" && (
          <div className={cardClass}>
            <h2 className="text-xl font-bold mb-4 text-gray-800">🏇 Mint Horse</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speed (50-100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stamina (50-100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={stamina}
                  onChange={(e) => setStamina(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agility (50-100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={agility}
                  onChange={(e) => setAgility(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                className={buttonClass + " w-full"}
                disabled={fheRaceTrack.isMinting || !fhevmInstance}
                onClick={() =>
                  fheRaceTrack.mintHorse(
                    parseInt(speed),
                    parseInt(stamina),
                    parseInt(agility)
                  )
                }
              >
                {fheRaceTrack.isMinting ? "Minting..." : "Mint Horse"}
              </button>
            </div>
          </div>
        )}

        {/* Place Bet Tab */}
        {activeTab === "bet" && (
          <div className={cardClass}>
            <h2 className="text-xl font-bold mb-4 text-gray-800">💰 Place Bet</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Race ID
                </label>
                <input
                  type="number"
                  value={betRaceId}
                  onChange={(e) => setBetRaceId(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horse ID
                </label>
                <input
                  type="number"
                  value={betHorseId}
                  onChange={(e) => setBetHorseId(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="text"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                className={buttonClass + " w-full"}
                disabled={fheRaceTrack.isPlacingBet || !fhevmInstance}
                onClick={() =>
                  fheRaceTrack.placeBet(
                    parseInt(betRaceId),
                    parseInt(betHorseId),
                    betAmount
                  )
                }
              >
                {fheRaceTrack.isPlacingBet ? "Placing Bet..." : "Place Bet"}
              </button>
            </div>
          </div>
        )}

        {/* Race Management Tab */}
        {activeTab === "race" && (
          <div className="space-y-6">
            {/* Create Race */}
            <div className={cardClass}>
              <h2 className="text-xl font-bold mb-4 text-gray-800">🏁 Create Race</h2>
              <div className="space-y-4">
                {/* Available Horses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Horses
                    </label>
                    <button
                      type="button"
                      onClick={() => fheRaceTrack.getHorses()}
                      disabled={fheRaceTrack.isLoadingHorses}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {fheRaceTrack.isLoadingHorses ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                  {fheRaceTrack.horses.length > 0 ? (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {fheRaceTrack.horses.map((horseId) => (
                          <button
                            key={horseId}
                            type="button"
                            onClick={() => {
                              const currentIds = raceHorseIds
                                .split(",")
                                .map((id) => id.trim())
                                .filter((id) => id !== "");
                              if (currentIds.includes(horseId.toString())) {
                                // Remove if already selected
                                setRaceHorseIds(
                                  currentIds
                                    .filter((id) => id !== horseId.toString())
                                    .join(",")
                                );
                              } else {
                                // Add to selection
                                setRaceHorseIds(
                                  [...currentIds, horseId.toString()].join(",")
                                );
                              }
                            }}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              raceHorseIds
                                .split(",")
                                .map((id) => id.trim())
                                .includes(horseId.toString())
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50"
                            }`}
                          >
                            🐴 {horseId}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-500 text-center">
                      {fheRaceTrack.isLoadingHorses
                        ? "Loading horses..."
                        : "No horses available. Mint a horse first."}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horse IDs (comma-separated, e.g., 1,2,3)
                  </label>
                  <input
                    type="text"
                    value={raceHorseIds}
                    onChange={(e) => setRaceHorseIds(e.target.value)}
                    className={inputClass}
                    placeholder="1,2,3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Click horses above to select, or type IDs manually
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={raceDuration}
                    onChange={(e) => setRaceDuration(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  className={buttonClass + " w-full"}
                  disabled={fheRaceTrack.isCreatingRace}
                  onClick={async () => {
                    const ids = raceHorseIds
                      .split(",")
                      .map((id) => parseInt(id.trim()))
                      .filter((id) => !isNaN(id));
                    await fheRaceTrack.createRace(ids, parseInt(raceDuration));
                    // Wait a bit for the node to sync, then refresh races list
                    setTimeout(() => {
                      if (accounts?.[0]) {
                        fheRaceTrack.getRaces(100, accounts[0]);
                      }
                    }, 1000);
                  }}
                >
                  {fheRaceTrack.isCreatingRace ? "Creating..." : "Create Race"}
                </button>
              </div>
            </div>

            {/* Execute Race and Race List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Execute Race */}
              <div className={cardClass}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">⚡ Execute Race</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Race ID
                    </label>
                    <input
                      type="number"
                      value={executeRaceId}
                      onChange={(e) => setExecuteRaceId(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <button
                    className={buttonClass + " w-full"}
                    disabled={fheRaceTrack.isExecutingRace || !fhevmInstance}
                    onClick={async () => {
                      await fheRaceTrack.executeRace(
                        parseInt(executeRaceId),
                        Math.floor(Math.random() * 1000)
                      );
                      // Refresh races list after executing
                      if (accounts?.[0]) {
                        fheRaceTrack.getRaces(100, accounts[0]);
                      }
                    }}
                  >
                    {fheRaceTrack.isExecutingRace ? "Executing..." : "Execute Race"}
                  </button>
                </div>
              </div>

              {/* Race List */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">📋 My Races</h2>
                  <button
                    type="button"
                    onClick={() => {
                      if (accounts?.[0]) {
                        fheRaceTrack.getRaces(100, accounts[0]);
                      }
                    }}
                    disabled={fheRaceTrack.isLoadingRaces}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    {fheRaceTrack.isLoadingRaces ? "Loading..." : "Refresh"}
                  </button>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {fheRaceTrack.isLoadingRaces ? (
                    <div className="text-center text-gray-500 py-4">Loading races...</div>
                  ) : fheRaceTrack.races.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No races found. Create a race first.</div>
                  ) : (
                    fheRaceTrack.races.map((race) => {
                      const now = Date.now() / 1000;
                      const startTime = Number(race.startTime);
                      const endTime = Number(race.endTime);
                      let status = "";
                      let statusColor = "";
                      
                      if (race.finished) {
                        status = "Finished";
                        statusColor = "bg-gray-200 text-gray-700";
                      } else if (now < startTime) {
                        status = "Not Started";
                        statusColor = "bg-yellow-100 text-yellow-800";
                      } else if (now >= startTime && now < endTime) {
                        status = "In Progress";
                        statusColor = "bg-green-100 text-green-800";
                      } else {
                        status = "Ready to Execute";
                        statusColor = "bg-blue-100 text-blue-800";
                      }

                      return (
                        <div
                          key={race.raceId}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                          onClick={() => setExecuteRaceId(race.raceId.toString())}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-lg text-gray-800">
                              Race #{race.raceId}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                              {status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-600">Horses: </span>
                              <span className="font-medium">
                                {race.horseIds.map((id, idx) => (
                                  <span key={id}>
                                    🐴 {id}
                                    {idx < race.horseIds.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Prize Pool: </span>
                              <span className="font-medium">
                                {ethers.formatEther(race.totalPrizePool)} ETH
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Decrypt Winner */}
            <div className={cardClass}>
              <h2 className="text-xl font-bold mb-4 text-gray-800">🔓 Decrypt Winner</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Race ID
                  </label>
                  <input
                    type="number"
                    value={decryptRaceId}
                    onChange={(e) => setDecryptRaceId(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  className={buttonClass + " w-full"}
                  disabled={fheRaceTrack.isDecrypting || !fhevmInstance}
                  onClick={async () => {
                    const winner = await fheRaceTrack.decryptWinner(
                      parseInt(decryptRaceId)
                    );
                    if (winner !== null) {
                      setClaimWinnerIndex(winner.toString());
                    }
                  }}
                >
                  {fheRaceTrack.isDecrypting ? "Decrypting..." : "Decrypt Winner"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Claim Reward Tab */}
        {activeTab === "claim" && (
          <div className={cardClass}>
            <h2 className="text-xl font-bold mb-4 text-gray-800">🎁 Claim Reward</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Race ID
                </label>
                <input
                  type="number"
                  value={claimRaceId}
                  onChange={(e) => setClaimRaceId(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Winner Index
                </label>
                <input
                  type="number"
                  value={claimWinnerIndex}
                  onChange={(e) => setClaimWinnerIndex(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                className={buttonClass + " w-full"}
                disabled={fheRaceTrack.isClaiming}
                onClick={() =>
                  fheRaceTrack.claimReward(
                    parseInt(claimRaceId),
                    parseInt(claimWinnerIndex)
                  )
                }
              >
                {fheRaceTrack.isClaiming ? "Claiming..." : "Claim Reward"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

