const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    industry: { type: String, required: true },
    picName: { type: String, required: true },
    picDesignation: { type: String, required: true },
    picContact: { type: String, required: true },
    website: { type: String, required: true },
    profileLink: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "client"] },
    jwt: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
