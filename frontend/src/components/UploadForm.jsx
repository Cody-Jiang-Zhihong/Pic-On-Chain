import { useState } from "react";
import { computeImageHash } from "../utils/hash";
import { uploadToIpfs } from "../utils/ipfs";

const initialForm = {
  modelName: "",
  prompt: "",
  confidenceScore: 75
};

export default function UploadForm({ disabled, onRegister }) {
  const [file, setFile] = useState(null);
  const [formValues, setFormValues] = useState(initialForm);
  const [uploadState, setUploadState] = useState({
    hash: "",
    cid: "",
    message: "Select an image to calculate its hash."
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setUploadState((current) => ({
        ...current,
        message: "Choose an image file first."
      }));
      return;
    }

    try {
      setUploadState({
        hash: "",
        cid: "",
        message: "Computing SHA-256 hash..."
      });

      const imageHash = await computeImageHash(file);
      setUploadState({
        hash: imageHash,
        cid: "",
        message: "Uploading image to IPFS..."
      });

      const ipfsCid = await uploadToIpfs(file);
      setUploadState({
        hash: imageHash,
        cid: ipfsCid,
        message: "Submitting the blockchain transaction..."
      });

      await onRegister({
        imageHash,
        ipfsCid,
        modelName: formValues.modelName.trim(),
        prompt: formValues.prompt.trim(),
        confidenceScore: Number(formValues.confidenceScore)
      });

      setUploadState({
        hash: imageHash,
        cid: ipfsCid,
        message: "Image registered successfully."
      });
    } catch (error) {
      setUploadState((current) => ({
        ...current,
        message: error.message
      }));
    }
  }

  return (
    <form className="stacked-form upload-form" onSubmit={handleSubmit}>
      <div className="upload-grid">
        <label className="input-group field-span-2">
          <span>Image file</span>
          <input
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>

        <label className="input-group">
          <span>Model name</span>
          <input
            name="modelName"
            onChange={handleChange}
            placeholder="e.g. DALL-E 3"
            required
            type="text"
            value={formValues.modelName}
          />
        </label>

        <label className="input-group">
          <span>Confidence score (0-100)</span>
          <input
            max="100"
            min="0"
            name="confidenceScore"
            onChange={handleChange}
            required
            type="number"
            value={formValues.confidenceScore}
          />
        </label>

        <label className="input-group field-span-2">
          <span>Prompt</span>
          <textarea
            name="prompt"
            onChange={handleChange}
            placeholder="Describe the prompt used to generate the image"
            required
            rows="3"
            value={formValues.prompt}
          />
        </label>
      </div>

      <div className="upload-actions">
        <button className="primary-button" disabled={disabled} type="submit">
          Upload, Hash, and Register
        </button>
      </div>

      <div className="helper-card helper-card-compact">
        <div className="panel-header-row">
          <span className="section-code">PIPELINE</span>
          <span className="section-mini-label">Local Digest + Remote Pin</span>
        </div>
        <div className="data-grid pipeline-grid">
          <div className="data-item">
            <span className="data-key">Status</span>
            <span className="data-value">{uploadState.message}</span>
          </div>
          <div className="data-item">
            <span className="data-key">SHA-256</span>
            <span className="data-value hash-value">{uploadState.hash || "Pending"}</span>
          </div>
          <div className="data-item">
            <span className="data-key">IPFS CID</span>
            <span className="data-value hash-value">{uploadState.cid || "Pending"}</span>
          </div>
        </div>
      </div>
    </form>
  );
}
