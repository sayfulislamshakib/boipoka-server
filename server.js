const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require("bson");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ykse1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect((err) => {
    console.log("Errors found: ", err);
    const booksCollection = client.db(process.env.DB_NAME).collection("books");
    const ordersCollection = client
        .db(process.env.DB_NAME_ORDERED_BOOKS)
        .collection("orderedBooks");

    //get requests
    app.get("/books", (req, res) => {
        booksCollection.find({}).toArray((err, books) => {
            res.send(books);
        });
    });

    app.get("/books/:id", (req, res) => {
        // console.log(req.params.id);
        booksCollection.findOne({ _id: ObjectId(req.params.id) }).then((book) => {
            res.send(book);
        });
    });

    app.get("/booksByUser", (req, res) => {
        const userEmail = req.headers.currentuser;
        // console.log(userEmail);
        booksCollection.find({ email: userEmail }).toArray((err, books) => {
            res.send(books);
        });
    });

    app.get("/orderedBooksByUser", (req, res) => {
        const userEmail = req.headers.currentuser;
        ordersCollection.find({ orderedBy: userEmail }).toArray((err, books) => {
            res.send(books);
        });
    });

    //post requests
    app.post("/addBook", (req, res) => {
        const newBook = req.body;
        booksCollection.insertOne(newBook).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });
    app.post("/orderBook", (req, res) => {
        const orderedBook = req.body;

        ordersCollection
            .insertOne(orderedBook)
            .then((result) => {
                res.send(result.insertedCount > 0);
            })
            .catch((err) => {
                console.log(err);
                res.send(false);
            });
    });

    app.post('/searchBooks', (req, res) => {
        const query = req.body.query;
        var re = new RegExp(`.*${query}.*`, "i");
        booksCollection.find({name: {$regex: re}})
        .toArray( (err, books) => {
            res.send(books);
        })
    })

    //delete requests
    app.delete("/books/:id", (req, res) => {
        const id = req.params.id;
        booksCollection
            .findOneAndDelete({ _id: ObjectId(id) })
            .then((deletedBook) => {
                if (deletedBook) {
                    res.send({
                        deleted: true,
                        message: `Successfully deleted book: ${deletedBook}.`,
                    });
                } else {
                    res.send({ deleted: false, message: "No book matches the provided id." });
                }
            })
            .catch((err) =>
                res.send({
                    deleted: false,
                    message: `Failed to find and delete document: ${err}`,
                })
            );
    });
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
