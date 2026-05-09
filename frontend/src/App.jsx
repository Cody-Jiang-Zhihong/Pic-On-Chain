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
        <div className="hero-copy-block">
          <div className="hero-kicker-row">
            <p className="eyebrow">AI Image Provenance</p>
            <span className="tech-pill">protocol.online</span>
          </div>
          <h1>Blockchain-backed credibility tracing for generated images.</h1>
          <p className="hero-copy">
            Hash image files, pin them to IPFS, register their metadata on-chain,
            and maintain an auditable verification history.
          </p>
          <div className="hero-metrics">
            <div className="metric-chip">
              <span className="metric-label">Digest</span>
              <span className="metric-value">SHA-256</span>
            </div>
            <div className="metric-chip">
              <span className="metric-label">Storage</span>
              <span className="metric-value">IPFS</span>
            </div>
            <div className="metric-chip">
              <span className="metric-label">Registry</span>
              <span className="metric-value">EVM Contract</span>
            </div>
          </div>
        </div>
        <div className="wallet-card">
          <div className="panel-header-row">
            <span className="section-code">AUTH</span>
            <span className="section-mini-label">Wallet Session</span>
          </div>
          <button className="primary-button" onClick={connectWallet} type="button">
            {account ? "Wallet Connected" : "Connect MetaMask"}
          </button>
          <div className="data-grid compact-grid">
            <div className="data-item">
              <span className="data-key">Account</span>
              <span className="data-value">{account || "Not connected"}</span>
            </div>
            <div className="data-item">
              <span className="data-key">Network</span>
              <span className="data-value">{chainName || "Unknown"}</span>
            </div>
          </div>
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
        <section className="panel register-panel">
          <div className="section-heading">
            <div className="panel-header-row">
              <span className="section-code">WRITE</span>
              <span className="section-mini-label">On-chain Registration</span>
            </div>
            <h2>Register Image</h2>
            <p>Upload a generated image, create its SHA-256 digest, pin it to IPFS, and write the record to the smart contract.</p>
          </div>
          <div className="panel-body">
            <UploadForm disabled={loading} onRegister={handleRegister} />
          </div>
        </section>

        <section className="panel lookup-panel">
          <div className="section-heading">
            <div className="panel-header-row">
              <span className="section-code">READ</span>
              <span className="section-mini-label">Trace Explorer</span>
            </div>
            <h2>Lookup Record</h2>
            <p>Query any registered image hash to inspect its provenance details and verification history.</p>
          </div>
          <div className="panel-body">
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
          </div>
        </section>
      </main>

      <footer className={`status-banner status-${status.type}`}>
        <span className="status-prefix">system</span>
        <span>{status.message}</span>
      </footer>
    </div>
  );
}
