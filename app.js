

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const port = process.env.PORT || 3000;
const app = express();
//mongodb://127.0.0.1:27017/toDoDB
//
mongoose.connect('mongodb+srv://admin-hadi:hadi%40mongoadmin%232003@atlascluster.rmzmzvm.mongodb.net/toDoDB'); //%40 is @ and %23 is #
const itemSchema = new mongoose.Schema({
  name: String
})



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const Item = mongoose.model("item", itemSchema);
const item1 = new Item({
  name: "Welcome to toDoList with db"
});

const item2 = new Item({
  name: "Hit the + btn to add a task"
});

const item3 = new Item({
  name: "<-- hit this to delete an item!"
});


// to insert array of objects to the database
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

async function insertManyItems(itemsArr) { // or takes an object
  if (await Item.insertMany(itemsArr)) {
    console.log("Successfully inserted items to the database");
    
  }
  else {
    console.log("Something went wrong!");
  }
  const itemsInDB = await Item.find();
  console.log(itemsInDB);
}

async function insertManyListItems(newList) { // or takes an object
  if (await List.insertMany(newList)) {
    console.log("Successfully inserted new list to the database");
  }
  else {
    console.log("Something went wrong!");
  }
  const listsInDB = await List.find();
  console.log(listsInDB);
}




//to update
// const condition = {_id: "64db58877867b56b7e604714"};
// const infoToBeUpdated = {name: "<-- Hit this to delete or complete a task"};
// async function updateItem(condition, infoToBeUpdated)
// {
//   console.log("Item to be updated:");
//   console.log(await Item.find(condition));
//   await Item.updateOne(condition, infoToBeUpdated);
//   console.log("Updated...");
//   const itemAfterUpdate = await Item.find(condition);
//   console.log(itemAfterUpdate);
// }
// updateItem(condition, infoToBeUpdated);

//to fetch data and render on screen
async function fetchDataAndRender(res) {
  const itemsInDB = await Item.find();
  if (itemsInDB.length === 0) {
    insertManyItems(defaultItems);
    console.log(itemsInDB);
    res.redirect("/");
  }
  else {
    res.render("list", { listTitle: "Today", newListItems: itemsInDB });
  }

}
app.get("/", function (req, res) {
  fetchDataAndRender(res);
});

async function searchIfAListExistsAndRender(name, res) {
  const neededList = await List.findOne({ name: name });
  if (neededList === null) {
    neededList = new List({
      name: customName,
      items: defaultItems
    });
    insertManyListItems(neededList);
    redirect("/"+customName);
  }
  else if (neededList.name === name) {
    res.render("list", { listTitle: name, newListItems: neededList.items });
  }

}

app.get("/:customListName", async (req, res) => {
  const customName = _.capitalize(req.params.customListName);
  await searchIfAListExistsAndRender(customName, res);
})

// async function serachForAListAndPush(query, item)
// {
//   const list = await List.find({name: query});
//   console.log(list);
// }

// app.post("/:customListName", (req, res) => {
//   const customName = _.lowerCase(req.params.customListName);
//   const item =  {
//     name: req.body.newItem
//   };
//   serachForAListAndPush(customName, item); 

// })

async function deleteItemById(id) {
  await Item.findByIdAndDelete(id);
  console.log(await Item.find());
}

async function deleteItemFromAListById(id, listName)
{

  await List.findOneAndUpdate( {name: listName}, { $pull: {items: {_id: id} } } ); //find the list, pull from its array the item of the requested id


  //ORRR
  // let searchList = await List.findOne({name: listName});
  // // console.log(searchList.items);
  // let filteredArr = searchList.items.filter((item) => item._id != id);
  // // console.log(filteredArr);
  // searchList.items = filteredArr;
  // // console.log(searchList.items)
  // await searchList.save();
}

app.post("/delete", (req, res) => {
  
  const deleteId = req.body.tickBox;
  const listName = req.body.hiddenTitle;
  
  if (listName === "Today") {
    deleteItemById(deleteId);
    res.redirect("/");
  } else {
    deleteItemFromAListById(deleteId, listName);
    res.redirect("/" + listName);
  } 
  
  
})


async function findListAndPush(listName, item, res) {

  await List.findOneAndUpdate( {name: listName}, { $push: {items: item } } );


  //ORRR
  // const listSearched = await List.findOne({ name: listName });
  // await listSearched.items.push(item);
  // console.log("We are adding to this list:");
  // console.log(listSearched)
  // await listSearched.save();
  
}


app.post("/", function (req, res) {

  const item = {
    name: req.body.newItem
  };
  const listName = req.body.list;
  if (listName === "Today") {
    insertManyItems(item);
    res.redirect("/");
  } else {
    findListAndPush(listName, item, res);
    res.redirect("/" + listName);
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(port, function () {
  console.log("Server started on port 3000");
});
