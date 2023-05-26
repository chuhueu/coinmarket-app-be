const Moralis = require('moralis').default;
const jwt = require('jsonwebtoken');
// to use our .env variables
require('dotenv').config();

const config = {
  domain: process.env.APP_DOMAIN,
  statement: 'Please sign this message to confirm your identity.',
  uri: process.env.REACT_URL,
  timeout: 60,
};

// request message to be signed by client
const requestMessage = async (req, res) => {
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
}

const verify = async (req, res) => {
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
}

const authenticate = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.sendStatus(403); // if the user did not send a jwt token, they are unauthorized

  try {
    const data = jwt.verify(token, process.env.AUTH_SECRET);
    res.json(data);
  } catch {
    return res.sendStatus(403);
  }
}

const logout = async (req, res) => {
  try {
    res.clearCookie('jwt');
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(403);
  }
};

module.exports = {requestMessage, verify, authenticate, logout}