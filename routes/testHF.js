const express = require("express");
const router = express.Router();
const { InferenceClient } = require("@huggingface/inference");

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "black-forest-labs/FLUX.1-dev";

// Lazy / cached HF client to avoid blocking cold starts
let _hfClient = null;
function getHFClient() {
  if (!HF_TOKEN) return null;
  if (!_hfClient) {
    try {
      _hfClient = new InferenceClient(HF_TOKEN);
    } catch (err) {
      console.error('Failed to create HF client:', err && err.message ? err.message : err);
      _hfClient = null;
    }
  }
  return _hfClient;
}

// POST /api/test-hf
router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt required" });

  try {
    console.log("Calling HF with:", HF_MODEL, "Prompt:", prompt);

    const hf = getHFClient();
    if (!hf) return res.status(503).json({ message: 'Hugging Face token not configured' });

    // Call Hugging Face
    const imageBlob = await hf.textToImage({
      model: HF_MODEL,
      inputs: prompt,
      parameters: { num_inference_steps: 20 },
    });

    // Convert Blob → Buffer → base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    res.json({ image: dataUrl });
  } catch (err) {
    console.error("HF Test Error:", err.message || err);
    res.status(500).json({ message: err.message || "HF test failed" });
  }
});

module.exports = router;
