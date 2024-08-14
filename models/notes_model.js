import mongoose from "mongoose";
const notesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Note", notesSchema);
