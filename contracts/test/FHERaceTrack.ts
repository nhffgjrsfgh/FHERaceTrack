import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHERaceTrack, FHERaceTrack__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHERaceTrack")) as FHERaceTrack__factory;
  const fheRaceTrackContract = (await factory.deploy()) as FHERaceTrack;
  const fheRaceTrackContractAddress = await fheRaceTrackContract.getAddress();

  return { fheRaceTrackContract, fheRaceTrackContractAddress };
}

describe("FHERaceTrack", function () {
  let signers: Signers;
  let fheRaceTrackContract: FHERaceTrack;
  let fheRaceTrackContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ fheRaceTrackContract, fheRaceTrackContractAddress } = await deployFixture());
  });

  it("should mint a horse with encrypted attributes", async function () {
    const speed = 75;
    const stamina = 80;
    const agility = 70;

    // Encrypt attributes
    const encryptedSpeed = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.alice.address)
      .add32(speed)
      .encrypt();

    const encryptedStamina = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.alice.address)
      .add32(stamina)
      .encrypt();

    const encryptedAgility = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.alice.address)
      .add32(agility)
      .encrypt();

    const tx = await fheRaceTrackContract
      .connect(signers.alice)
      .mintHorse(
        encryptedSpeed.handles[0],
        encryptedStamina.handles[0],
        encryptedAgility.handles[0],
        encryptedSpeed.inputProof,
        encryptedStamina.inputProof,
        encryptedAgility.inputProof
      );
    await tx.wait();

    // Verify horse was minted
    const horse = await fheRaceTrackContract.horses(1);
    expect(horse.exists).to.be.true;
    expect(horse.owner).to.eq(signers.alice.address);
  });

  it("should create a race", async function () {
    // First mint two horses
    const speed1 = 75;
    const stamina1 = 80;
    const agility1 = 70;

    const encryptedSpeed1 = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.alice.address)
      .add32(speed1)
      .encrypt();

    const encryptedStamina1 = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.alice.address)
      .add32(stamina1)
      .encrypt();

    const encryptedAgility1 = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.alice.address)
      .add32(agility1)
      .encrypt();

    await fheRaceTrackContract
      .connect(signers.alice)
      .mintHorse(
        encryptedSpeed1.handles[0],
        encryptedStamina1.handles[0],
        encryptedAgility1.handles[0],
        encryptedSpeed1.inputProof,
        encryptedStamina1.inputProof,
        encryptedAgility1.inputProof
      );

    const speed2 = 80;
    const stamina2 = 75;
    const agility2 = 85;

    const encryptedSpeed2 = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.bob.address)
      .add32(speed2)
      .encrypt();

    const encryptedStamina2 = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.bob.address)
      .add32(stamina2)
      .encrypt();

    const encryptedAgility2 = await fhevm
      .createEncryptedInput(fheRaceTrackContractAddress, signers.bob.address)
      .add32(agility2)
      .encrypt();

    await fheRaceTrackContract
      .connect(signers.bob)
      .mintHorse(
        encryptedSpeed2.handles[0],
        encryptedStamina2.handles[0],
        encryptedAgility2.handles[0],
        encryptedSpeed2.inputProof,
        encryptedStamina2.inputProof,
        encryptedAgility2.inputProof
      );

    // Create race
    const horseIds = [1, 2];
    const duration = 3600; // 1 hour

    const tx = await fheRaceTrackContract
      .connect(signers.deployer)
      .createRace(horseIds, duration);
    await tx.wait();

    const race = await fheRaceTrackContract.getRace(1);
    expect(race.raceId_).to.eq(1);
    expect(race.horseIds.length).to.eq(2);
    expect(race.finished).to.be.false;
  });
});

