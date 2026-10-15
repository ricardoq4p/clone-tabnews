// Manual provisioning; never invoked by build, login or registration.
import mongoose from "mongoose";
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.argv.includes("--confirm") || !process.env.MONGODB_URI) {
  console.error(
    "Usage: node scripts/provision-admin.mjs verified-email --confirm (MONGODB_URI required)",
  );
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await mongoose.connection
      .collection("users")
      .updateOne(
        { email, isVerified: true, disabledAt: null },
        { $set: { role: "superadmin" }, $inc: { sessionVersion: 1 } },
      );
    if (result.matchedCount !== 1)
      throw new Error("No eligible verified account");
    console.log("Role updated. Sign in again to continue.");
  } catch {
    console.error(
      "Provisioning failed; check the target database and verified account.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
