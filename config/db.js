import mongoose from "mongoose";
export const db = async () => {
  try {
    await mongoose
      .connect(
        "mongodb://snehalbargaje:Snehal123@ac-3xj4gat-shard-00-00.dpevycq.mongodb.net:27017,ac-3xj4gat-shard-00-01.dpevycq.mongodb.net:27017,ac-3xj4gat-shard-00-02.dpevycq.mongodb.net:27017/?ssl=true&replicaSet=atlas-wfh8vf-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Notesapp")
        .then(() => console.log("Database connected"))
        .catch((err) => console.error("Database connection error:", err));
    } catch (error) {
        console.log("DB Connection Error", error);
        }
}
