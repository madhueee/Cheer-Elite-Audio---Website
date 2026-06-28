const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const CLOUD_NAME = 'dz7oewy7z';
  const API_KEY    = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!API_KEY || !API_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Cloudinary env variables" })
    };
  }

  const { uploadType } = JSON.parse(event.body || "{}");
  const folder = uploadType === "track" ? "track_deliveries" : "payment_proofs";
  const timestamp = Math.round(Date.now() / 1000);

  const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureString)
    .digest("hex");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      signature,
      timestamp,
      api_key:    API_KEY,
      cloud_name: CLOUD_NAME,
      folder,
    }),
  };
};