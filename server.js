import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

const stripe = new Stripe('sk_test_51ScT0uCLk3AWCZ9LThK3Xc84vMxLxwClrod8rOFeHQsrnhfON7lfHjoU31BMapE5Us7tiGa1h0hwo31lB0Y9Dkxs00UviQwNSz');
const app = express();

app.use(express.json());
app.use(cors());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Commande CUBE' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/confirmation',
      cancel_url: 'http://localhost:5173/checkout',
    });

    res.json({ id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Serveur lancé sur le port 3000'));