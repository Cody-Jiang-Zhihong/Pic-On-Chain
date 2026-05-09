const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ImageProvenance", function () {
  let imageProvenance;
  let creator;
  let verifier;
  let imageHash;

  beforeEach(async function () {
    [creator, verifier] = await ethers.getSigners();
    imageHash = ethers.keccak256(ethers.toUtf8Bytes("sample-image"));

    const ImageProvenance = await ethers.getContractFactory("ImageProvenance");
    imageProvenance = await ImageProvenance.deploy();
    await imageProvenance.waitForDeployment();
  });

  it("registers an image successfully", async function () {
    await expect(
      imageProvenance
        .connect(creator)
        .registerImage(
          imageHash,
          "bafybeigdyrzt3qexamplecid",
          "Stable Diffusion XL",
          "A futuristic city skyline at sunset",
          85
        )
    ).to.emit(imageProvenance, "ImageRegistered");

    const record = await imageProvenance.getImageRecord(imageHash);

    expect(record.imageHash).to.equal(imageHash);
    expect(record.ipfsCid).to.equal("bafybeigdyrzt3qexamplecid");
    expect(record.modelName).to.equal("Stable Diffusion XL");
    expect(record.prompt).to.equal("A futuristic city skyline at sunset");
    expect(record.confidenceScore).to.equal(85);
    expect(record.creator).to.equal(creator.address);
    expect(record.timestamp).to.be.greaterThan(0n);
  });

  it("reverts duplicate registration", async function () {
    await imageProvenance.registerImage(
      imageHash,
      "bafybeigdyrzt3qexamplecid",
      "Midjourney v6",
      "An astronaut riding a horse on Mars",
      78
    );

    await expect(
      imageProvenance.registerImage(
        imageHash,
        "bafybeigdyrzt3qexamplecid",
        "Midjourney v6",
        "An astronaut riding a horse on Mars",
        78
      )
    )
      .to.be.revertedWithCustomError(
        imageProvenance,
        "ImageAlreadyRegistered"
      )
      .withArgs(imageHash);
  });

  it("adds verification records", async function () {
    await imageProvenance.registerImage(
      imageHash,
      "bafybeigdyrzt3qexamplecid",
      "DALL-E 3",
      "A watercolor fox reading a book",
      66
    );

    await expect(
      imageProvenance
        .connect(verifier)
        .addVerification(imageHash, 92, "Independent review confirmed metadata.")
    ).to.emit(imageProvenance, "VerificationAdded");

    const count = await imageProvenance.getVerificationCount(imageHash);
    const verification = await imageProvenance.getVerification(imageHash, 0);
    const updatedRecord = await imageProvenance.getImageRecord(imageHash);

    expect(count).to.equal(1n);
    expect(verification.verifier).to.equal(verifier.address);
    expect(verification.newScore).to.equal(92);
    expect(verification.remark).to.equal(
      "Independent review confirmed metadata."
    );
    expect(updatedRecord.confidenceScore).to.equal(92);
  });

  it("returns correct record and verification data", async function () {
    await imageProvenance.registerImage(
      imageHash,
      "bafybeigdyrzt3qexamplecid",
      "Flux.1",
      "A cyberpunk portrait with neon reflections",
      71
    );

    await imageProvenance
      .connect(verifier)
      .addVerification(imageHash, 88, "Cross-checked against prompt and CID.");

    const record = await imageProvenance.getImageRecord(imageHash);
    const count = await imageProvenance.getVerificationCount(imageHash);
    const verification = await imageProvenance.getVerification(imageHash, 0);

    expect(record.modelName).to.equal("Flux.1");
    expect(record.prompt).to.equal("A cyberpunk portrait with neon reflections");
    expect(record.confidenceScore).to.equal(88);
    expect(count).to.equal(1n);
    expect(verification.newScore).to.equal(88);
    expect(verification.remark).to.equal(
      "Cross-checked against prompt and CID."
    );
  });
});
