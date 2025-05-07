const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  ip_address: String,
  year: String,
  vulnerabilities: [
    {
      bug_name: String,
      severity: String,
      cvss_score: String,
      location: String,
      description: String,
      impact: [Object],
      proof_of_concept: [
        {
          step: String,
          image: String,
        },
      ],
      remediation: [String],
      image: String,
    },
  ],
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  userId: { type: String, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", ReportSchema);
module.exports = Report;
