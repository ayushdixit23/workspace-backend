const Product = require("../models/product");
const uuid = require("uuid").v4;
const Minio = require("minio");
const User = require("../models/userAuth");
const Order = require("../models/orders");

const sharp = require("sharp");
const stripe = require("stripe")(
  "sk_test_51NAGrZSEXlKwVDBNhya5wiyCmbRILf14f1Bk2uro1IMurrItZFsnmn7WNA0I5Q3RMnCVui1ox5v9ynOg3CGrFkHu00hLvIqqS1"
);

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const fs = require("fs");
require("dotenv").config();
const axios = require("axios");

const BUCKET_NAME = process.env.BUCKET_NAME;
const PRODUCT_BUCKET = process.env.PRODUCT_BUCKET;

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

//function to generate a presignedurl of minio
async function generatePresignedUrl(bucketName, objectName, expiry = 604800) {
  try {
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      expiry
    );
    return presignedUrl;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate presigned URL");
  }
}

// add a product
exports.create = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    brandname,
    desc,
    quantity,
    shippingcost,
    price,
    discountedprice,
    sellername,
    totalstars,
    weight,
    type,
  } = req.body;

  const image1 = req.files[0];
  const image2 = req.files[1];
  const image3 = req.files[2];
  const image4 = req.files[3];

  const user = await User.findById(userId);
  if (!user) {
    res.status(400).json({ message: "User not found", success: false });
  } else {
    if (!image1 && !image2 && !image3 && !image4) {
      res.status(400).json({ message: "Must have one image" });
    } else {
      try {
        const uuidString = uuid();
        let a, b, c, d;
        if (image1) {
          const bucketName = "products";
          const objectName = `${Date.now()}_${uuidString}_${
            image1.originalname
          }`;
          a = objectName;
          await s3.send(
            new PutObjectCommand({
              Bucket: PRODUCT_BUCKET,
              Key: objectName,
              Body: image1.buffer,
              ContentType: image1.mimetype,
            })
          );
          // await minioClient.putObject(
          //   bucketName,
          //   objectName,
          //   image1.buffer,
          //   image1.buffer.length
          // );
        }
        if (image2) {
          const bucketName = "products";
          const objectName = `${Date.now()}_${uuidString}_${
            image2.originalname
          }`;
          b = objectName;
          await s3.send(
            new PutObjectCommand({
              Bucket: PRODUCT_BUCKET,
              Key: objectName,
              Body: image2.buffer,
              ContentType: image2.mimetype,
            })
          );
          // await minioClient.putObject(
          //   bucketName,
          //   objectName,
          //   image2.buffer,
          //   image2.buffer.length
          // );
        }
        if (image3) {
          const bucketName = "products";
          const objectName = `${Date.now()}_${uuidString}_${
            image3.originalname
          }`;
          c = objectName;
          await s3.send(
            new PutObjectCommand({
              Bucket: PRODUCT_BUCKET,
              Key: objectName,
              Body: image3.buffer,
              ContentType: image3.mimetype,
            })
          );
          // await minioClient.putObject(
          //   bucketName,
          //   objectName,
          //   image3.buffer,
          //   image3.buffer.length
          // );
        }
        if (image4) {
          const bucketName = "products";
          const objectName = `${Date.now()}_${uuidString}_${
            image4.originalname
          }`;
          d = objectName;
          await s3.send(
            new PutObjectCommand({
              Bucket: PRODUCT_BUCKET,
              Key: objectName,
              Body: image4.buffer,
              ContentType: image4.mimetype,
            })
          );
          // await minioClient.putObject(
          //   bucketName,
          //   objectName,
          //   image4.buffer,
          //   image4.buffer.length
          // );
        }
        const p = new Product({
          name,
          brandname,
          desc,
          creator: userId,
          quantity,
          shippingcost,
          price,
          discountedprice,
          sellername,
          totalstars,
          images: [a, b, c, d],
          weight,
          type,
        });
        await p.save();
        res.status(200).json(p);
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    }
  }
};

//add new product
exports.createnew = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    brandname,
    desc,
    quantity,
    shippingcost,
    price,
    discountedprice,
    sellername,
    totalstars,
    weight,
    type,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(400).json({ message: "User not found", success: false });
  } else {
    if (req.files.length < 1) {
      res.status(400).json({ message: "Must have one image" });
    } else {
      try {
        let pos = [];

        for (let i = 0; i < req?.files?.length; i++) {
          const uuidString = uuid();
          const bucketName = "products";
          const objectName = `${Date.now()}_${uuidString}_${
            req.files[i].originalname
          }`;
          if (req.files[i].fieldname === "video") {
            await minioClient.putObject(
              bucketName,
              objectName,
              req.files[i].buffer,
              req.files[i].size,
              req.files[i].mimetype
            );
            pos.push({ content: objectName, type: req.files[i].mimetype });
          } else {
            await sharp(req.files[i].buffer)
              .jpeg({ quality: 50 })
              .toBuffer()
              .then(async (data) => {
                await minioClient.putObject(bucketName, objectName, data);
              })
              .catch((err) => {
                console.log(err.message, "-error");
              });

            pos.push({ content: objectName, type: req.files[i].mimetype });
          }
        }

        const p = new Product({
          name,
          brandname,
          desc,
          creator: userId,
          quantity,
          shippingcost,
          price,
          discountedprice,
          sellername,
          totalstars,
          images: pos,
          weight,
          type,
        });
        await p.save();
        res.status(200).json(p);
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    }
  }
};

//get all products of a user
exports.fetchallproducts = async (req, res) => {
  const { userId } = req.params;
  const product = await Product.find({ creator: userId });
  try {
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      const urls = [];
      for (let i = 0; i < product.length; i++) {
        const a = await generatePresignedUrl(
          "images",
          product[i].images.toString(),
          60 * 60
        );
        urls.push(a);
      }
      res.status(200).json({ data: { product, urls } });
    }
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

//add product hightlights
exports.highlight = async (req, res) => {
  const { prodId, userId } = req.params;
  const { key, value } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ message: "User not found" });
    } else {
      const product = await Product.findOne({ creator: user._id });
      if (!product) {
        res.status(400).json({ message: "Product not found" });
      } else {
        await Product.findByIdAndUpdate(
          { _id: prodId },
          {
            $set: { producthighlightskey: key, producthighlightsvalue: value },
          },
          { new: true }
        );
        res.status(200).json({ success: true });
      }
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//get a single product
exports.getaproduct = async (req, res) => {
  const { id, productId } = req.params;
  const user = await User.findById(id);
  const product = await Product.findById(productId).populate({
    path: "reviews",
    select: "text stars desc name createdAt dp",
    options: { limit: 5 },
  });
  try {
    if (!product) {
      res.status(404).json({ message: "Product not found", success: false });
    } else {
      if (product.isvariant === false) {
        const urls = [];
        let review = [];
        let isreviewed = false;
        let incart = false;
        if (
          product.reviewed.includes(user?._id) &&
          user.puchase_products.includes(product?._id)
        ) {
          isreviewed = true;
        }
        if (user.cartproducts.includes(product?._id)) {
          incart = true;
        }
        for (let i = 0; i < product.images.length; i++) {
          if (product.images[i] !== null) {
            const a = process.env.PRODUCT_URL + product.images[i].content;

            urls.push(a);
          }
        }
        if (product?.reviews?.length > 0) {
          for (let i = 0; i < product.reviews.length; i++) {
            if (product.reviews[i] !== null) {
              const a = process.env.URL + product.reviews[i].dp;

              review.push({ review: product.reviews[i], dp: a });
            }
          }
        }

        res.status(200).json({
          data: {
            incart,
            canreview: isreviewed,
            totalreviews: product?.reviewed?.length,
            product,
            urls,
            isvariant: product.isvariant,
            review,
            success: true,
          },
        });
      } else {
        const urls = [];
        let review = [];
        let isreviewed = false;
        let incart = false;
        if (
          product.reviewed.includes(user?._id) &&
          user.puchase_products.includes(product?._id)
        ) {
          isreviewed = true;
        }
        if (user.cartproducts.includes(product?._id)) {
          incart = true;
        }
        for (let i = 0; i < product.images.length; i++) {
          if (product.images[i] !== null) {
            const a = process.env.PRODUCT_URL + product.images[i].content;

            urls.push(a);
          }
        }
        if (product?.reviews?.length > 0) {
          for (let i = 0; i < product.reviews.length; i++) {
            if (product.reviews[i] !== null) {
              const a = process.env.URL + product.reviews[i].dp;

              review.push({ review: product.reviews[i], dp: a });
            }
          }
        }

        // const size = [];
        // const color = [];

        // for (let i = 0; i < product.variants.length; i++) {

        // }
        const color = product.variants.map((d) => d.value);
        const size = product.variants[0]?.category.map((d) => d.name);

        const updateVariant = [];

        for (let i = 0; i < product.variants.length; i++) {
          const v = product.variants[i].category.map((d) => {
            return {
              ...d.toObject(),
              imageUrl: process.env.PRODUCT_URL + d.content,
            };
          });

          const obj = { ...product.variants[i].toObject(), category: v };
          updateVariant.push(obj);
       }
 
        res.status(200).json({
          data: {
            color,
            size,
            incart,
            canreview: isreviewed,
            totalreviews: product?.reviewed?.length,
            product,
            variants: updateVariant,
            isvariant: product.isvariant,
            urls,
            review,
            success: true,
          },
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

//add a review
exports.addareview = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { amount } = req.body;
    const user = await User.findById(id);
    const product = await Product.findById(productId);

    if (product && user) {
      await Product.updateOne(
        { _id: product?._id },
        {
          $push: { reviewed: user?._id },
          $inc: { reviews: 1 },
          $set: { totalstars: amount },
        },
        { new: true }
      );

      res.status(200).json({ success: true });
    } else {
      res
        .status(404)
        .json({ message: "Something went wrong...", success: false });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//delete a product
exports.deleteproduct = async (req, res) => {
  const { userId, productId } = req.params;
  const product = await Product.findById(productId);
  try {
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else if (product.creator.toString() != userId) {
      res.status(404).json({ message: "You can't delete others products" });
    } else {
      await Product.findByIdAndDelete(productId);
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//fetch frequently brought together
exports.fetchfrequents = async (req, res) => {
  const { prodId } = req.params;
  const product = await Product.findById(prodId);
  try {
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      const frequent = await Product.find({ tags: product.tags })
        .populate("creator", "fullname isverified")
        .limit(3);
      if (frequent.length !== 3) {
        res.status(400).json({ message: "Not found", success: false });
      } else {
        const p = [];
        for (let i = 0; i < frequent.length; i++) {
          const a = frequent[i];
          if (a._id.toString() !== prodId) {
            p.push(a);
          }
        }
        const urls = [];
        for (let i = 0; i < 2; i++) {
          if (frequent[i].images[0] !== null) {
            const a = await generatePresignedUrl(
              "products",
              frequent[i].images[0].toString(),
              60 * 60
            );
            urls.push(a);
          }
        }
        res.status(200).json({ data: { p, urls } });
      }
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//fetch similar products
exports.fetchsimilar = async (req, res) => {
  const { prodId } = req.params;
  const product = await Product.findById(prodId);
  try {
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      const similar = await Product.find({ tags: product.tags }).populate(
        "creator",
        "fullname isverified"
      );
      const urls = [];
      for (let i = 0; i < similar.length; i++) {
        if (similar[i].images[0] !== null) {
          const a = await generatePresignedUrl(
            "products",
            similar[i].images[0].toString(),
            60 * 60
          );
          urls.push(a);
        }
      }
      res.status(200).json({ data: { similar, urls } });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//buy a product
exports.buyproduct = async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity, price } = req.body;

  try {
    const user = await User.findById(userId);
    const product = await Product.findById(productId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else if (!product) {
      res.status(404).json({ message: "No Product found", success: false });
    } else {
      const oi = Math.floor(Math.random() * 10000000) + 1;
      const order = new Order({
        buyerId: userId,
        productId: productId,
        sellerId: product.creator,
        orderId: oi,
        quantity: quantity,
        total: price,
        deliverycharges: 0,
        taxes: 0,
        discountamount: 0,
        finalprice: price,
        paymentMode: "Card",
      });
      await order.save();

      await User.updateOne(
        { _id: user._id },
        { $push: { puchase_history: order._id }, $inc: { purchasestotal: 1 } }
      );
      res.status(200).json({ success: true, oi });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//initate produtc order
exports.newprodorder = async (req, res) => {
  try {
    const { price } = req.params;
    const pi = await stripe.paymentIntents.create({
      amount: price * 100,
      currency: "INR",
      automatic_payment_methods: {
        enabled: true,
      },
    });
    res.status(200).json({ success: true, sec: pi.client_secret });
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.updateproduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found", success: false });
    } else {
      await Product.updateOne({ _id: productId }, { $set: req.body });
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};
