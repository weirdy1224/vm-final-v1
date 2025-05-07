const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("./models/User");
const reportsRoutes = require("./Routes/Reports");
const Report = require("./models/Report");
const authMiddleware = require("./Middleware/authMiddleware");

const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  ImageRun,
  ExternalHyperlink,
} = require("docx");

const app = express();
const BASE_UPLOAD_PATH = path.join(__dirname, "uploads", "reports");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "uploads/images"))
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", reportsRoutes);

if (!fs.existsSync(BASE_UPLOAD_PATH)) {
  fs.mkdirSync(BASE_UPLOAD_PATH, { recursive: true });
}
// Directory Setup
const uploadsDir = path.join(__dirname, "uploads");
const imageDirBase = path.join(__dirname, "uploads/images");
const downloadsDir = path.join(__dirname, "downloads");
[uploadsDir, imageDirBase, downloadsDir].forEach(
  (dir) => fs.existsSync(dir) || fs.mkdirSync(dir, { recursive: true })
);

mongoose
  .connect("mongodb://localhost:27017/loginSystem")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const LoginUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "client"], default: "client" },
  userId: { type: String, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
const LoginUser = mongoose.model("LoginUser", LoginUserSchema);

const ImageSchema = new mongoose.Schema({
  imageUrl: String,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", ImageSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BASE_UPLOAD_PATH); // Saves files in 'uploads/reports'
  },
  filename: (req, file, cb) => {
    cb(null, `report-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const imageStorage = multer.diskStorage({
  destination: "./uploads/images",
  filename: (req, file, cb) =>
    cb(null, `image-${Date.now()}${path.extname(file.originalname)}`),
});
const uploadImage = multer({ storage: imageStorage });

async function processPDF(pdfPath, userId) {
  try {
    const absolutePdfPath = path.resolve(pdfPath);
    if (!fs.existsSync(absolutePdfPath)) {
      throw new Error(`File not found: ${absolutePdfPath}`);
    }

    console.log("Reading PDF file from:", absolutePdfPath);
    const pdfBuffer = fs.readFileSync(absolutePdfPath);

    console.log("Parsing PDF...");
    const data = await pdfParse(pdfBuffer);
    console.log("PDF Parsed Successfully!");

    const text = data.text.replace(/\n+/g, "\n").trim();
    console.log("Raw Parsed Text:", text);

    console.log("Converting text to JSON...");
    const jsonOutput = processTextToJSON(text);
    jsonOutput.userId = userId;
    jsonOutput.fileName = path.basename(pdfPath);

    console.log("Extracting domain...");
    const domain = jsonOutput.domain
      ? jsonOutput.domain.replace(/https?:\/\//, "").replace(/\W+/g, "_")
      : "unknown_domain";
    console.log(`Domain extracted: ${domain}`);

    const imageOutputDir = path.join(__dirname, "uploads/images", domain);
    console.log(`Image output directory: ${imageOutputDir}`);

    console.log("Extracting images...");
    jsonOutput.images = await extractImagesWithMuPDF(
      absolutePdfPath,
      imageOutputDir
    );
    console.log(`Extracted images: ${jsonOutput.images.length}`);

    console.log("Assigning images...");
    let imageIndex = 0;
    jsonOutput.vulnerabilities?.forEach((vuln) => {
      if (imageIndex < jsonOutput.images.length) {
        vuln.image = `/uploads/images/${domain}/${path.basename(
          jsonOutput.images[imageIndex++]
        )}`;
      }
      vuln.proof_of_concept?.forEach((poc) => {
        if (imageIndex < jsonOutput.images.length) {
          poc.image = `/uploads/images/${domain}/${path.basename(
            jsonOutput.images[imageIndex++]
          )}`;
        }
      });
    });

    delete jsonOutput.images; // Remove temporary field
    console.log("Final JSON Output:", JSON.stringify(jsonOutput, null, 2));
    return jsonOutput;
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    throw new Error("Failed to process PDF: " + error.message);
  }
}

function processTextToJSON(text) {
  const jsonOutput = {
    domain:
      extractValue(text, /Domain:\s*(https?:\/\/[^\s]+)/i) || "unknown_domain",
    ip_address:
      extractValue(text, /IP Address:\s*((\d{1,3}\.){3}\d{1,3})/i) || "",
    year: extractValue(text, /YEAR:\s*(\d{4})/i) || "",
    vulnerabilities: [],
  };

  const vulnBlocks = text.split(/\d+\)\s*Bug Name:/).slice(1);
  console.log("Number of Vulnerability Blocks:", vulnBlocks.length);
  console.log("Vulnerability Blocks:", vulnBlocks);

  jsonOutput.vulnerabilities = vulnBlocks.map((vulnText) => {
    console.log("Processing Vulnerability Block:", vulnText);
    return {
      bug_name: extractValue(vulnText, /(.*)/) || "",
      severity: extractValue(vulnText, /Severity:\s*(\w+)/i) || "",
      cvss_score: extractValue(vulnText, /CVSS Score:\s*([\d.]+)/i) || "",
      location:
        extractValue(vulnText, /Location:\s*(https?:\/\/[^\s]+)/i) || "",
      description:
        extractValue(
          vulnText,
          /Vulnerability Descriptions?:\s*([\s\S]*?)(?=Impact:|POC:|Remediation:|$)/i
        ) || "",
      impact: extractSectionItems(
        vulnText,
        /Impact:\s*([\s\S]*?)(?=POC:|Remediation:|$)/i
      ),
      proof_of_concept: extractSectionItems(
        vulnText,
        /POC:\s*([\s\S]*?)(?=Remediation:|$)/i,
        true
      ),
      remediation: extractSectionItems(
        vulnText,
        /Remediation:\s*([\s\S]*?)(?=$|\n\n|\d+\)\s*Bug Name:)/i
      ),
      image: "",
    };
  });

  return jsonOutput;
}
function extractValue(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}
function extractImagesWithMuPDF(pdfPath, outputDir) {
  return new Promise((resolve) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    exec(
      `mutool extract "${pdfPath}"`,
      { cwd: __dirname },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error extracting images: ${error.message}`);
          return resolve([]);
        }
        if (stderr) console.error(`stderr: ${stderr}`);

        let extractedImages = [];
        fs.readdirSync(__dirname).forEach((file) => {
          const filePath = path.join(__dirname, file);
          if (fs.statSync(filePath).isFile()) {
            if (file.match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i)) {
              const newPath = path.join(outputDir, file);
              fs.renameSync(filePath, newPath);
              extractedImages.push(newPath);
            } else if (file.match(/\.ttf$/i)) {
              fs.unlinkSync(filePath);
            }
          }
        });
        resolve(extractedImages);
      }
    );
  });
}

function extractSectionItems(text, regex, isPOC = false) {
  const match = text.match(regex);
  if (!match) {
    console.log(`No match for ${regex.source} in:`, text);
    return isPOC ? [] : [];
  }

  const sectionText = match[1].trim();
  console.log(`Extracted Section (${regex.source}):`, sectionText);
  const items = sectionText
    .split(/\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 && !line.match(/^POC:|Remediation:|\d+\)\s*Bug Name:/i)
    )
    .map((line) => line.replace(/^[-•]?\s*\d*\.?\s*/, ""));

  if (isPOC) {
    return items.map((step) => ({
      step: step,
      image: "",
    }));
  }
  return items;
}
const BASE_URL = "http://localhost:5000";

app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

app.put("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating user", error: error.message });
  }
});

app.delete("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting user", error: error.message });
  }
});

app.post("/api/login-users", authMiddleware, async (req, res) => {
  try {
    const user = new LoginUser(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating login user", error: error.message });
  }
});

app.post("/api/login", authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send response with token
    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        companyName: user.companyName,
        industry: user.industry,
        picName: user.picName,
        picDesignation: user.picDesignation,
        picContact: user.picContact,
        website: user.website,
        profileLink: user.profileLink,
        email: user.email,
        role: user.role,
        jwt: process.env.JWT_SECRET,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login error", error: error.message });
  }
});

app.post(
  "/upload-report",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const newReport = new Report({
        domain: req.body.domain,
        ip_address: req.body.ip_address,
        year: req.body.year,
        vulnerabilities: JSON.parse(req.body.vulnerabilities),
        fileName: req.file.filename,
        filePath: `/uploads/reports/${req.file.filename}`,
        userId: req.body.userId,
      });

      await newReport.save();
      console.log(newReport);

      res
        .status(201)
        .json({ message: "Report uploaded successfully", report: newReport });
    } catch (error) {
      console.error("Error uploading report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
app.post("/api/users", authMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      industry,
      picName,
      picDesignation,
      picContact,
      website,
      profileLink,
      email,
      password,
      role,
    } = req.body;
    if (
      !companyName ||
      !industry ||
      !picName ||
      !picDesignation ||
      !picContact ||
      !website ||
      !profileLink ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      companyName,
      industry,
      picName,
      picDesignation,
      picContact,
      website,
      profileLink,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        companyName: user.companyName,
        industry: user.industry,
        picName: user.picName,
        picDesignation: user.picDesignation,
        picContact: user.picContact,
        website: user.website,
        profileLink: user.profileLink,
        email: user.email,
        role: user.role,
        jwt: process.env.JWT_SECRET,
      },
      token,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
  }
});
app.post(
  "/api/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!req.body.userId)
      return res.status(400).json({ message: "User ID required" });

    try {
      const fileName = req.file.filename;
      const relativeFilePath = `/uploads/reports/${fileName}`;
      const absoluteFilePath = path.join(BASE_UPLOAD_PATH, fileName);
      console.log("File initially saved at:", absoluteFilePath);

      if (!fs.existsSync(absoluteFilePath)) {
        throw new Error(`File not found after upload: ${absoluteFilePath}`);
      }

      const reportData = await processPDF(absoluteFilePath, req.body.userId);
      reportData.filePath = relativeFilePath;

      const report = new Report(reportData);
      console.log("Data to be saved:", JSON.stringify(report, null, 2));
      await report.save();
      console.log("Report saved with filePath:", report.filePath);

      res.json({ message: "PDF uploaded and processed successfully", report });
    } catch (error) {
      console.error("Upload error:", error);
      res
        .status(500)
        .json({ message: "Error processing PDF", error: error.message });
    }
  }
);
app.post(
  "/api/save-report",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("📥 Received Data (raw body):", req.body);

      const { domain, ip_address, year, vulnerabilities, userId } = req.body;

      if (!domain || !ip_address || !year || !userId || !req.file) {
        return res
          .status(400)
          .json({ message: "❌ Missing required fields or file" });
      }

      let parsedVulnerabilities = [];
      try {
        parsedVulnerabilities = JSON.parse(vulnerabilities || "[]");
        console.log(
          "Parsed vulnerabilities:",
          JSON.stringify(parsedVulnerabilities, null, 2)
        );
        if (
          !Array.isArray(parsedVulnerabilities) ||
          parsedVulnerabilities.length === 0
        ) {
          return res
            .status(400)
            .json({ message: "❌ Vulnerabilities must be a non-empty array" });
        }

        // Basic validation
        parsedVulnerabilities.forEach((vuln, index) => {
          if (!vuln.bug_name || typeof vuln.bug_name !== "string") {
            throw new Error(
              `Vulnerability[${index}]: bug_name must be a string`
            );
          }
          if (!Array.isArray(vuln.impact)) {
            throw new Error(`Vulnerability[${index}]: impact must be an array`);
          }
          if (!Array.isArray(vuln.proof_of_concept)) {
            throw new Error(
              `Vulnerability[${index}]: proof_of_concept must be an array`
            );
          }
          vuln.proof_of_concept.forEach((poc, pocIndex) => {
            if (typeof poc.step !== "string" || typeof poc.image !== "string") {
              throw new Error(
                `Vulnerability[${index}].proof_of_concept[${pocIndex}]: step and image must be strings`
              );
            }
          });
          if (!Array.isArray(vuln.remediation)) {
            throw new Error(
              `Vulnerability[${index}]: remediation must be an array`
            );
          }
        });
      } catch (error) {
        console.error("❌ Parsing/validation error:", error);
        return res.status(400).json({
          message: "❌ Invalid vulnerabilities format",
          error: error.message,
        });
      }

      const filePath = `/uploads/reports/${req.file.filename}`;
      console.log("📂 Stored File Path:", filePath);

      const report = new Report({
        domain,
        ip_address,
        year,
        vulnerabilities: parsedVulnerabilities,
        userId,
        fileName: req.file.filename,
        filePath,
      });

      console.log("Data to be saved:", JSON.stringify(report, null, 2));
      await report.save();
      console.log("Saved report:", JSON.stringify(report, null, 2));
      res.status(201).json({ message: "✅ Report saved successfully", report });
    } catch (error) {
      console.error("❌ Upload error:", error);
      res
        .status(500)
        .json({ message: "❌ Failed to process report", error: error.message });
    }
  }
);

app.post("/api/upload-image", uploadImage.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  const imageUrl = `http://localhost:5000/uploads/images/${req.file.filename}`;
  await Image.create({ imageUrl });
  res.json({ imageUrl });
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
