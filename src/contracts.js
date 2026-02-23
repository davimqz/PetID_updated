// Contract integration helper for PetID dApp
// Import this file in your frontend to interact with deployed contracts

import PetNFTArtifact from '../artifacts/contracts/PetNFT.sol/PetNFT.json';
import PetIDArtifact from '../artifacts/contracts/PetID.sol/PetID.json';
import contractsConfig from '../public/contracts-config.json';

/**
 * Get contract instance
 * @param {string} contractName - 'PetNFT' or 'PetID'
 * @param {object} signer - ethers.js signer
 * @returns {ethers.Contract}
 */
export function getContract(contractName, signer) {
  const artifacts = {
    PetNFT: PetNFTArtifact,
    PetID: PetIDArtifact
  };

  const artifact = artifacts[contractName];
  const address = contractsConfig.contracts[contractName].address;

  if (!artifact || !address) {
    throw new Error(`Contract ${contractName} not found`);
  }

  // Using ethers v6 syntax
  const { ethers } = window;
  return new ethers.Contract(address, artifact.abi, signer);
}

/**
 * Connect to MetaMask and get signer
 * @returns {Promise<object>} { provider, signer, address }
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const { ethers } = window;
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

/**
 * Check if connected to correct network
 * @param {object} provider - ethers provider
 * @returns {Promise<boolean>}
 */
export async function checkNetwork(provider) {
  const network = await provider.getNetwork();
  return Number(network.chainId) === contractsConfig.network.chainId;
}

// Export contract addresses and config
export const CONTRACTS = contractsConfig.contracts;
export const NETWORK = contractsConfig.network;
