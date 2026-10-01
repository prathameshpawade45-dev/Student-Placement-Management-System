CREATE DATABASE IF NOT EXISTS placement_db;
USE placement_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  course VARCHAR(100) NOT NULL,
  year VARCHAR(30) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  location VARCHAR(150) NOT NULL,
  package_lpa DECIMAL(6,2) NOT NULL,
  eligibility_cgpa DECIMAL(3,2) NOT NULL,
  drive_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  status ENUM('Applied','Shortlisted','Selected','Rejected') DEFAULT 'Applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_application (user_id, company_id),
  CONSTRAINT fk_application_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_application_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

INSERT INTO companies (name, description, location, package_lpa, eligibility_cgpa, drive_date)
SELECT 'TechNova Solutions', 'Software development and analytics roles.', 'Navi Mumbai', 6.50, 7.00, '2026-10-15'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='TechNova Solutions');

INSERT INTO companies (name, description, location, package_lpa, eligibility_cgpa, drive_date)
SELECT 'DataSphere Analytics', 'Data analyst and business intelligence roles.', 'Mumbai', 7.20, 7.50, '2026-10-22'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='DataSphere Analytics');

INSERT INTO companies (name, description, location, package_lpa, eligibility_cgpa, drive_date)
SELECT 'CodeBridge Pvt Ltd', 'Full-stack developer and QA roles.', 'Pune', 5.80, 6.50, '2026-11-05'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='CodeBridge Pvt Ltd');
