const Glimpse = require("../models/glimpse");
const User = require("../models/userAuth");
const uuid = require("uuid").v4;
const Minio = require("minio");
const Conversation = require("../models/conversation");

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});

//add glimpse
exports.create = async (req, res) => {
  const uuidString = uuid();
  if (!req.file) {
    res.status(400).json({ message: "Please upload a video" });
  } else {
    try {
      const { userId } = req.params;
      const { text, tags } = req.body;
      const { originalname, buffer, mimetype } = req.file;
      const size = buffer.byteLength;
      const bucketName = "glimpse";
      const objectName = `${Date.now()}_${uuidString}_${originalname}`;
      await minioClient.putObject(
        bucketName,
        objectName,
        buffer,
        size,
        mimetype
      );
      const glimpse = new Glimpse({
        creator: userId,
        text: text,
        tags: tags,
        content: objectName,
        size: size,
      });

      await glimpse.save();
      res.status(200).json(glimpse);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
};

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

//fetch glimpse acc to interest
exports.fetchglimpse = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  const time = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const glimpse = await Glimpse.find({
    tags: { $in: user.interest },
  }).populate("creator", "fullname profilepic isverified");

  if (!glimpse || glimpse.length === 0) {
    res.status(404).json({ message: "Glimpse not found" });
  } else if (!glimpse[0].tags) {
    res
      .status(404)
      .json({ message: "Users interest doesn't match with any glimpse" });
  } else {
    try {
      const url = [];
      for (let i = 0; i < glimpse.length; i++) {
        const urls = await generatePresignedUrl(
          "glimpse",
          glimpse[i].content.toString(),
          60 * 60
        );
        url.push(urls);
      }
      const dp = [];
      for (let i = 0; i < glimpse.length; i++) {
        const dps = await generatePresignedUrl(
          "images",
          glimpse[i].creator.profilepic.toString(),
          60 * 60
        );
        dp.push(dps);
      }
      res.status(200).json({ data: { glimpse, url, dp }, success: true });
    } catch (e) {
      res.status(400).json({ message: e.message, success: false });
    }
  }
};

//fetch one glimpse
exports.fetchoneglimpse = async (req, res) => {
  const { glimpseId } = req.params;
  const glimpse = await Glimpse.findById(glimpseId);
  if (!glimpse) {
    res.status(404).json({ message: "Glimpse not found" });
  } else {
    try {
      const url = await generatePresignedUrl(
        "glimpse",
        glimpse.content.toString(),
        60 * 60
      );
      res.status(200).json({ data: { glimpse, url } });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
};

//like a glimpse
exports.likeglimpse = async (req, res) => {
  const { userId, glimpseId } = req.params;
  const user = await User.findById(userId);
  const glimpse = await Glimpse.findById(glimpseId);
  if (!glimpse) {
    res.status(400).json({ message: "No glimpse found" });
  } else if (glimpse.likedby.includes(userId)) {
    await Glimpse.findByIdAndUpdate(glimpseId, {
      $inc: { like: -1 },
      $pull: { likedby: user._id },
    });
    res.status(200).json({ success: true });
  } else if (!glimpse.likedby.includes(userId)) {
    res.status(400).json({ success: false });
  } else {
    await Glimpse.findByIdAndUpdate(glimpseId, {
      $inc: { like: 1 },
      $push: { likedby: user._id },
    });
    res.status(200).json({ success: true });
  }
};

//dislike glimpse / not interested
exports.dislikeglimpse = async (req, res) => {
  const { userId, glimpseId } = req.params;
  const glimpse = await Glimpse.findByIdAndUpdate(glimpseId, {
    $inc: { dislike: 1 },
    $push: { disklikedby: userId },
  });
  if (!glimpse) {
    res.status(400).json({ message: "No glimpse found" });
  }
  res.status(200).json({ success: true });
};

//delete glimpse
exports.deleteglimpse = async (req, res) => {
  const { userId, glimpseId } = req.params;
  const glimpse = await Glimpse.findById(glimpseId);

  try {
    if (!glimpse) {
      res.status(404).json({ message: "Glimpse not found" });
    } else if (glimpse.creator.toString() !== userId) {
      res.status(400).json({ message: "You can't delete others glimpse" });
    } else {
      await Glimpse.findByIdAndDelete(glimpseId);
      await minioClient.removeObject("glimpse", glimpse.content);
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//fetch glimpse of known people
exports.knownglimpse = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    const time = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      const conv = await Conversation.find({
        members: { $all: [user._id] },
      });
      const Ids = [];
      if (conv.length > 0) {
        for (let i = 0; i < conv.length; i++) {
          for (let j = 0; j < conv[i].members.length; j++) {
            const needed = conv[i].members[j];
            if (needed.toString() !== user._id.toString()) {
              Ids.push(needed);
            }
          }
        }
        const glimpse = [];
        for (let i = 0; i < Ids.length; i++) {
          const gli = await Glimpse.findOne({
            creator: Ids[i],
          })
            .sort({ createdAt: -1 })
            .populate("creator", "fullname profilepic");
          glimpse.push(gli);
        }
        if (glimpse.length > 0) {
          const url = [];
          for (let i = 0; i < glimpse.length; i++) {
            const urls = await generatePresignedUrl(
              "glimpse",
              glimpse[i].content.toString(),
              60 * 60
            );
            url.push(urls);
          }
          const dp = [];
          for (let i = 0; i < glimpse.length; i++) {
            const dps = await generatePresignedUrl(
              "images",
              glimpse[i].creator.profilepic.toString(),
              60 * 60
            );
            dp.push(dps);
          }
          res.status(200).json({ glimpse, url, dp, success: true });
        } else {
          res.status(203).json({ message: "No glimpse found", success: false });
        }
      }
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};




// for (let file of uris) {
//   console.log(file);
//   const response = await axios.post(
//     'http://192.168.1.7:7700/api/start-multipart-upload',
//     {
//       fileName: file.fileName,
//       contentType: file.type,
//     },
//   );

//   // get uploadId
//   let {uploadId} = response.data;
//   console.log('UploadId- ', uploadId);

//   // get total size of the file
//   let totalSize = file.fileSize;
//   // set chunk size to 10MB
//   let chunkSize = 128 * 1024;
//   // calculate number of chunks
//   let numChunks = Math.ceil(totalSize / chunkSize);

//   // generate presigned urls
//   let presignedUrls_response = await axios.post(
//     'http://192.168.1.7:7700/api/generate-presigned-url',
//     {
//       fileName: file.fileName,
//       uploadId: uploadId,
//       partNumbers: numChunks,
//     },
//   );

//   let presigned_urls = presignedUrls_response?.data?.presignedUrls;

//   console.log('Presigned urls- ', presigned_urls);

//   // upload the file into chunks to different presigned url
//   let parts = [];

//   for (let i = 0; i < numChunks; i++) {
//     let start = i * chunkSize;
//     let end = Math.min(start + chunkSize, totalSize);
//     console.log(file, start, end);
//     let chunk = file.slice(start, end);

//     let presignedUrl = presigned_urls[i];

//     uploadPromises.push(
//       axios.put(presignedUrl, chunk, {
//         headers: {
//           'Content-Type': file.type,
//         },
//       }),
//     );
//   }

//   const uploadResponses = await Promise.all(uploadPromises);

//   uploadResponses.forEach((response, i) => {
//     // existing response handling

//     parts.push({
//       etag: response.headers.etag,
//       PartNumber: i + 1,
//     });
//   });

//   console.log('Parts- ', parts);

//   // make a call to multipart complete api
//   let complete_upload = await axios.post(
//     'http://192.168.1.7:7700/api/complete-multipart-upload',
//     {
//       fileName: file.fileName,
//       uploadId: uploadId,
//       parts: parts,
//     },
//   );

//   console.log('Complete upload- ', complete_upload.data);

//   // if upload is successful, alert user
//   if (complete_upload.status === 200) {
//     alert('File uploaded successfully.');
//   } else {
//     alert('Upload failed.');
//   }
// }


exports.startmultipart = async (req, res) => {
  // initialization
  let fileName = req.body.fileName;
  let contentType = req.body.contentType;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
  };

  // add extra params if content type is video
  if (contentType == "VIDEO") {
    params.ContentDisposition = "inline";
    params.ContentType = "video/mp4";
  }

  try {
    const multipart = await s3multi.createMultipartUpload(params).promise();
    res.json({ uploadId: multipart.UploadId });
  } catch (error) {
    console.error("Error starting multipart upload:", error);
    return res.status(500).json({ error: "Error starting multipart upload" });
  }
};

//upload multipart
exports.uploadmulti = async (req, res) => {
  // get values from req body
  const { fileName, uploadId, partNumbers } = req.body;
  const totalParts = Array.from({ length: partNumbers }, (_, i) => i + 1);
  try {
    const presignedUrls = await Promise.all(
      totalParts.map(async (partNumber) => {
        const params = {
          Bucket: process.env.BUCKET_NAME,
          Key: fileName,
          PartNumber: partNumber,
          UploadId: uploadId,
          Expires: 3600 * 3,
        };

        return s3multi.getSignedUrl("uploadPart", {
          ...params,
        });
      })
    );
    res.json({ presignedUrls });
  } catch (error) {
    console.error("Error generating pre-signed URLs:", error);
    return res.status(500).json({ error: "Error generating pre-signed URLs" });
  }
};

exports.completemulti = async (req, res) => {
  // Req body
  let fileName = req.body.fileName;
  let uploadId = req.body.uploadId;
  let parts = req.body.parts;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    UploadId: uploadId,

    MultipartUpload: {
      Parts: parts.map((part, index) => ({
        ETag: part.etag,
        PartNumber: index + 1,
      })),
    },
  };
  try {
    const data = await s3multi.completeMultipartUpload(params).promise();
    res.status(200).json({ fileData: data });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return res.status(500).json({ error: "Error completing multipart upload" });
  }
};