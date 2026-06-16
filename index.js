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
const uri = process.env.MONGODB_URI;

const port = process.env.PORT;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db('wanderlust');
        const destinationCollection = db.collection('destinations')
        const bookingCollection = db.collection('bookings')


        app.get('/destination', (req, res, next) => {
            const header = req.headers.authorization;
            // console.log(header') //check
            if(header === 'logged in'){
                next()
            }else{
                res.status(401).send({message: "unauthorized"})
            }
        }, async(req, res) => {
            const destinations = await destinationCollection.find().toArray();
            res.send(destinations);
        })

        app.get('/destination/:id', (req, res, next) => {
            const header = req.headers.authorization;
            // console.log("from header",header) //check
            if(header === "logged in"){
                next()
            }else{
                res.status(401).send({ message: "Unauthorized"})
            }
        }, async(req, res) => {
            const id = await req.params.id;
            const result = await destinationCollection.findOne({_id:new ObjectId(id)})
            res.send(result)
        })

        app.patch('/destination/:id', async(req, res) => {
            const id = req.params.id;
            const updatedDocument = req.body
            const result = await destinationCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: updatedDocument}
            )
            res.send(result)
        })

        app.delete('/destination/:id', async(req, res) => {
            const id = req.params.id
            const result = await destinationCollection.deleteOne(
                {_id: new ObjectId(id)}
            );
            res.send(result)
        })

        app.post('/destination', async (req, res) => {
            const newDestinationData = req.body;
            const result = await destinationCollection.insertOne(newDestinationData);
            res.send(result)
        })

        app.get('/booking/:id', async(req, res) => {
            const {id} = req.params;
            const result = await bookingCollection.find({userId:id }).toArray();
            res.send(result)
        })

        app.delete('/booking/:id', async (req, res) => {
            const {id} = req.params;
            const result = await bookingCollection.deleteOne({_id: new ObjectId(id)})
            res.send(result)
        })

        app.post('/booking', async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData)
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
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