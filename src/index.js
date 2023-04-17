const Moralis = require('moralis').default;
const mongoose = require("mongoose");
const colors = require("colors");
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const Product = require("./schema/product/productModel");

// to use our .env variables
require('dotenv').config();

const app = express();
const port = 8080;

app.use(express.json());
app.use(cookieParser());

// allow access to React app domain
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// Connect database mongodb

const connectDB = async () => {
  try {
      const conn = await mongoose.connect(process.env.DATABASE_URL);
      console.log(
          colors.cyan.underline(`MongoDB Connected: ${conn.connection.host}`)
      );
  } catch (error) {
      console.log(colors.red.underline.bold(`Error: ${error.message}`));
      process.exit(1);
  }
};

connectDB();

// AUTH

const config = {
  domain: process.env.APP_DOMAIN,
  statement: 'Please sign this message to confirm your identity.',
  uri: process.env.REACT_URL,
  timeout: 60,
};

// request message to be signed by client
app.post('/request-message', async (req, res) => {
  const { address, chain, network } = req.body;

  try {
    const message = await Moralis.Auth.requestMessage({
      address,
      chain,
      network,
      ...config
    });

    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
});

app.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body;

    const { address, profileId } = (
      await Moralis.Auth.verify({
        message,
        signature,
        networkType: 'evm',
      })
    ).raw;

    const user = { address, profileId, signature };

    // create JWT token
    const token = jwt.sign(user, process.env.AUTH_SECRET);

    // set JWT cookie
    res.cookie('jwt', token, {
      httpOnly: true,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
});

app.get('/authenticate', async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.sendStatus(403); // if the user did not send a jwt token, they are unauthorized

  try {
    const data = jwt.verify(token, process.env.AUTH_SECRET);
    res.json(data);
  } catch {
    return res.sendStatus(403);
  }
});

app.get('/logout', async (req, res) => {
  try {
    res.clearCookie('jwt');
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(403);
  }
});

// PRODUCT

app.post('/api/product', async (req, res) => {
  const newProduct = new Product(req.body);
  try {
    const sendProduct = await newProduct.save();
    res.status(200).json(sendProduct);
  } catch (error) {
    res.status(500).json(error);
  }
})

app.get('/api/product', async (req, res) => {
  try {
    const getProducts = await Product.find();
    res.status(200).json(getProducts);
  } catch (error) {
    res.status(500).json(error);
  }
})

app.get("/", (req, res) => {
  res.send("APP IS RUNNING");
});

const startServer = async () => {
  await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY,
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();