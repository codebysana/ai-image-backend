const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const axios = require("axios");
const Image = require("../models/imageModel");
const User = require("../models/userModel");
const { InferenceClient } = require("@huggingface/inference");

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "black-forest-labs/FLUX.1-dev";
const COST_PER_IMAGE = 1;

const hf = new InferenceClient(HF_TOKEN);

router.post("/", auth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt required" });

  try {
    const user = await User.findById(req.user._id);
    if (user.credits < COST_PER_IMAGE) {
      return res.status(402).json({ message: "Not enough credits" });
    }

    // Deduct credits
    user.credits -= COST_PER_IMAGE;
    await user.save();

    // Call Hugging Face
    const imageBlob = await hf.textToImage({
      model: HF_MODEL,
      inputs: prompt,
      parameters: { num_inference_steps: 25 },
    });

    // Convert Blob → Buffer → base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    // Save in DB
    const img = new Image({
      user: req.user._id,
      prompt,
      dataUrl,
      hfModel: HF_MODEL,
    });
    await img.save();

    const updatedUser = await User.findById(req.user._id).select("-password");

    res.json({
      image: { id: img._id, dataUrl: img.dataUrl, prompt: img.prompt },
      credits: updatedUser.credits,
    });
  } catch (err) {
    console.error("Generate error:", err.message || err);

    // Refund credits if failed
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { credits: COST_PER_IMAGE },
      });
    } catch (refundErr) {
      console.error("Refund failed:", refundErr);
    }

    res.status(500).json({
      message: "Failed to generate image — please try again later.",
    });
  }
});

module.exports = router;
