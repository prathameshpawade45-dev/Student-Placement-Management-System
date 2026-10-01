import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  })
);

app.use(express.json());

/* =========================
   DATABASE
========================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function db(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/* =========================
   JWT
========================= */

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

/* =========================
   AUTH MIDDLEWARE
========================= */

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
}

/* =========================
   RESUME UPLOAD SETUP
========================= */

const uploadDir = path.join(
  __dirname,
  "uploads",
  "resumes"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    cb(
      null,
      `resume_${req.user.id}_${Date.now()}${extension}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (extension !== ".pdf") {
      return cb(
        new Error("Only PDF files are allowed.")
      );
    }

    cb(null, true);
  }
});

/* =========================
   STATIC UPLOADS
========================= */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

/* =========================
   BASIC ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "Student Placement Management System API is running."
  });
});

/* =========================
   REGISTER
========================= */

app.post(
  "/api/auth/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        department,
        graduationYear,
        phone,
        course,
        year
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message:
            "Name, email and password are required."
        });
      }

      const existing = await db(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existing.length) {
        return res.status(409).json({
          message: "Email already registered."
        });
      }

      const passwordHash = await bcrypt.hash(
        password,
        10
      );

      const userRole =
        role === "admin"
          ? "admin"
          : "student";

      const result = await db(
        `INSERT INTO users
        (
          name,
          email,
          password_hash,
          role,
          department,
          graduation_year,
          phone,
          course,
          year
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          email,
          passwordHash,
          userRole,
          department || null,
          graduationYear || null,
          phone || null,
          course || null,
          year || null
        ]
      );

      const user = {
        id: result.insertId,
        name,
        email,
        role: userRole,
        department: department || null,
        graduation_year:
          graduationYear || null,
        phone: phone || null,
        course: course || null,
        year: year || null,
        resume_path: null
      };

      const token = createToken(user);

      res.status(201).json({
        message: "Registration successful.",
        token,
        user
      });
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Registration failed."
      });
    }
  }
);

/* =========================
   LOGIN
========================= */

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required."
        });
      }

      const rows = await db(
        `SELECT
          id,
          name,
          email,
          password_hash,
          role,
          department,
          graduation_year,
          phone,
          course,
          year,
          resume_path
        FROM users
        WHERE email = ?`,
        [email]
      );

      if (!rows.length) {
        return res.status(401).json({
          message:
            "Invalid email or password."
        });
      }

      const user = rows[0];

      const validPassword =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!validPassword) {
        return res.status(401).json({
          message:
            "Invalid email or password."
        });
      }

      delete user.password_hash;

      const token = createToken(user);

      res.json({
        message: "Login successful.",
        token,
        user
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Login failed."
      });
    }
  }
);

/* =========================
   CURRENT USER
========================= */

app.get(
  "/api/auth/me",
  auth,
  async (req, res) => {
    try {
      const rows = await db(
        `SELECT
          id,
          name,
          email,
          role,
          department,
          graduation_year,
          phone,
          course,
          year,
          resume_path
        FROM users
        WHERE id = ?`,
        [req.user.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load user information."
      });
    }
  }
);

/* =========================
   RESUME UPLOAD
========================= */

app.post(
  "/api/resume",
  auth,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select a PDF resume."
        });
      }

      const resumePath =
        `/uploads/resumes/${req.file.filename}`;

      const oldRows = await db(
        `SELECT resume_path
         FROM users
         WHERE id = ?`,
        [req.user.id]
      );

      const oldResume =
        oldRows[0]?.resume_path;

      await db(
        `UPDATE users
         SET resume_path = ?
         WHERE id = ?`,
        [
          resumePath,
          req.user.id
        ]
      );

      if (oldResume) {
        const oldFilePath = path.join(
          __dirname,
          oldResume.replace(
            /^\/uploads\//,
            "uploads/"
          )
        );

        if (
          fs.existsSync(oldFilePath)
        ) {
          fs.unlinkSync(oldFilePath);
        }
      }

      res.json({
        message:
          "Resume uploaded successfully.",
        resume: resumePath
      });
    } catch (error) {
      console.error(
        "RESUME UPLOAD ERROR:",
        error
      );

      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }

      res.status(500).json({
        message:
          error.message ||
          "Could not upload resume."
      });
    }
  }
);

/* =========================
   GET COMPANIES
========================= */

app.get(
  "/api/companies",
  auth,
  async (req, res) => {
    try {
      const rows = await db(
        `SELECT
          id,
          name,
          description,
          location,
          package_lpa,
          eligibility_cgpa,
          drive_date
        FROM companies
        ORDER BY drive_date ASC`
      );

      res.json(rows);
    } catch (error) {
      console.error(
        "COMPANIES ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load companies."
      });
    }
  }
);

/* =========================
   APPLY TO COMPANY
========================= */

app.post(
  "/api/applications",
  auth,
  async (req, res) => {
    try {
      const { companyId } =
        req.body;

      if (!companyId) {
        return res.status(400).json({
          message:
            "Company is required."
        });
      }

      /* CHECK RESUME */

      const userRows = await db(
        `SELECT
          id,
          resume_path
        FROM users
        WHERE id = ?`,
        [req.user.id]
      );

      if (!userRows.length) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      if (!userRows[0].resume_path) {
        return res.status(400).json({
          message:
            "Please upload your resume before applying."
        });
      }

      /* CHECK COMPANY */

      const company = await db(
        `SELECT id
         FROM companies
         WHERE id = ?`,
        [companyId]
      );

      if (!company.length) {
        return res.status(404).json({
          message:
            "Company not found."
        });
      }

      /* CHECK DUPLICATE */

      const existing = await db(
        `SELECT id
         FROM applications
         WHERE user_id = ?
         AND company_id = ?`,
        [
          req.user.id,
          companyId
        ]
      );

      if (existing.length) {
        return res.status(409).json({
          message:
            "You have already applied to this company."
        });
      }

      /* INSERT APPLICATION */

      await db(
        `INSERT INTO applications
        (
          user_id,
          company_id
        )
        VALUES (?, ?)`,
        [
          req.user.id,
          companyId
        ]
      );

      res.status(201).json({
        message:
          "Application submitted successfully."
      });
    } catch (error) {
      console.error(
        "APPLY ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not submit application."
      });
    }
  }
);

/* =========================
   MY APPLICATIONS
========================= */

app.get(
  "/api/applications",
  auth,
  async (req, res) => {
    try {
      const rows = await db(
        `SELECT
          a.id,
          a.status,
          a.applied_at,
          c.name AS company_name,
          c.location,
          c.package_lpa
        FROM applications a
        JOIN companies c
          ON c.id = a.company_id
        WHERE a.user_id = ?
        ORDER BY a.applied_at DESC`,
        [req.user.id]
      );

      res.json(rows);
    } catch (error) {
      console.error(
        "APPLICATIONS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load applications."
      });
    }
  }
);

/* =========================
   WITHDRAW APPLICATION
========================= */

app.delete(
  "/api/applications/:id",
  auth,
  async (req, res) => {
    try {
      const result = await db(
        `DELETE FROM applications
         WHERE id = ?
         AND user_id = ?`,
        [
          req.params.id,
          req.user.id
        ]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          message:
            "Application not found."
        });
      }

      res.json({
        message:
          "Application withdrawn successfully."
      });
    } catch (error) {
      console.error(
        "WITHDRAW ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not withdraw application."
      });
    }
  }
);

/* =========================
   ADMIN STATS
========================= */

app.get(
  "/api/admin/stats",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const studentRows =
        await db(
          `SELECT COUNT(*) AS total
           FROM users
           WHERE role = 'student'`
        );

      const companyRows =
        await db(
          `SELECT COUNT(*) AS total
           FROM companies`
        );

      const applicationRows =
        await db(
          `SELECT COUNT(*) AS total
           FROM applications`
        );

      const selectedRows =
        await db(
          `SELECT COUNT(*) AS total
           FROM applications
           WHERE status = 'Selected'`
        );

      res.json({
        students:
          studentRows[0].total,

        companies:
          companyRows[0].total,

        applications:
          applicationRows[0].total,

        selected:
          selectedRows[0].total
      });
    } catch (error) {
      console.error(
        "ADMIN STATS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load admin statistics."
      });
    }
  }
);

/* =========================
   ADMIN APPLICATIONS
   WITH RESUME PATH
========================= */

app.get(
  "/api/admin/applications",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const rows = await db(
        `SELECT
          a.id,
          a.status,
          a.applied_at,

          u.name AS student_name,
          u.email,
          u.resume_path,

          c.name AS company_name

        FROM applications a

        JOIN users u
          ON u.id = a.user_id

        JOIN companies c
          ON c.id = a.company_id

        ORDER BY a.applied_at DESC`
      );

      res.json(rows);
    } catch (error) {
      console.error(
        "ADMIN APPLICATIONS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load admin applications."
      });
    }
  }
);

/* =========================
   ADMIN UPDATE APPLICATION STATUS
========================= */

app.patch(
  "/api/admin/applications/:id",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { status } =
        req.body;

      const allowedStatuses = [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Rejected",
        "Selected"
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid application status."
        });
      }

      const result = await db(
        `UPDATE applications
         SET status = ?
         WHERE id = ?`,
        [
          status,
          req.params.id
        ]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          message:
            "Application not found."
        });
      }

      res.json({
        message:
          "Application status updated successfully."
      });
    } catch (error) {
      console.error(
        "UPDATE STATUS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not update application status."
      });
    }
  }
);

/* =========================
   ADMIN ADD COMPANY
========================= */

app.post(
  "/api/admin/companies",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        name,
        description,
        location,
        packageLpa,
        eligibilityCgpa,
        driveDate
      } = req.body;

      if (
        !name ||
        !location ||
        !packageLpa ||
        !eligibilityCgpa ||
        !driveDate
      ) {
        return res.status(400).json({
          message:
            "Please fill all required company fields."
        });
      }

      const result = await db(
        `INSERT INTO companies
        (
          name,
          description,
          location,
          package_lpa,
          eligibility_cgpa,
          drive_date
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || null,
          location,
          packageLpa,
          eligibilityCgpa,
          driveDate
        ]
      );

      res.status(201).json({
        message:
          "Company added successfully.",
        id: result.insertId
      });
    } catch (error) {
      console.error(
        "ADD COMPANY ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not add company."
      });
    }
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    if (
      error.message ===
      "Only PDF files are allowed."
    ) {
      return res.status(400).json({
        message:
          "Only PDF files are allowed."
      });
    }

    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        message:
          "Resume must be 5 MB or smaller."
      });
    }

    res.status(500).json({
      message:
        error.message ||
        "Something went wrong."
    });
  }
);

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});