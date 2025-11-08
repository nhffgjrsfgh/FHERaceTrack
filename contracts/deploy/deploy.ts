import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHERaceTrack = await deploy("FHERaceTrack", {
    from: deployer,
    log: true,
  });

  console.log(`FHERaceTrack contract: `, deployedFHERaceTrack.address);
};
export default func;
func.id = "deploy_fheRaceTrack"; // id required to prevent reexecution
func.tags = ["FHERaceTrack"];

