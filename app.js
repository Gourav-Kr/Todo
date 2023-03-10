//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _=require("lodash")

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-gk:todopass123@todo.xj2cd9b.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to todolist!!",
});
const item2 = new Item({
  name: "Hit the '+' icon to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this icon to delete",
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const defaults = [item1, item2, item3];

// Item.insertMany(defaults).then(console.log("success adding defaults")).catch(e=>{console.log(e.message);});

app.get("/", function (req, res) {
  // let content=[];
  Item.find()
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaults)
          .then(res.redirect("/"))
          .catch((e) => {
            console.log(e.message);
          });
      }
      res.render("list", {
        listTitle: "Today",
        newListItems: items,
      });
    })
    .catch((e) => {
      console.log(e.message);
    });
});


app.post("/", function (req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;

  if (listName === "Today") {
    Item.create({ name: item, }).then()
      .catch((e) => { console.log(e.message); });
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(e => {
      e.items.push({ name: item });
      e.save();
      res.redirect("/" + listName);
    })
  }


});


app.post("/delete", (req, res) => {
  const itemId = req.body.check;
  const listName = req.body.listName;
  // console.log(listName);
  if (listName === "Today") {
    Item.findByIdAndRemove(itemId)
      .then(() => {
        // console.log("Deleted Successfully");
        res.redirect("/");
      })
      .catch((e) => {
        console.log(e.message);
      });
    
  } else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:itemId}}}).then(e=>{
      // console.log("Deleted ",e);
      res.redirect("/"+listName);
    }).catch(e=>{console.log(e.message);})
  }
});

app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({ name: listName })
    .then((e) => {
      if (!e) {
        const list = new List({
          name: listName,
          items: defaults,
        });
        list.save()
        res.redirect("/" + listName);
        // console.log(listName, "Saved to db");
      } 
      else if(e.items.length===0){
        List.updateOne({name:listName},{items:defaults}).then(
          res.redirect("/"+listName)
        ).catch(e=>{
          console.log(e.message);
        })
      } else {
        res.render("list", {
          listTitle: listName,
          newListItems: e.items,
        })
      }
    })
    .catch((e) => {
      console.log("Not Present", e);
    });

});

const port=process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server started on port 3000");
});
