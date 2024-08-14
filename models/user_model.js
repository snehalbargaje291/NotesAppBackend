import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdOn: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
