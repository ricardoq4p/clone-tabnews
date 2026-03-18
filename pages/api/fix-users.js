import connectToDatabase from "../../lib/db";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await connectToDatabase();

  const users = await mongoose.connection.db
    .collection("users")
    .find({})
    .toArray();

  for (const user of users) {
    const username = user.email.split("@")[0];

    await mongoose.connection.db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { username },
      },
    );
  }

  res.status(200).json({ message: "Users atualizados com sucesso 🚀" });
}
