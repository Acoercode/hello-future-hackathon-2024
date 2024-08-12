const superagent = require("superagent");
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const mongodb = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

module.exports.predict = async (event) => {
  // Get the request
  let request = JSON.parse(event.body);

  // Send the request to the prediction endpoint
  let prediction = await superagent
    .post("http://34.207.200.229:5000/predict")
    .send(request);

  let result = {};
  result["mild"] = prediction.body[0].indexOf("Mild") != -1 ? prediction.body[1][prediction.body[0].indexOf("Mild")] : -1;
  result["moderate"] = prediction.body[0].indexOf("Moderate") != -1 ? prediction.body[1][prediction.body[0].indexOf("Moderate")] : -1;
  result["none"] = prediction.body[0].indexOf("None") != -1 ? prediction.body[1][prediction.body[0].indexOf("None")] : -1;
  request.result = result;

  // Call the stamping API
  let stamp = await superagent
    .post("https://external.hashlog.io/event")
    .set("APIKey", process.env.HASHLOG_API_KEY)
    .send({
      data: JSON.stringify(request)
    });

  // Store the ID
  let stampId = stamp.body._id;

  // And save it in MongoDB
  let mongoObject = {
    _id: stampId,
    stamp: stamp.body,
    request: request
  };
  try {
    await mongodb.connect();
    await mongodb
      .db("hedera-hackhaton")
      .collection("predictions")
      .insertOne(mongoObject);
  } catch (e) {
    console.log(e);
  } finally {
    // Ensures that the client will close when you finish/error
    if (mongodb) await mongodb.close();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Event properly recorded!",
        stamp: stamp.body,
        id: stampId,
        request
      },
      null,
      2
    ),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
    },
  };
};

module.exports.webhook = async (event) => {
  let json = JSON.parse(event.body);
  let id = json._id;

  // And update it in MongoDB
  try {
    await mongodb.connect();
    await mongodb
      .db("hedera-hackhaton")
      .collection("predictions")
      .updateOne({ _id: id }, { $set: { stamp: json } });
  } catch (e) {
    console.log(e);
  } finally {
    // Ensures that the client will close when you finish/error
    if (mongodb) await mongodb.close();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Event updated!",
      },
      null,
      2
    ),
  };
};

module.exports.getLatestPredictions = async (event) => {
  
  let predictions = [];

  // Get it in MongoDB
  try {
    await mongodb.connect();
    predictions = await mongodb
      .db("hedera-hackhaton")
      .collection("predictions")
      .find()
      .limit(10)
      .sort("stamp.date", -1)
      .toArray();
  } catch (e) {
    console.log(e);
  } finally {
    // Ensures that the client will close when you finish/error
    if (mongodb) await mongodb.close();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      predictions,
      null,
      2
    ),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
    },
  };
};
