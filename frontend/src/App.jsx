import { useEffect, useState } from "react";
import { ethers } from "ethers";
import UploadForm from "./components/UploadForm";
import RecordList from "./components/RecordList";

const contractAbi = [
  "function registerImage(bytes32 imageHash, string ipfsCid, string modelName, string prompt, uint8 confidenceScore)",
  "function addVerification(bytes32 imageHash, uint8 newScore, string remark)",
  "function getImageRecord(bytes32 imageHash) view returns ((bytes32 imageHash, string ipfsCid, string modelName, string prompt, uint8 confidenceScore, address creator, uint256 timestamp))",
  "function getVerificationCount(bytes32 imageHash) view returns (uint256)",
  "function getVerification(bytes32 imageHash, uint256 index) view returns ((address verifier, uint8 newScore, string remark, uint256 timestamp))"
];

const initialStatus = {
  type: "idle",
  message: "Connect MetaMask and provide a deployed contract address to begin."
};

function formatTimestamp(value) {
  return new Date(Number(value) * 1000).toLocaleString();
}

function normalizeImageRecord(record) {
  return {
    imageHash: record.imageHash,
    ipfsCid: record.ipfsCid,
    modelName: record.modelName,
    prompt: record.prompt,
    confidenceScore: Number(record.confidenceScore),
    creator: record.creator,
    timestamp: formatTimestamp(record.timestamp)
  };
}

function normalizeVerification(record, index) {
  return {
    id: `${index}-${record.verifier}-${record.timestamp.toString()}`,
    verifier: record.verifier,
    newScore: Number(record.newScore),
    remark: record.remark,
    timestamp: formatTimestamp(record.timestamp)
  };
}

export default function App() {
  const [account, setAccount] = useState("");
  const [chainName, setChainName] = useState("");
  const [contractAddress, setContractAddress] = useState(
    import.meta.env.VITE_CONTRACT_ADDRESS ?? ""
  );
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [searchHash, setSearchHash] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [record, setRecord] = useState(null);
  const [verifications, setVerifications] = useState([]);

  useEffect(() => {
    if (!window.ethereum) {
      setStatus({
        type: "error",
        message: "MetaMask is required for this application."
      });
      return;
    }

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] ?? "");
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus({
        type: "error",
        message: "MetaMask is not available in this browser."
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(await signer.getAddress());
      setChainName(network.name);
      setStatus({
        type: "success",
        message: "Wallet connected successfully."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.shortMessage ?? error.message
      });
    }
  }

  async function getContract(withSigner = false) {
    if (!window.ethereum) {
      throw new Error("MetaMask is required.");
    }
    if (!ethers.isAddress(contractAddress)) {
      throw new Error("Enter a valid deployed contract address.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const runner = withSigner ? await provider.getSigner() : provider;
    return new ethers.Contract(contractAddress, contractAbi, runner);
  }

  async function fetchRecord(hashToQuery) {
    const normalizedHash = hashToQuery.trim();
    if (!ethers.isHexString(normalizedHash, 32)) {
      throw new Error("Provide a valid bytes32 image hash.");
    }

    const contract = await getContract(false);
    const imageRecord = await contract.getImageRecord(normalizedHash);
    const count = await contract.getVerificationCount(normalizedHash);

    const history = await Promise.all(
      Array.from({ length: Number(count) }, async (_, index) => {
        const verification = await contract.getVerification(normalizedHash, index);
        return normalizeVerification(verification, index);
      })
    );

    setCurrentHash(normalizedHash);
    setRecord(normalizeImageRecord(imageRecord));
    setVerifications(history);
    setSearchHash(normalizedHash);
  }

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({
      type: "loading",
      message: "Fetching provenance record from the blockchain..."
    });

    try {
      await fetchRecord(searchHash);
      setStatus({
        type: "success",
        message: "Record loaded successfully."
      });
    } catch (error) {
      setRecord(null);
      setVerifications([]);
      setStatus({
        type: "error",
        message: error.shortMessage ?? error.reason ?? error.message
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister({ imageHash, ipfsCid, modelName, prompt, confidenceScore }) {
    setLoading(true);
    setStatus({
      type: "loading",
      message: "Registering the image on-chain..."
    });

    try {
      const contract = await getContract(true);
      const tx = await contract.registerImage(
        imageHash,
        ipfsCid,
        modelName,
        prompt,
        Number(confidenceScore)
      );
      await tx.wait();
      await fetchRecord(imageHash);
      setStatus({
        type: "success",
        message: "Image registered successfully."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.shortMessage ?? error.reason ?? error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVerification({ newScore, remark }) {
    if (!currentHash) {
      setStatus({
        type: "error",
        message: "Load an image record before adding a verification."
      });
      return;
    }

    setLoading(true);
    setStatus({
      type: "loading",
      message: "Submitting verification record..."
    });

    try {
      const contract = await getContract(true);
      const tx = await contract.addVerification(
        currentHash,
        Number(newScore),
        remark
      );
      await tx.wait();
      await fetchRecord(currentHash);
      setStatus({
        type: "success",
        message: "Verification record added successfully."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.shortMessage ?? error.reason ?? error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">AI Image Provenance</p>
          <h1>Blockchain-backed credibility tracing for generated images.</h1>
          <p className="hero-copy">
            Hash image files, pin them to IPFS, register their metadata on-chain,
            and maintain an auditable verification history.
          </p>
        </div>
        <div className="wallet-card">
          <button className="primary-button" onClick={connectWallet} type="button">
            {account ? "Wallet Connected" : "Connect MetaMask"}
          </button>
          <p><strong>Account:</strong> {account || "Not connected"}</p>
          <p><strong>Network:</strong> {chainName || "Unknown"}</p>
          <label className="input-group">
            <span>Contract address</span>
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={(event) => setContractAddress(event.target.value)}
            />
          </label>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Register Image</h2>
            <p>Upload a generated image, create its SHA-256 digest, pin it to IPFS, and write the record to the smart contract.</p>
          </div>
          <UploadForm disabled={loading} onRegister={handleRegister} />
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Lookup Record</h2>
            <p>Query any registered image hash to inspect its provenance details and verification history.</p>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="0x... image hash"
              value={searchHash}
              onChange={(event) => setSearchHash(event.target.value)}
            />
            <button className="secondary-button" type="submit" disabled={loading}>
              Search
            </button>
          </form>

          <RecordList
            record={record}
            verifications={verifications}
            loading={loading}
            onAddVerification={handleAddVerification}
          />
        </section>
      </main>

      <footer className={`status-banner status-${status.type}`}>
        {status.message}
      </footer>
    </div>
  );
}
