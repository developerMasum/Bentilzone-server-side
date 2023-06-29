const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mq0mae1.mongodb.net/?retryWrites=true&w=majority`

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3besjfn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("BentilzoneDb").collection("users");
    const menuCollection = client.db("BentilzoneDb").collection("menu");
    const cartCollection = client.db("BentilzoneDb").collection("carts");
    const paymentCollection = client.db("BentilzoneDb").collection("payments");

// user ar kaj bajj 
app.put("/users/:email", async (req, res) => {
  const email = req.params.email;
  const user = req.body;
  const query = { email: email };
  const options = { upsert: true };
  const updateDoc = {
    $set: user,
  };
  const result = await usersCollection.updateOne(query, updateDoc, options);
  // console.log(result);
  res.send(result);
});

  // get the user
  app.get("/users", async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
  });

     // make admin
     app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

      // check admin or not by 
      app.get('/users/admin/:email', async (req, res) => {
        const email = req.params.email;
  
        // if (req.decoded.email !== email) {
        //   res.send({ admin: false })
        // }
        const query = { email: email }
        const users = await usersCollection.findOne(query);
        const result = { admin: users?.role === 'admin' }
        console.log(result);
        res.send(result);
      })






    // get the menu items
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().sort({ _id: -1 }).toArray();
      res.send(result);
    });
    // get by id 
    app.get("/menuItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.findOne(query);
      res.send(result);
    });

    // post a new item in menu
    app.post("/menu", async (req, res) => {
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    });
    // post Update item in menu
    app.patch("/menu", async (req, res) => {
      const item = req.body;
      const result = await menuCollection.updateOne(item);
      res.send(result);
    });

    // update an item details 
    app.put("/item/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const update = req.body;
      const item = {
        $set: {
          name: update.name,
          title: update.title,
          Category: update.Category,
          price: update.price,
          photo: update.photo,
        },
      };
      const result = await menuCollection.updateOne(filter,item,option)
      res.send(result)
    });
    
    // delete an item

    app.delete("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });

    // add new items from menu
   // Post a new item to the cart
app.post("/carts", async (req, res) => {
  const item = req.body;
const result = await cartCollection.insertOne(item);
  res.send(result);
});
    // get cart by email 
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // delete item from cart 
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

  // create payment intent
  app.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });


    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });


// payment related api
app.post("/payments", async (req, res) => {
  const payment = req.body;
  const insertResult = await paymentCollection.insertOne(payment);

  const query = {
    _id: { $in: payment.cartItems.map((id) => new ObjectId(id)) },
  };
  const deleteResult = await cartCollection.deleteMany(query);

  res.send({ insertResult, deleteResult });
});








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bentilzone Restuarent Server is running..");
});

app.listen(port, () => {
  console.log(`Bentilzone Restaurant server side  is running on port ${port}`);
});
