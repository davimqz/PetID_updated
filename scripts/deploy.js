async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  // Deploy PetNFT
  const PetNFT = await ethers.getContractFactory('PetNFT');
  const petNFT = await PetNFT.deploy('PetID NFT', 'PETID', deployer.address, ethers.ZeroAddress);
  await petNFT.waitForDeployment();
  console.log('PetNFT deployed to:', await petNFT.getAddress());

  // Deploy PetID (link to PetNFT)
  const PetID = await ethers.getContractFactory('PetID');
  const petID = await PetID.deploy(deployer.address, await petNFT.getAddress());
  await petID.waitForDeployment();
  console.log('PetID deployed to:', await petID.getAddress());

  // set PetNFT contract in PetID (already set from constructor, but ensure)
  await petID.setPetNFTContract(await petNFT.getAddress());
  console.log('PetNFT linked in PetID');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
