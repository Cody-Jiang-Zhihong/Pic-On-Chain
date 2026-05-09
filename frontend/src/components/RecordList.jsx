import { useState } from "react";
import { getIpfsUrl } from "../utils/ipfs";

export default function RecordList({
  record,
  verifications,
  loading,
  onAddVerification
}) {
  const [newScore, setNewScore] = useState(80);
  const [remark, setRemark] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await onAddVerification({
      newScore: Number(newScore),
      remark: remark.trim()
    });
    setRemark("");
  }

  if (!record) {
    return (
      <div className="empty-state">
        No image record loaded yet. Search by hash or register a new image.
      </div>
    );
  }

  return (
    <div className="record-stack">
      <article className="record-card">
        <h3>Image Record</h3>
        <p><strong>Image hash:</strong> {record.imageHash}</p>
        <p><strong>IPFS CID:</strong> {record.ipfsCid}</p>
        <p>
          <strong>IPFS link:</strong>{" "}
          <a href={getIpfsUrl(record.ipfsCid)} rel="noreferrer" target="_blank">
            Open asset
          </a>
        </p>
        <p><strong>Model:</strong> {record.modelName}</p>
        <p><strong>Prompt:</strong> {record.prompt}</p>
        <p><strong>Latest confidence score:</strong> {record.confidenceScore}</p>
        <p><strong>Creator:</strong> {record.creator}</p>
        <p><strong>Registered at:</strong> {record.timestamp}</p>
      </article>

      <article className="record-card">
        <h3>Verification History</h3>
        {verifications.length === 0 ? (
          <p>No verification entries yet.</p>
        ) : (
          <div className="history-list">
            {verifications.map((item, index) => (
              <div className="history-item" key={item.id}>
                <p><strong>Entry:</strong> #{index + 1}</p>
                <p><strong>Verifier:</strong> {item.verifier}</p>
                <p><strong>Score:</strong> {item.newScore}</p>
                <p><strong>Remark:</strong> {item.remark || "No remark provided"}</p>
                <p><strong>Timestamp:</strong> {item.timestamp}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="record-card">
        <h3>Add Verification</h3>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label className="input-group">
            <span>New score (0-100)</span>
            <input
              max="100"
              min="0"
              onChange={(event) => setNewScore(event.target.value)}
              required
              type="number"
              value={newScore}
            />
          </label>

          <label className="input-group">
            <span>Remark</span>
            <textarea
              onChange={(event) => setRemark(event.target.value)}
              placeholder="Describe the verification outcome"
              rows="3"
              value={remark}
            />
          </label>

          <button className="secondary-button" disabled={loading} type="submit">
            Submit Verification
          </button>
        </form>
      </article>
    </div>
  );
}
