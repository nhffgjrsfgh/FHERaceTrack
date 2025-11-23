//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAY USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider, Contract } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);

  // Query EIP712 domain from InputVerifier and KMSVerifier to obtain verifyingContract addresses
  const domainAbi = [
    "function eip712Domain() view returns (bytes1, string, string, uint256, address, bytes32, uint256[])",
  ];

  const inputVerifier = new Contract(
    parameters.metadata.InputVerifierAddress,
    domainAbi,
    provider
  );
  const inputDomain = await inputVerifier.eip712Domain();
  const verifyingContractAddressInputVerification =
    inputDomain[4] as `0x${string}`;

  const kmsVerifier = new Contract(
    parameters.metadata.KMSVerifierAddress,
    domainAbi,
    provider
  );
  const kmsDomain = await kmsVerifier.eip712Domain();
  const verifyingContractAddressDecryption = kmsDomain[4] as `0x${string}`;

  const instance = await MockFhevmInstance.create(provider, provider, {
    //aclContractAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D",
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: parameters.chainId,
    // inputVerifierContractAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030",
    // kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption,
    verifyingContractAddressInputVerification,
  }, {
    // required properties param in v0.3.0
    inputVerifierProperties: {},
    kmsVerifierProperties: {},
  });
  return instance;
};

