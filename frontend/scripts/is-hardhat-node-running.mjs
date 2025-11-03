import { execSync } from "child_process";

try {
  execSync("curl -X POST -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"web3_clientVersion\",\"params\":[],\"id\":1}' http://localhost:8545", {
    stdio: "ignore"
  });
  console.log("Hardhat node is running");
  process.exit(0);
} catch (e) {
  console.error("Hardhat node is not running. Please start it with: npx hardhat node");
  process.exit(1);
}

