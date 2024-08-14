import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import User from "./models/user_model.js";
import { authenticateToken } from "./utilities.js";
import { db } from "./config/db.js";
import bcrypt from "bcryptjs";
import Note from "./models/notes_model.js";

dotenv.config();

const app = express();

db();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", authenticateToken, (req, res) => {
  res.json({ data: "Hello World" });
});

//create note
app.post("/notes", authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!description) {
    return res.status(400).json({ error: "description is required" });
  }

  try {
    const note = new Note({
      title,
      description,
      user: req.user.user._id,
      // 'createdOn' will be set automatically by the schema
    });
    await note.save();
    return res.json({ error: false, data: note, message: "Note created" });
  } catch (error) {
    console.error("Error creating note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});


app.get("/notes", authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.user._id });
    return res.json({ error: false, data: notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});


//edit note
app.put("/notes/:id", authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!description) {
    return res.status(400).json({ error: "description is required" });
  }
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.user._id },
      { title, description },
      { new: true }
    );
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    return res.json({ error: false, data: note, message: "Note updated" });
  } catch (error) {
    console.error("Error updating note:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

//delete note
app.delete("/notes/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.user._id,
    });
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    return res.json({ error: false, message: "Note deleted" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

//pin note to top
app.put("/notes/pin/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.user._id },
      { pinned: false },
      { new: true }
    );
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    return res.json({ error: false, data: note, message: "Note pinned" });
  } catch (error) {
    console.error("Error pinning note:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

//search note
app.get("/notes/search", authenticateToken, async (req, res) => {
  try {
    const searchQuery = req.query.query;

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({ error: "Invalid search query" });
    }

    // Perform a text search using the search query
    const notes = await Note.find({
      user: req.user.user._id,
      $text: { $search: searchQuery },
    });

    if (!notes.length) {
      return res.status(404).json({ error: "No notes found" });
    }

    return res.json({ error: false, data: notes });
  } catch (error) {
    console.error("Error searching notes:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "password is required" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "invalid password" });
    }
    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });

    return res.json({
      error: false,
      data: user,
      accessToken,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});
// Create account
app.post("/account", async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "password is required" });
  }
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const isUser = await User.findOne({ email: email });
    if (isUser) {
      return res.status(400).json({ error: "email already exists" });
    }
    //i want to hash password before saving it to database
    const user = new User({ username, password: hashedPassword, email });
    await user.save();
    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });

    return res.json({
      error: false,
      data: user,
      accessToken,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

//get user
app.get("/get-user", authenticateToken, async (req, res)=>{
  try{
    const user = await User.findById(req.user.user._id)
    return res.json ({error: false, data: user})
  }catch (error) {
    console.error("Error fetching notes:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
})


app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

export default app;
