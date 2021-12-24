// hold the db connection
let db;

// establish connection to database and set to version 1
const request = indexedDB.open("budget_tracker", 1);

// version upgrades
request.onupgradeneeded = function (event) {
  // save reference to database
  const db = event.target.result;
  // create an object store (table) called 'new_budget', set it to autoIncrement
  db.createObjectStore("new_budget", { autoIncrement: true });
};

// successful request
request.onsuccess = function (event) {
  // save reference
  db = event.target.result;

  // check if online
  if (navigator.online) {
    uploadBudget;
  }
};

// unsuccessful request
request.onerror = function (event) {
  //log the error
  console.log(event.target.errorCode);
};

// this function will be used if the app is currently offline
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for 'new_budget'
  const budgetObjectStore = transaction.objectStore("new_budget");

  // add record to store with add method
  budgetObjectStore.add(record);
}

// this function will upload everything done while offline
function uploadBudget() {
  // open a transcation on db
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for 'new_budget'
  const budgetObjectStore = transaction.objectStore("new_budget");

  // get all records and set to a variable
  const getAll = budgetObjectStore.getAll();

  // when getAll is successful, it will run this function
  getAll.onsuccess = function () {
    // send offline data from indexedDb to our api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_budget"], "readwrite");
          // access the new_budget object store
          const budgetObjectStore = transaction.objectStore("new_budget");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadBudget);
