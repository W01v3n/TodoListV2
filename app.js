const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

// Initialize express
const app = express();

mongoose.set('strictQuery', false);

app.set("view engine", "ejs");

// Initialize bodyParser
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static content, i.e css, images, etc. From the "public" directory.
app.use(express.static("public"));

// Connect to database
mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// Respond to / route with the relative index.html
app.get("/", function (req, res) {
    Item.find(function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added the starting items array to DB.");
                }
            });
            res.redirect("/");
        } else {
            if (err) {
                console.log(err);
            } else {
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
        }
    });
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, async function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                await list.save();
                console.log("Successfully created a collection for " + customListName + ".");
                res.redirect("/" + _.lowerCase(customListName));
            } else {
                // Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + _.lowerCase(listName));
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully deleted checked out item with the ID: " + checkedItemId);
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {
            if (!err) {
                res.redirect("/" + _.lowerCase(listName));
                console.log("Successfully deleted checked out item with the ID: " + checkedItemId);
            }
        });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

// Listen on port
app.listen(3000, function () {
    console.log("Server is running on port 3000.");
});
