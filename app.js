const express = require("express");
const app = express();

require('dotenv').config();

//cors
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://meal-mafia.web.app'],
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

//expressjson
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


//cookie
app.use(cookieParser());


//middlewares
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: "Unauthorized User" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: "Unauthorized Access" })
        }
        req.user = decoded;

        next()
    })
}


//verify admin middleware
const verifyAdmin = async (req, res, next) => {
    const user = req.user;
    const query = { email: user?.email };
    const result = await usersCollection.findOne(query)
    if (!result || result?.role !== 'admin') {
        return res.status(401).send({ message: "Unauthorized Access" })
    }

    next();
}



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

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


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
            const sort = req.query.sort;
            console.log(sort)

            let query = {};

            const options = {
                sort: {
                    price: sort === 'asc' ? 1 : -1,
                }
            }

            const result = await mealsCollection.find(query, options).toArray();
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

        //delete a meal
        app.delete("/meal/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await mealsCollection.deleteOne(query);
            res.send(result);
        })

        //get all users
        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        //make an user admin
        app.patch("/user/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const userRole = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...userRole
                }
            }
            const result = await usersCollection.updateOne(query, updateDoc, options)
            res.send(result);
        })

        app.get("/user/role/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await usersCollection.findOne(query);
            res.send(result);
        })

        //jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d'
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({ success: true })
        })

        //logout
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res
                .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
                .send({ success: true })
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send("Meal Mafia server is running");
})


module.exports = app;