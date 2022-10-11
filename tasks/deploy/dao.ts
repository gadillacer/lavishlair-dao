import { task } from "hardhat/config";
import fs from "fs/promises";

import inquirer from "inquirer";
import { getExpectedContractAddress } from "../utils";

import {
  MyNftToken,
  MyNftToken__factory,
  MyGovernor,
  MyGovernor__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain";

const BEAN_ADDRESS = process.env.BEAN_TOKEN_ADDRESS || "0x8bB20CD5EFA164dE748785C23E93B58Ad8814369"

task("deploy:Dao").setAction(async function (_, { ethers, run }) {
  const timelockDelay = 2;

  const tokenFactory: MyNftToken__factory = await ethers.getContractFactory("MyNftToken");

  const signerAddress = await tokenFactory.signer.getAddress();
  const testerAddress = "0xfED930B2DBbc52996b2E107F1396d82256F41c41";
  const signer = await ethers.getSigner(signerAddress);

  const governorExpectedAddress = await getExpectedContractAddress(signer);

  const token: MyNftToken = <MyNftToken>await tokenFactory.deploy();
  await token.deployed();

  const timelockFactory: Timelock__factory = await ethers.getContractFactory("Timelock");
  const timelock: Timelock = <Timelock>await timelockFactory.deploy(governorExpectedAddress, timelockDelay);
  await timelock.deployed();

  const governorFactory: MyGovernor__factory = await ethers.getContractFactory("MyGovernor");
  const governor: MyGovernor = <MyGovernor>await governorFactory.deploy(BEAN_ADDRESS, timelock.address);
  await governor.deployed();


  const contractAddresses = {
    governor: governor.address,
    timelock: timelock.address,
    token: BEAN_ADDRESS
  }

  console.log("Dao deployed to: ", contractAddresses);

  // We'll mint enough NFTs to be able to pass a proposal!
  // await token.safeMint(signerAddress);
  // await token.safeMint(signerAddress);
  // await token.safeMint(signerAddress);
  // await token.safeMint(signerAddress);
  // await token.safeMint(testerAddress);
  // await token.safeMint(testerAddress);

  console.log("Should mint some BEAN tokens to pass a proposal. Bean address: " + BEAN_ADDRESS);

  // Transfer ownership to the timelock to allow it to perform actions on the NFT contract as part of proposal execution
  // await token.transferOwnership(timelock.address);
  console.log("Then u'll need to transferownership to Timelock. Timelock address: " + timelock.address);

  console.log("Granted the timelock ownership of the NFT Token");

  saveDeploymentInfo(contractAddresses, "src/Governor.json");

  await run("verify:verify", {
    address: governor.address,
    constructorArguments: [token.address, timelock.address],
  });
  await run("verify:verify", {
    address: timelock.address,
    constructorArguments: [governor.address, timelockDelay],
  });
});

async function saveDeploymentInfo(info: any, filename?: any) {
  if (!filename) {
      filename =  'contracts-deployment.json';
  }
  const exists = await fileExists(filename)
  if (exists) {
      const overwrite = await confirmOverwrite(filename)
      if (!overwrite) {
          return false
      }
  }

  console.log(`Writing deployment info to ${filename}`)
  const content = JSON.stringify(info, null, 2)
  await fs.writeFile(filename, content, {encoding: 'utf-8'})
  return true
}

async function fileExists(path: any) {
  try {
      await fs.access(path)
      return true
  } catch (e) {
      return false
  }
}

async function confirmOverwrite(filename: any) {
  const answers = await inquirer.prompt([
      {
          type: 'confirm',
          name: 'overwrite',
          message: `File ${filename} exists. Overwrite it?`,
          default: false,
      }
  ])
  return answers.overwrite
}
