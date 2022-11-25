const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//Register user API

app.post("/users/", async (request, response) => {
  const { username, name, password, location, gender } = request.body;
  const hashPw = await bcrypt.hash(password, 10);
  const getUserQuery = `
  SELECT * FROM 
    user
    WHERE 
    username ='${username}';`;
  const sameUser = await db.get(getUserQuery);
  if (sameUser === undefined) {
    const regQuery = `
    INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashPw}',
      '${gender}',
      '${location}'  
    );`;
    const registerResult = await db.run(regQuery);
    response.send("User registered successfully");
  } else {
    response.status = 400;
    response.send("Invalid username");
  }
});

//login Api
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userNameQuery = `SELECT * FROM 
    user WHERE username='${username}'`;
  const eligibility = await db.get(userNameQuery);
  if (eligibility === undefined) {
    response.status = 400;
    response.send("Invalid username");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      eligibility.password
    );
    if (isPasswordMatched) {
      response.send("Login successful");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});
