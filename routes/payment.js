const express = require("express");
const Stripe = require("stripe");
const User = require("../models/userModel");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { plan, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "User email is required" });
    }

    // Match pricing
    const planPrices = {
      free: 0,
      premium: 999,
      enterprise: 2999,
    };

    const price = planPrices[plan];
    if (price === undefined) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // If free plan — directly give credits without Stripe
    if (plan === "free") {
      const user = await User.findOneAndUpdate(
        { email },
        { $inc: { credits: 10 } },
        { new: true }
      );
      return res.json({ success: true, credits: user.credits });
    }

    // Otherwise, create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${plan} Plan` },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.VITE_API_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_API_URL}/dashboard`,
      customer_email: email, // 👈 important!
      metadata: { plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: "Failed to start payment session" });
  }
});

router.get("/verify-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.query.session_id
    );

    if (session.payment_status === "paid") {
      const plan = session.metadata?.plan; // 'premium' or 'enterprise'
      let credits = 0;

      if (plan === "premium") credits = 50;
      if (plan === "enterprise") credits = 100;

      // Find and update user in DB (use your user ID logic)
      const userEmail = session.customer_email;
      const user = await User.findOneAndUpdate(
        { email: userEmail },
        { $inc: { credits } },
        { new: true }
      );

      return res.json({ success: true, credits: user.credits });
    }

    res.json({ success: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
