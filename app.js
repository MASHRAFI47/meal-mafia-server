const express = require("express");
const app = express();

require('dotenv').config();

//cors
const cors = require("cors");
app.use(cors())

//expressjson
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iduz7rm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const usersCollection = client.db("meal-mafia").collection("users");
        const mealsCollection = client.db("meal-mafia").collection("meals");


        //save a user in database
        app.put("/user", async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };

            if (user?.email == null) {
                return
            }

            if (user?.fullName == null) {
                return
            }

            const isExisted = await usersCollection.findOne(query);
            if (isExisted) {
                return res.send(isExisted);
            }

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...user,
                    timestamp: Date.now(),
                }
            }

            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.send(result)
        })

        //meals collection
        app.get("/meals", async (req, res) => {
            const result = await mealsCollection.find().toArray();
            res.send(result);
        })

        //get one meal
        app.get("/meals/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await mealsCollection.findOne(query);
            res.send(result);
        })

        //post a meal
        app.post("/meals", async (req, res) => {
            const meal = req.body;
            const result = await mealsCollection.insertOne(meal);
            res.send(result);
        })

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


module.exports = app;