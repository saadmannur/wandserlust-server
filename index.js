const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require('express');
const cors = require('cors')
const app = express();

app.use(cors());
app.use(express.json())

const dotenv = require('dotenv')
dotenv.config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;

const port = process.env.PORT;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

// middleware function
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized" })
    }
    const token = authHeader.split(" ")[1]
    if (!token) {
        return res.status(401).send({ message: "Unauthorized" })
    }

    try {
        const { payload } = await jwtVerify(token, JWKS)
        // console.log(payload); //check
        next()
    }
    catch (error) {
        res.status(403).send({ message: "Forbidden" })
    }
}

async function run() {
    try {
        // await client.connect();

        const db = client.db('wanderlust');
        const destinationCollection = db.collection('destinations')
        const bookingCollection = db.collection('bookings')


        app.get('/destination', async (req, res) => {
            const destinations = await destinationCollection.find().toArray();
            res.send(destinations);
        })

        app.get('/destination/:id', verifyToken, async (req, res) => {
            const id = await req.params.id;
            const result = await destinationCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.patch('/destination/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedDocument = req.body
            const result = await destinationCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedDocument }
            )
            res.send(result)
        })

        app.delete('/destination/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const result = await destinationCollection.deleteOne(
                { _id: new ObjectId(id) }
            );
            res.send(result)
        })

        app.post('/destination', verifyToken, async (req, res) => {
            const newDestinationData = req.body;
            const result = await destinationCollection.insertOne(newDestinationData);
            res.send(result)
        })

        app.get('/booking/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await bookingCollection.find({ userId: id }).toArray();
            res.send(result)
        })

        app.delete('/booking/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.post('/booking', verifyToken, async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData)
            res.send(result)
        })



        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("server is running fine!!")
})

app.listen(port, () => {
    console.log(`server is running on ${port} `)
})