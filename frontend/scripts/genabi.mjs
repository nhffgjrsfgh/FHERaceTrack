import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "FHERaceTrack";

// <root>/contracts
const rel = "../contracts";

// <root>/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir) || !fs.existsSync(contractFile)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    } else {
      // For optional deployments, just skip silently
      console.log(`Skipping ${chainName} (${chainId}): deployment not found`);
      return undefined;
    }
  }

  try {
    const jsonString = fs.readFileSync(contractFile, "utf-8");
    const obj = JSON.parse(jsonString);
    obj.chainId = chainId;
    console.log(`Found deployment on ${chainName} (${chainId}): ${obj.address}`);
    return obj;
  } catch (e) {
    if (!optional) {
      console.error(`${line}Error reading deployment file: ${e}${line}`);
      process.exit(1);
    } else {
      console.log(`Skipping ${chainName} (${chainId}): error reading deployment file`);
      return undefined;
    }
  }
}

// Try to read deployments - automatically skip if not found
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false /* required */);
const deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);

// Get ABI from any available deployment
let contractABI = null;
if (deployLocalhost) {
  contractABI = deployLocalhost.abi;
} else if (deploySepolia) {
  contractABI = deploySepolia.abi;
} else {
  console.error(`${line}No deployment found. Please deploy the contract first.${line}`);
  process.exit(1);
}

// Validate ABI consistency if both deployments exist
if (deployLocalhost && deploySepolia) {
  if (
    JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
  ) {
    console.warn(
      `${line}Warning: Deployments on localhost and Sepolia have different ABIs. Using localhost ABI.${line}`
    );
  }
}


const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: contractABI }, null, 2)} as const;
\n`;

// Build addresses object dynamically based on available deployments
const addressesEntries = [];
if (deploySepolia) {
  addressesEntries.push(`  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" }`);
}
if (deployLocalhost) {
  addressesEntries.push(`  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" }`);
}

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
${addressesEntries.join(",\n")}
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

