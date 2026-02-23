require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

const { INFURA_API_KEY, PRIVATE_KEY } = process.env;

const maybePrivKey = PRIVATE_KEY && PRIVATE_KEY.length > 0
  ? (PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`)
  : undefined;

module.exports = {
  solidity: {
    version: '0.8.20',
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: {},
    localhost: { url: 'http://127.0.0.1:8545' },
    sepolia: {
      url: INFURA_API_KEY ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}` : undefined,
      accounts: maybePrivKey ? [maybePrivKey] : []
    }
  }
};
