const Moralis = require("moralis").default;
const mongoose = require("mongoose");
const colors = require("colors");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Product = require("./schema/productModel");
const { EvmChain } = require("@moralisweb3/common-evm-utils");

// to use our .env variables
require("dotenv").config();

const app = express();
const port = 8080;

app.use(express.json());
app.use(cookieParser());

// allow access to React app domain
app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:3000"],
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

const productRoute = require("./routes/productRoute");
const authRoute = require("./routes/authRoute");
const { contractAddress, contractABI } = require("../contract");

app.use("/api/product", productRoute);
// app.use("/", authRoute);

// AUTH

const config = {
  domain: process.env.APP_DOMAIN,
  statement: "Please sign this message to confirm your identity.",
  uri: process.env.REACT_URL,
  timeout: 60,
};

// request message to be signed by client
app.post("/request-message", async (req, res) => {
  const { address, chain, network } = req.body;

  try {
    const message = await Moralis.Auth.requestMessage({
      address,
      chain,
      network,
      ...config,
    });

    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
});

app.post("/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;

    const { address, profileId } = (
      await Moralis.Auth.verify({
        message,
        signature,
        networkType: "evm",
      })
    ).raw;

    const user = { address, profileId, signature };

    // create JWT token
    const token = jwt.sign(user, process.env.AUTH_SECRET);

    // set JWT cookie
    res.cookie("jwt", token, {
      httpOnly: true,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
});

app.get("/authenticate", async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.sendStatus(403); // if the user did not send a jwt token, they are unauthorized

  try {
    const data = jwt.verify(token, process.env.AUTH_SECRET);
    res.json(data);
  } catch {
    return res.sendStatus(403);
  }
});

app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(403);
  }
});

// Get NFT trades by marketplace
app.get("/nft/trades", async (req, res) => {
  try {
    const { query } = req;

    if (typeof query.contractAddress === "string") {
      const response = await Moralis.EvmApi.nft.getNFTTrades({
        address: query.contractAddress,
        chain: query.chain ?? "0x1",
      });

      return res.status(200).json(response);
    } else {
      const nftData = [];

      for (let i = 0; i < query.contractAddress.length; i++) {
        const response = await Moralis.EvmApi.nft.getNFTTrades({
          address: query.contractAddress[i],
          chain: query.chain ?? "0x1",
        });

        nftData.push(response);
      }

      const response = { nftData };
      return res.status(200).json(response);
    }
  } catch (e) {
    console.log(`Somthing went wrong ${e}`);
    return res.status(400).json();
  }
});

// Search NFTs
app.get("/nft/search", async (req, res) => {
  try {
    const { query } = req;
    const filterField = query.field ?? "name";
    const searchTerm = query.searchTerm ?? "art";

    const response = await Moralis.EvmApi.nft.searchNFTs({
      chain: query.chain ?? "0x1",
      format: "decimal",
      q: searchTerm,
      filter: filterField,
      addresses: [],
    });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

// Get NFT owners by token ID
app.get("/nft/owners", async (req, res) => {
  try {
    const { query } = req;

    const response = await Moralis.EvmApi.nft.getNFTTokenIdOwners({
      chain: "0x1",
      format: "decimal",
      // mediaItems: false,
      address: query.address ?? "",
      tokenId: query.tokenId ?? "",
    });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

app.get("/getcontractnft", async (req, res) => {
  try {
    const { query } = req;
    const chain = query.chain == "0x5" ? "0x5" : "0x1";

    const response = await Moralis.EvmApi.nft.getContractNFTs({
      chain,
      format: "decimal",
      address: query.contractAddress,
    });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

// Get NFTs by wallet
app.get("/nft/wallet", async (req, res) => {
  try {
    const { query } = req;

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address: query.address,
      chain: query.chain ?? "0x1",
    });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

// Get native transactions by wallet
app.get("/nft/transactions", async (req, res) => {
  try {
    const { query } = req;

    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
      address: query.address,
      chain: query.chain,
    });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

// get eth token
app.get("/ethtoken", async (req, res) => {
  // const address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

  // const chain = EvmChain.ETHEREUM;
  const address = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const chain = "0x1";

  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      address,
      chain,
    });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

// createNFT
// app.post("/create-nft", async (req, res) => {
//   try {
//     const _name = "My NFT";
//     const _image =
//       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/1200px-MetaMask_Fox.svg.png";
//     const _price = 0.002;
//     const _description = "This is my NFT";
//     const options = {
//       contractAddress: contractAddress,
//       functionName: "createNFT",
//       abi: contractABI,
//       params: [_name, _image, _price, _description],
//     };

//     try {
//       const response = await Moralis.EvmApi.utils.runContractFunction({
//         address: contractAddress,
//         functionName: "name",
//         abi: [
//           {
//             inputs: [],
//             name: "name",
//             outputs: [
//               {
//                 internalType: "string",
//                 name: "",
//                 type: "string",
//               },
//             ],
//             stateMutability: "view",
//             type: "function",
//           },
//         ],
//       });
//       console.log(response.raw);
//       // return res.status(200).json(response);
//     } catch (error) {
//       console.error("Failed to create NFT:", error);
//     }

//     return res.status(200).json(response);
//   } catch (e) {
//     console.log(`Something went wrong ${e}`);
//     return res.status(400).json(e);
//   }
// });

app.get("/", (req, res) => {
  res.send("APP IS RUNNING");
});

const startServer = async () => {
  await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY,
  });

  const address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

  const chain = EvmChain.ETHEREUM;

  const response = await Moralis.EvmApi.nft.getWalletNFTs({
    address,
    chain,
  });

  // console.log(response.toJSON());

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();
