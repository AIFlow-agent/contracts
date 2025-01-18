import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    bnbTestnet: {
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY!],
      url: "https://bsc-testnet.bnbchain.org",
    },
  },
};

export default config;
