const pinataEndpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export async function uploadToIpfs(file) {
  const jwt = import.meta.env.VITE_PINATA_JWT;

  if (!jwt) {
    throw new Error("Missing VITE_PINATA_JWT in the frontend environment.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(pinataEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IPFS upload failed: ${errorText}`);
  }

  const payload = await response.json();
  return payload.IpfsHash;
}

export function getIpfsUrl(cid) {
  const gateway =
    import.meta.env.VITE_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  return `${gateway}/${cid}`;
}
