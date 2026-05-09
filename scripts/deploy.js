async function main() {
  const ImageProvenance = await ethers.getContractFactory("ImageProvenance");
  const imageProvenance = await ImageProvenance.deploy();
  await imageProvenance.waitForDeployment();

  const address = await imageProvenance.getAddress();

  console.log("ImageProvenance deployed to:", address);
  console.log("Set VITE_CONTRACT_ADDRESS in frontend/.env.local to this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
