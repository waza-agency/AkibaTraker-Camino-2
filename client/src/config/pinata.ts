export const PINATA_CONFIG = {
  apiKey: import.meta.env.VITE_PINATA_API_KEY,
  gateway: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs"
} as const;

// Utility function to get full URL from IPFS hash
export const getPinataUrl = (ipfsHash: string) => {
  return `${PINATA_CONFIG.gateway}/${ipfsHash}`;
}; 