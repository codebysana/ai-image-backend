const express = require("express");
const router = express.Router();
const { InferenceClient } = require("@huggingface/inference");

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "black-forest-labs/FLUX.1-dev";
const hf = new InferenceClient(HF_TOKEN);

// POST /api/test-hf
router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt required" });

  try {
    console.log("Calling HF with:", HF_MODEL, "Prompt:", prompt);

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
