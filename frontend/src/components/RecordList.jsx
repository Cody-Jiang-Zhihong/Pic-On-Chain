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
        <div className="panel-header-row">
          <span className="section-code">IMAGE</span>
          <span className="section-mini-label">Primary Provenance Record</span>
        </div>
        <h3>Image Record</h3>
        <div className="data-grid">
          <div className="data-item">
            <span className="data-key">Image hash</span>
            <span className="data-value hash-value">{record.imageHash}</span>
          </div>
          <div className="data-item">
            <span className="data-key">IPFS CID</span>
            <span className="data-value hash-value">{record.ipfsCid}</span>
          </div>
          <div className="data-item">
            <span className="data-key">IPFS link</span>
            <span className="data-value">
              <a href={getIpfsUrl(record.ipfsCid)} rel="noreferrer" target="_blank">
                Open asset
              </a>
            </span>
          </div>
          <div className="data-item">
            <span className="data-key">Model</span>
            <span className="data-value">{record.modelName}</span>
          </div>
          <div className="data-item">
            <span className="data-key">Prompt</span>
            <span className="data-value">{record.prompt}</span>
          </div>
          <div className="data-item">
            <span className="data-key">Latest confidence score</span>
            <span className="data-value accent-value">{record.confidenceScore}</span>
          </div>
          <div className="data-item">
            <span className="data-key">Creator</span>
            <span className="data-value hash-value">{record.creator}</span>
          </div>
          <div className="data-item">
            <span className="data-key">Registered at</span>
            <span className="data-value">{record.timestamp}</span>
          </div>
        </div>
      </article>

      <article className="record-card">
        <div className="panel-header-row">
          <span className="section-code">VERIFY</span>
          <span className="section-mini-label">Appended Trust Timeline</span>
        </div>
        <h3>Verification History</h3>
        {verifications.length === 0 ? (
          <p>No verification entries yet.</p>
        ) : (
          <div className="history-list">
            {verifications.map((item, index) => (
              <div className="history-item" key={item.id}>
                <div className="history-index">Entry #{index + 1}</div>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-key">Verifier</span>
                    <span className="data-value hash-value">{item.verifier}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-key">Score</span>
                    <span className="data-value accent-value">{item.newScore}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-key">Remark</span>
                    <span className="data-value">{item.remark || "No remark provided"}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-key">Timestamp</span>
                    <span className="data-value">{item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="record-card">
        <div className="panel-header-row">
          <span className="section-code">PATCH</span>
          <span className="section-mini-label">Write Verification Delta</span>
        </div>
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
