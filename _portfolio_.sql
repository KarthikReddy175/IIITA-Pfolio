-- ============================================================
-- IIITAPfolio Database – Full Schema + Seed Data
-- Updated to reflect all schema changes
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ------------------------------------------------------------
-- Drop existing tables (FK-safe order)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `placement_drives`;
DROP TABLE IF EXISTS `companies`;
DROP TABLE IF EXISTS `admin_panel`;
DROP TABLE IF EXISTS `change_requests`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `academic_details`;
DROP TABLE IF EXISTS `non_academic_details`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `student_basic`;
DROP TABLE IF EXISTS `student_credentials`;
DROP TABLE IF EXISTS `admin_credentials`;
DROP TABLE IF EXISTS `review`;

-- ============================================================
-- TABLE: student_credentials
-- ============================================================
CREATE TABLE `student_credentials` (
  `UserName` varchar(20)  NOT NULL,
  `email`    varchar(30)  NOT NULL,
  `Password` varchar(200) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: student_basic
-- branch replaces old cur_cgpa column; CGPA lives in academic_details
-- ============================================================
CREATE TABLE `student_basic` (
  `name`         varchar(30)  NOT NULL,
  `role`         varchar(20)  NOT NULL,
  `about_me`     varchar(600) NOT NULL,
  `phone`        varchar(20)  NOT NULL,
  `email`        varchar(30)  NOT NULL,
  `address`      varchar(100) NOT NULL,
  `cur_sem`      varchar(30)  NOT NULL,
  `branch`       varchar(20)  NOT NULL,
  `ten_marks`    varchar(100) NOT NULL,
  `twelve_marks` varchar(100) NOT NULL,
  `linkedin`     varchar(100) DEFAULT NULL,
  `github`       varchar(100) DEFAULT NULL,
  `batch`        varchar(4)   DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: academic_details
-- C1-C4 store course/subject names (not semester CGPAs)
-- cur_cgpa stores the cumulative GPA (needs admin verification)
-- backlogs stores the number of active backlogs
-- ============================================================
CREATE TABLE `academic_details` (
  `email`    varchar(30)  NOT NULL,
  `cur_cgpa` varchar(20)  DEFAULT NULL,
  `backlogs` int(11)      DEFAULT 0,
  `C1`       varchar(100) DEFAULT NULL,
  `C2`       varchar(100) DEFAULT NULL,
  `C3`       varchar(100) DEFAULT NULL,
  `C4`       varchar(100) DEFAULT NULL,
  `aw1`      varchar(100) DEFAULT NULL,
  `aw2`      varchar(100) DEFAULT NULL,
  `aw3`      varchar(100) DEFAULT NULL,
  `pap1`     varchar(100) DEFAULT NULL,
  `pap2`     varchar(100) DEFAULT NULL,
  `pap3`     varchar(100) DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: non_academic_details
-- p1-p4  : "Project Name/Tech Stack/Live Link"
-- i1-i2  : "Company/Duration/Role"
-- ============================================================
CREATE TABLE `non_academic_details` (
  `email` varchar(30)  NOT NULL,
  `p1`    varchar(500) DEFAULT NULL,
  `p2`    varchar(500) DEFAULT NULL,
  `p3`    varchar(500) DEFAULT NULL,
  `p4`    varchar(500) DEFAULT NULL,
  `cp1`   varchar(100) DEFAULT NULL,
  `cp2`   varchar(100) DEFAULT NULL,
  `cpa1`  varchar(500) DEFAULT NULL,
  `cpa2`  varchar(500) DEFAULT NULL,
  `cpa3`  varchar(500) DEFAULT NULL,
  `ha1`   varchar(500) DEFAULT NULL,
  `ha2`   varchar(500) DEFAULT NULL,
  `cca1`  varchar(500) DEFAULT NULL,
  `cca2`  varchar(500) DEFAULT NULL,
  `cca3`  varchar(500) DEFAULT NULL,
  `cca4`  varchar(500) DEFAULT NULL,
  `cca5`  varchar(500) DEFAULT NULL,
  `i1`    varchar(500) DEFAULT NULL,
  `i2`    varchar(500) DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: skills  (plain skill names, up to 5)
-- ============================================================
CREATE TABLE `skills` (
  `one`   varchar(20) DEFAULT NULL,
  `two`   varchar(20) DEFAULT NULL,
  `three` varchar(20) DEFAULT NULL,
  `four`  varchar(20) DEFAULT NULL,
  `five`  varchar(20) DEFAULT NULL,
  `email` varchar(30) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: admin_credentials
-- ============================================================
CREATE TABLE `admin_credentials` (
  `UserName`  varchar(20)  NOT NULL,
  `email`     varchar(25)  NOT NULL,
  `Password`  varchar(100) NOT NULL,
  `Securityq` varchar(100) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: change_requests (verification workflow)
-- Stores proposed changes as JSON; admin reviews diff before approving
-- ============================================================
CREATE TABLE `change_requests` (
  `id`             int(11)      NOT NULL AUTO_INCREMENT,
  `email`          varchar(30)  NOT NULL,
  `req_type`       enum('academic','non_academic') NOT NULL,
  `proposed_data`  text         NOT NULL,
  `reason`         varchar(500) NOT NULL,
  `doc_link`       varchar(200) DEFAULT NULL,
  `status`         enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_remarks`  varchar(500) DEFAULT NULL,
  `created_at`     timestamp    DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at`    timestamp    NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE `notifications` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `recipient`  varchar(30)  NOT NULL,
  `type`       varchar(30)  NOT NULL,
  `title`      varchar(100) NOT NULL,
  `message`    varchar(500) NOT NULL,
  `is_read`    tinyint(1)   DEFAULT 0,
  `link`       varchar(200) DEFAULT NULL,
  `created_at` timestamp    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `recipient` (`recipient`),
  KEY `is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: review
-- ============================================================
CREATE TABLE `review` (
  `name`   varchar(30)  NOT NULL,
  `review` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE `companies` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `name`        varchar(100) NOT NULL,
  `website`     varchar(200) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `logo_url`    varchar(300) DEFAULT NULL,
  `created_at`  timestamp    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: placement_drives
-- ============================================================
CREATE TABLE `placement_drives` (
  `id`              int(11)      NOT NULL AUTO_INCREMENT,
  `company_id`      int(11)      NOT NULL,
  `role`            varchar(100) NOT NULL,
  `package_lpa`     varchar(50)  DEFAULT NULL,
  `description`     varchar(1000) DEFAULT NULL,
  `min_cgpa`        decimal(4,2) DEFAULT 0.00,
  `max_backlogs`    int(11)      DEFAULT 0,
  `eligible_branches` varchar(100) DEFAULT 'IT,ECE,IT-BI',
  `drive_date`      date         DEFAULT NULL,
  `last_date_apply` date         DEFAULT NULL,
  `status`          enum('upcoming','active','completed','cancelled') DEFAULT 'upcoming',
  `created_at`      timestamp    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: applications
-- ============================================================
CREATE TABLE `applications` (
  `id`         int(11)     NOT NULL AUTO_INCREMENT,
  `drive_id`   int(11)     NOT NULL,
  `email`      varchar(30) NOT NULL,
  `status`     enum('applied','shortlisted','selected','rejected') DEFAULT 'applied',
  `applied_at` timestamp   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_application` (`drive_id`, `email`),
  KEY `drive_id` (`drive_id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================
ALTER TABLE `academic_details`
  ADD CONSTRAINT `academic_details_ibfk_1`
  FOREIGN KEY (`email`) REFERENCES `student_credentials` (`email`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `change_requests`
  ADD CONSTRAINT `change_requests_ibfk_1`
  FOREIGN KEY (`email`) REFERENCES `student_credentials` (`email`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `non_academic_details`
  ADD CONSTRAINT `non_academic_details_ibfk_1`
  FOREIGN KEY (`email`) REFERENCES `student_credentials` (`email`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `skills`
  ADD CONSTRAINT `skills_ibfk_1`
  FOREIGN KEY (`email`) REFERENCES `student_credentials` (`email`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `student_basic`
  ADD CONSTRAINT `student_basic_ibfk_1`
  FOREIGN KEY (`email`) REFERENCES `student_credentials` (`email`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `placement_drives`
  ADD CONSTRAINT `placement_drives_ibfk_1`
  FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1`
  FOREIGN KEY (`drive_id`) REFERENCES `placement_drives` (`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_2`
  FOREIGN KEY (`email`) REFERENCES `student_credentials` (`email`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- ============================================================
-- SEED DATA – Admin
-- ============================================================
INSERT INTO `admin_credentials` (`UserName`, `email`, `Password`, `Securityq`) VALUES
('karthik', 'iec2022116@iiita.ac.in', 'Karthik@2004', 'karthik');

-- ============================================================
-- SEED DATA – Reviews
-- ============================================================
INSERT INTO `review` (`name`, `review`) VALUES
('Amar',  'Very useful site for students of IIITA'),
('Rahul', 'Good experience'),
('Priya', 'Nice'),
('Arjun', 'Amazing');

-- ============================================================
-- SEED DATA – 5 ECE Sem-8 students  (password: 12345678)
-- ============================================================
INSERT INTO `student_credentials` (`UserName`, `email`, `Password`) VALUES
('Arjun Sharma', 'iec2022001@iiita.ac.in', '$2a$08$..dNT4bMZKKQO8FYfqryBeoK/PR7dx3qoZY5r48AaZxOaliPIuR2i'),
('Priya Verma',  'iec2022002@iiita.ac.in', '$2a$08$..dNT4bMZKKQO8FYfqryBeoK/PR7dx3qoZY5r48AaZxOaliPIuR2i'),
('Rohan Mehta',  'iec2022003@iiita.ac.in', '$2a$08$..dNT4bMZKKQO8FYfqryBeoK/PR7dx3qoZY5r48AaZxOaliPIuR2i'),
('Sneha Gupta',  'iec2022004@iiita.ac.in', '$2a$08$..dNT4bMZKKQO8FYfqryBeoK/PR7dx3qoZY5r48AaZxOaliPIuR2i'),
('Vikram Nair',  'iec2022005@iiita.ac.in', '$2a$08$..dNT4bMZKKQO8FYfqryBeoK/PR7dx3qoZY5r48AaZxOaliPIuR2i');

INSERT INTO `student_basic` (`name`, `role`, `about_me`, `phone`, `email`, `address`, `cur_sem`, `branch`, `ten_marks`, `twelve_marks`, `linkedin`, `github`) VALUES
('Arjun Sharma', 'Embedded Engineer',  'ECE final year student at IIITA passionate about embedded systems and IoT. Love building hardware-software integrated projects.', '9876543210', 'iec2022001@iiita.ac.in', 'Allahabad, UP',     'Semester 8', 'ECE', '92%', '88%', 'https://linkedin.com/in/arjunsharma', 'https://github.com/arjunsharma'),
('Priya Verma',  'VLSI Engineer',      'Enthusiastic ECE student specialising in VLSI and digital design. Intern at Texas Instruments.',                                    '9876543211', 'iec2022002@iiita.ac.in', 'Lucknow, UP',      'Semester 8', 'ECE', '95%', '93%', 'https://linkedin.com/in/priyaverma',  'https://github.com/priyaverma'),
('Rohan Mehta',  'Full Stack Dev',     'ECE undergrad with strong interest in web development and cloud computing. GSoC 2024 contributor.',                                '9876543212', 'iec2022003@iiita.ac.in', 'Jaipur, Rajasthan','Semester 8', 'ECE', '90%', '87%', 'https://linkedin.com/in/rohanmehta',  'https://github.com/rohanmehta'),
('Sneha Gupta',  'DSP Researcher',     'Final year ECE student focused on DSP and machine learning for signal analysis. Published in IEEE.',                               '9876543213', 'iec2022004@iiita.ac.in', 'Kanpur, UP',       'Semester 8', 'ECE', '97%', '95%', 'https://linkedin.com/in/snehagupta',  'https://github.com/snehagupta'),
('Vikram Nair',  'RF Comm Engineer',   'Passionate about wireless communication and antenna design. Interned at ISRO in summer 2024.',                                    '9876543214', 'iec2022005@iiita.ac.in', 'Kochi, Kerala',    'Semester 8', 'ECE', '88%', '85%', 'https://linkedin.com/in/vikramnair',  'https://github.com/vikramnair');

INSERT INTO `academic_details` (`email`, `cur_cgpa`, `backlogs`, `C1`, `C2`, `C3`, `C4`, `aw1`, `aw2`, `aw3`, `pap1`, `pap2`, `pap3`) VALUES
('iec2022001@iiita.ac.in', '8.4', 0,
 'Embedded Systems', 'Digital Signal Processing', 'Microcontroller Programming', 'IoT and Wireless Networks',
 'Best Project Award IIITA 2023', 'Smart India Hackathon Finalist', 'Merit Scholarship 2022',
 'IoT-Based Smart Grid Monitoring', NULL, NULL),
('iec2022002@iiita.ac.in', '9.1', 0,
 'VLSI Design', 'Digital Electronics', 'Analog Circuits', 'Semiconductor Devices',
 'Gold Medal IIITA Annual Day 2023', 'Best Intern Texas Instruments 2024', 'Academic Excellence Award 2023',
 'Low Power SRAM Design for Edge Devices', 'Comparative Study FinFET vs CMOS', NULL),
('iec2022003@iiita.ac.in', '8.7', 1,
 'Data Structures', 'Web Technologies', 'Cloud Computing', 'Operating Systems',
 'Open Source Contributor Award 2024', 'Hackathon Winner HackIIIT 2023', NULL,
 'Serverless Architecture for Real-Time Apps', NULL, NULL),
('iec2022004@iiita.ac.in', '9.3', 0,
 'Digital Signal Processing', 'Machine Learning', 'Biomedical Signal Processing', 'Linear Algebra',
 'Best Research Paper IEEE ICSP 2024', 'Director Gold Medal 2023', 'National Scholarship Higher Education',
 'Deep Learning for ECG Arrhythmia Detection', 'Noise Cancellation using Adaptive Filters', 'Wavelet Transform for Biomedical Signals'),
('iec2022005@iiita.ac.in', '8.2', 2,
 'Antenna Design', 'RF and Microwave Engineering', 'Electromagnetic Waves', 'Satellite Communication',
 'ISRO Summer Research Fellowship 2024', 'Best Antenna Design IEEE 2023', NULL,
 'Compact Microstrip Patch Antenna for 5G', NULL, NULL);

-- non_academic projects: "Name/TechStack/LiveLink"  internships: "Company/Duration/Role"
INSERT INTO `non_academic_details` (`email`, `p1`, `p2`, `p3`, `p4`, `cp1`, `cp2`, `cpa1`, `cpa2`, `cpa3`, `ha1`, `ha2`, `cca1`, `cca2`, `cca3`, `cca4`, `cca5`, `i1`, `i2`) VALUES
('iec2022001@iiita.ac.in',
 'Smart Home Automation/Raspberry Pi, MQTT, Python/https://github.com/arjunsharma/smarthome',
 'Wireless Health Monitor/ESP32, BLE, Arduino/https://github.com/arjunsharma/healthmonitor',
 'Automated Irrigation System/IoT Sensors, NodeMCU/https://github.com/arjunsharma/irrigation',
 NULL,
 'https://leetcode.com/arjunsharma', 'https://codeforces.com/profile/arjunsharma',
 'LeetCode 300+ problems solved', 'Codeforces Specialist rated', NULL,
 'Smart India Hackathon 2023 – Finalist', 'HackIIIT 2022 – Runner Up',
 'Member - Robotics Club IIITA', 'Volunteer - NSS IIITA', NULL, NULL, NULL,
 'Bosch India/May–Jul 2024/Hardware Engineer Intern', NULL),
('iec2022002@iiita.ac.in',
 '32-bit ALU Synthesis in Verilog/Verilog, Cadence/https://github.com/priyaverma/alu',
 '4-bit Carry Lookahead Adder on FPGA/VHDL, Xilinx ISE/https://github.com/priyaverma/fpga',
 'Static Timing Analysis Tool/Python, Cadence Virtuoso/https://github.com/priyaverma/sta',
 NULL,
 'https://leetcode.com/priyaverma', 'https://hackerrank.com/priyaverma',
 'LeetCode 400+ problems solved', 'HackerRank 5-star in Problem Solving', NULL,
 'IEEE CASS Hackathon 2023 – Winner', NULL,
 'Secretary - IEEE Student Branch IIITA', 'Member - VLSI Design Club', NULL, NULL, NULL,
 'Texas Instruments/May–Jul 2024/VLSI Design Intern', 'Intel/Dec 2023/ASIC Verification Intern'),
('iec2022003@iiita.ac.in',
 'Full Stack E-Commerce Platform/React, Node.js, MySQL/https://github.com/rohanmehta/ecommerce',
 'Real-Time Chat App/WebSockets, Node.js, MongoDB/https://github.com/rohanmehta/chat',
 'ML-Based Stock Price Predictor/Python, TensorFlow, Flask/https://github.com/rohanmehta/stockml',
 'Serverless REST API/AWS Lambda, API Gateway, DynamoDB/https://github.com/rohanmehta/serverless',
 'https://leetcode.com/rohanmehta', 'https://github.com/rohanmehta',
 'LeetCode 600+ problems solved', 'GSoC 2024 Contributor – NumFOCUS', NULL,
 'HackIIIT 2023 – Winner', 'MLH Hackathon 2024 – Top 10',
 'Core Member - Coding Club IIITA', 'GSoC 2024 Contributor NumFOCUS', NULL, NULL, NULL,
 'Flipkart/May–Jul 2024/SDE Intern', NULL),
('iec2022004@iiita.ac.in',
 'ECG Arrhythmia Detection using CNN/Python, TensorFlow, Keras/https://github.com/snehagupta/ecg',
 'Noise Cancellation Headset Prototype/MATLAB, DSP Processor/https://github.com/snehagupta/noise',
 'Sleep Stage Classification with EEG/Python, scikit-learn/https://github.com/snehagupta/eeg',
 NULL,
 'https://kaggle.com/snehagupta', 'https://researchgate.net/profile/snehagupta',
 'Kaggle Expert – Top 10% globally', 'IEEE ICSP 2024 Best Paper Award', NULL,
 'IEEE ICSP 2024 – Best Paper Award', 'Smart India Hackathon 2023 – Winner',
 'President - IEEE IIITA Student Branch', 'Member - AI Research Group IIITA', 'Cultural Head - Effervescence 2023', NULL, NULL,
 'IIT Kanpur DSP Lab/May–Jul 2024/Research Intern', 'Samsung R&D/Dec 2023/Signal Processing Intern'),
('iec2022005@iiita.ac.in',
 'Microstrip Patch Antenna for 5G/CST Studio Suite, MATLAB/https://github.com/vikramnair/antenna',
 'Satellite Link Budget Analysis Tool/Python, MATLAB/https://github.com/vikramnair/satellite',
 'SDR-Based FM Receiver/GNU Radio, Python/https://github.com/vikramnair/sdr',
 NULL,
 'https://hackerearth.com/vikramnair', 'https://leetcode.com/vikramnair',
 'IEEE AP-S Student Design Contest – Finalist', 'HackerEarth Bronze Badge', NULL,
 'IEEE AP-S Student Design Contest 2023 – Finalist', NULL,
 'Member - Astronomy Club IIITA', 'Volunteer - IEEE IIITA', NULL, NULL, NULL,
 'ISRO VSSC/May–Jul 2024/RF Engineer Intern', NULL);

INSERT INTO `skills` (`one`, `two`, `three`, `four`, `five`, `email`) VALUES
('C Embedded',  'Python',      'MATLAB',      'FreeRTOS',   'KiCad',      'iec2022001@iiita.ac.in'),
('Verilog',     'VLSI Design', 'Cadence',     'Python',     'MATLAB',     'iec2022002@iiita.ac.in'),
('JavaScript',  'React',       'Node.js',     'AWS',        'Python',     'iec2022003@iiita.ac.in'),
('Python',      'MATLAB',      'TensorFlow',  'R',          'Signal Proc','iec2022004@iiita.ac.in'),
('MATLAB',      'CST Studio',  'Python',      'GNU Radio',  'Ansys HFSS', 'iec2022005@iiita.ac.in');

-- ============================================================
-- SEED DATA – Companies
-- ============================================================
INSERT INTO `companies` (`name`, `website`, `description`) VALUES
('Google India', 'https://careers.google.com', 'Leading technology company specializing in internet-related services and products.'),
('Microsoft', 'https://careers.microsoft.com', 'Global technology corporation developing software, hardware, and cloud services.'),
('Texas Instruments', 'https://careers.ti.com', 'Semiconductor company designing and manufacturing analog and embedded processing chips.'),
('Flipkart', 'https://www.flipkart.com/careers', 'India''s leading e-commerce marketplace.'),
('ISRO', 'https://www.isro.gov.in', 'Indian Space Research Organisation – India''s premier space agency.');

-- ============================================================
-- SEED DATA – Placement Drives
-- ============================================================
INSERT INTO `placement_drives` (`company_id`, `role`, `package_lpa`, `description`, `min_cgpa`, `max_backlogs`, `eligible_branches`, `drive_date`, `last_date_apply`, `status`) VALUES
(1, 'Software Engineer', '25 LPA', 'Full-time SDE role working on Google Cloud Platform.', 8.00, 0, 'IT,ECE,IT-BI', '2026-06-15', '2026-06-01', 'active'),
(2, 'SDE Intern', '12 LPA', 'Summer internship with possibility of PPO.', 7.50, 0, 'IT,ECE,IT-BI', '2026-06-20', '2026-06-10', 'active'),
(3, 'Analog Design Engineer', '18 LPA', 'Work on next-gen analog IC design.', 7.00, 1, 'ECE', '2026-07-01', '2026-06-20', 'upcoming'),
(4, 'Backend Developer', '15 LPA', 'Backend engineering role for supply chain systems.', 7.00, 0, 'IT,IT-BI', '2026-05-20', '2026-05-15', 'active'),
(5, 'Scientist/Engineer SC', '10 LPA', 'Work on satellite communication systems.', 7.50, 0, 'ECE', '2026-08-01', '2026-07-15', 'upcoming');

-- ============================================================
-- SEED DATA – 5 IT Sem-8 students  (password: 12345678)
-- ============================================================
INSERT INTO `student_credentials` (`UserName`, `email`, `Password`) VALUES
('Rahul Kumar',   'iit2022001@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG'),
('Anjali Singh',  'iit2022002@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG'),
('Harsh Verma',   'iit2022003@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG'),
('Divya Sharma',  'iit2022004@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG'),
('Siddharth Rao', 'iit2022005@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG');

INSERT INTO `student_basic` (`name`, `role`, `about_me`, `phone`, `email`, `address`, `cur_sem`, `branch`, `ten_marks`, `twelve_marks`, `linkedin`, `github`) VALUES
('Rahul Kumar',   'Backend Engineer',  'IT final year student at IIITA passionate about distributed systems and microservices. Strong in Java and Spring Boot.',                  '9812345001', 'iit2022001@iiita.ac.in', 'Varanasi, UP',      'Semester 8', 'IT', '91%', '89%', 'https://linkedin.com/in/rahulkumar',   'https://github.com/rahulkumar'),
('Anjali Singh',  'Full Stack Dev',    'IT student who loves building end-to-end web applications. React and Node.js enthusiast with a flair for UI/UX design.',                '9812345002', 'iit2022002@iiita.ac.in', 'Noida, UP',         'Semester 8', 'IT', '94%', '92%', 'https://linkedin.com/in/anjalisingh',  'https://github.com/anjalisingh'),
('Harsh Verma',   'DevOps Engineer',   'Cloud and DevOps focused IT student. AWS Certified Cloud Practitioner. Experienced with Docker, Kubernetes, and CI/CD pipelines.',    '9812345003', 'iit2022003@iiita.ac.in', 'Agra, UP',          'Semester 8', 'IT', '88%', '86%', 'https://linkedin.com/in/harshverma',   'https://github.com/harshverma'),
('Divya Sharma',  'ML Engineer',       'IT undergrad with deep interest in machine learning and NLP. Kaggle Competitions Master. Research intern at IIT Bombay.',              '9812345004', 'iit2022004@iiita.ac.in', 'Prayagraj, UP',     'Semester 8', 'IT', '96%', '94%', 'https://linkedin.com/in/divyasharma',  'https://github.com/divyasharma'),
('Siddharth Rao', 'Software Engineer', 'Full-stack developer and competitive programmer. Solved 800+ problems on LeetCode. Google Summer of Code 2024 contributor.',          '9812345005', 'iit2022005@iiita.ac.in', 'Hyderabad, TS',     'Semester 8', 'IT', '93%', '91%', 'https://linkedin.com/in/siddharthrao', 'https://github.com/siddharthrao');

INSERT INTO `academic_details` (`email`, `cur_cgpa`, `backlogs`, `C1`, `C2`, `C3`, `C4`, `aw1`, `aw2`, `aw3`, `pap1`, `pap2`, `pap3`) VALUES
('iit2022001@iiita.ac.in', '8.6', 0,
 'Advanced Data Structures', 'Distributed Systems', 'Database Management', 'Software Engineering',
 'Best Project Award IIITA 2023', 'Dean Merit List 2022-23', 'Merit Scholarship 2022',
 'Scalable Microservices with Spring Boot and Kafka', NULL, NULL),
('iit2022002@iiita.ac.in', '9.0', 0,
 'Web Technologies', 'Human-Computer Interaction', 'Database Systems', 'Algorithms',
 'Best UI/UX Design Award HackIIIT 2023', 'Academic Excellence 2023', 'Women in Tech Scholarship',
 'Accessible Web Design Patterns for Visually Impaired', 'Performance Optimization in React SPAs', NULL),
('iit2022003@iiita.ac.in', '8.3', 1,
 'Cloud Computing', 'Operating Systems', 'Computer Networks', 'System Design',
 'AWS Certified Cloud Practitioner', 'HackIIIT 2023 – Best DevOps Project', NULL,
 'Auto-Scaling Kubernetes Clusters on AWS EKS', NULL, NULL),
('iit2022004@iiita.ac.in', '9.4', 0,
 'Machine Learning', 'Natural Language Processing', 'Data Mining', 'Linear Algebra & Probability',
 'Director Gold Medal 2023', 'Kaggle Competition Master Rank', 'National Talent Search Scholar',
 'Transformer-Based Hindi Sentiment Analysis', 'Federated Learning for Privacy-Preserving ML', 'Attention Mechanisms Survey in NLP'),
('iit2022005@iiita.ac.in', '8.9', 0,
 'Algorithms & Complexity', 'Compiler Design', 'Systems Programming', 'Computer Architecture',
 'ICPC Regionalist 2023', 'GSoC 2024 Contributor Award', 'Coding Club Best Programmer 2023',
 'Efficient Garbage Collection in JVM – A Comparative Study', NULL, NULL);

INSERT INTO `non_academic_details` (`email`, `p1`, `p2`, `p3`, `p4`, `cp1`, `cp2`, `cpa1`, `cpa2`, `cpa3`, `ha1`, `ha2`, `cca1`, `cca2`, `cca3`, `cca4`, `cca5`, `i1`, `i2`) VALUES
('iit2022001@iiita.ac.in',
 'Distributed Task Scheduler/Java, Spring Boot, Kafka, Redis/https://github.com/rahulkumar/scheduler',
 'Real-Time Leaderboard System/Node.js, Redis, WebSockets/https://github.com/rahulkumar/leaderboard',
 'URL Shortener with Analytics/Go, PostgreSQL, Docker/https://github.com/rahulkumar/urlshort',
 NULL,
 'https://leetcode.com/rahulkumar', 'https://codeforces.com/profile/rahulkumar',
 'LeetCode 500+ problems, Top 5% globally', 'Codeforces Expert rated (1600+)', NULL,
 'HackIIIT 2023 – Winner', 'Flipkart Grid 5.0 – Shortlisted',
 'Core Member - Coding Club IIITA', 'Placement Coordinator IIITA 2024', NULL, NULL, NULL,
 'Amazon/May–Jul 2024/SDE Intern', 'Paytm/Dec 2023/Backend Intern'),
('iit2022002@iiita.ac.in',
 'Portfolio Builder SaaS/React, Node.js, MongoDB, Cloudinary/https://github.com/anjalisingh/portfoliobuilder',
 'Collaborative Whiteboard App/Canvas API, WebSockets, React/https://github.com/anjalisingh/whiteboard',
 'Recipe Recommendation Engine/Python, Flask, ML, MySQL/https://github.com/anjalisingh/recipeml',
 'E-Learning Platform/Next.js, Prisma, PostgreSQL/https://github.com/anjalisingh/elearn',
 'https://leetcode.com/anjalisingh', 'https://github.com/anjalisingh',
 'LeetCode 350+ problems solved', 'GitHub Arctic Code Vault Contributor 2023', NULL,
 'HackIIIT 2023 – Best UI/UX Award', 'MLH Global Hack Week 2024 – Participant',
 'Head of Design - Coding Club IIITA', 'Organiser - Effervescence 2023 Tech Fest', 'Member - WiCS IIITA', NULL, NULL,
 'Adobe/May–Jul 2024/Frontend Intern', NULL),
('iit2022003@iiita.ac.in',
 'Infrastructure as Code Framework/Terraform, AWS, Python/https://github.com/harshverma/iac',
 'CI/CD Pipeline Automation Tool/Jenkins, Docker, K8s, Bash/https://github.com/harshverma/cicd',
 'Log Aggregation Platform/ELK Stack, Golang, Kafka/https://github.com/harshverma/logagg',
 NULL,
 'https://leetcode.com/harshverma', 'https://hackerrank.com/harshverma',
 'LeetCode 280+ problems solved', 'AWS Certified Cloud Practitioner 2024', NULL,
 'HackIIIT 2023 – Best DevOps Project', 'DevOps Days India 2024 – Speaker',
 'Core Member - Cloud Computing Club IIITA', 'Technical Writer - IIITA Tech Blog', NULL, NULL, NULL,
 'Infosys/May–Jul 2024/DevOps Intern', 'Capgemini/Dec 2023/Cloud Intern'),
('iit2022004@iiita.ac.in',
 'Hindi Sentiment Analyser/Python, Transformers, FastAPI/https://github.com/divyasharma/hsa',
 'Medical Report Summariser/BERT, Hugging Face, Flask/https://github.com/divyasharma/medsum',
 'Fake News Detector/Python, NLP, scikit-learn/https://github.com/divyasharma/fakenews',
 'Real-Time Sign Language Translator/MediaPipe, TensorFlow, OpenCV/https://github.com/divyasharma/slt',
 'https://kaggle.com/divyasharma', 'https://github.com/divyasharma',
 'Kaggle Competitions Master – Top 1% globally', 'Best Research Paper IIITA Symposium 2024', NULL,
 'Smart India Hackathon 2023 – National Winner', 'Kaggle Uttarakhand ML Competition – 1st Place',
 'President - AI/ML Club IIITA', 'Research Assistant – NLP Lab IIITA', 'Member - Google Developer Student Club', NULL, NULL,
 'IIT Bombay AI Lab/May–Jul 2024/Research Intern', 'Swiggy/Dec 2023/ML Intern'),
('iit2022005@iiita.ac.in',
 'Mini Compiler for C-subset/C++, LLVM IR/https://github.com/siddharthrao/minicompiler',
 'Concurrent Key-Value Store/Rust, lock-free data structures/https://github.com/siddharthrao/kvstore',
 'Online Judge Platform/Django, Celery, Docker, Redis/https://github.com/siddharthrao/onlinejudge',
 'Git Internals from Scratch/Go/https://github.com/siddharthrao/mygit',
 'https://leetcode.com/siddharthrao', 'https://codeforces.com/profile/siddharthrao',
 'LeetCode 800+ problems, Guardian badge', 'ICPC Asia Regionalist 2023', 'GSoC 2024 Contributor – CPython',
 'ICPC Asia Amritapuri Regionalist 2023', 'HackIIIT 2023 – Algorithmic Challenge Winner',
 'Captain - Competitive Programming Team IIITA', 'Core Team - ACM IIITA', 'Mentor - Coding Club IIITA', NULL, NULL,
 'Google/May–Jul 2024/SWE Intern', 'Microsoft/Dec 2023/SDE Intern');

INSERT INTO `skills` (`one`, `two`, `three`, `four`, `five`, `email`) VALUES
('Java',       'Spring Boot', 'Kafka',        'PostgreSQL',  'Docker',    'iit2022001@iiita.ac.in'),
('React',      'Node.js',     'MongoDB',      'TypeScript',  'Figma',     'iit2022002@iiita.ac.in'),
('AWS',        'Kubernetes',  'Terraform',    'Docker',      'Go',        'iit2022003@iiita.ac.in'),
('Python',     'TensorFlow',  'NLP',          'PyTorch',     'FastAPI',   'iit2022004@iiita.ac.in'),
('C++',        'Rust',        'Go',           'Algorithms',  'Python',    'iit2022005@iiita.ac.in');

-- ============================================================
-- SEED DATA – 2 IT-BI Sem-8 students  (password: 12345678)
-- ============================================================
INSERT INTO `student_credentials` (`UserName`, `email`, `Password`) VALUES
('Neha Agarwal', 'iib2022001@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG'),
('Akash Tiwari', 'iib2022002@iiita.ac.in', '$2a$08$2Hc6RbTIb7E0t/zuJGGKfenNBkXTRH/zMpDQzvt94yE1yzwe3hsxG');

INSERT INTO `student_basic` (`name`, `role`, `about_me`, `phone`, `email`, `address`, `cur_sem`, `branch`, `ten_marks`, `twelve_marks`, `linkedin`, `github`) VALUES
('Neha Agarwal', 'Data Analyst',      'IT-BI student at IIITA specialising in business intelligence and data analytics. Passionate about turning raw data into actionable insights using SQL, Python and Power BI.', '9812345006', 'iib2022001@iiita.ac.in', 'Lucknow, UP',  'Semester 8', 'IT-BI', '93%', '91%', 'https://linkedin.com/in/nehaagarwal',  'https://github.com/nehaagarwal'),
('Akash Tiwari', 'Business Analyst',  'IT-BI final year student with expertise in ERP systems, data warehousing and predictive analytics. Interned at Deloitte and TCS.',                                          '9812345007', 'iib2022002@iiita.ac.in', 'Kanpur, UP',   'Semester 8', 'IT-BI', '90%', '88%', 'https://linkedin.com/in/akashtiwari',  'https://github.com/akashtiwari');

INSERT INTO `academic_details` (`email`, `cur_cgpa`, `backlogs`, `C1`, `C2`, `C3`, `C4`, `aw1`, `aw2`, `aw3`, `pap1`, `pap2`, `pap3`) VALUES
('iib2022001@iiita.ac.in', '9.1', 0,
 'Business Intelligence', 'Data Warehousing & Mining', 'Statistics for Data Science', 'Database Management',
 'Best BI Project Award IIITA 2023', 'Academic Excellence Award 2023', 'Women in Data Science Scholarship',
 'Customer Churn Prediction using Ensemble Methods', 'Real-Time Sales Dashboard with Power BI', NULL),
('iib2022002@iiita.ac.in', '8.5', 0,
 'Enterprise Resource Planning', 'Supply Chain Analytics', 'Predictive Modelling', 'Business Process Management',
 'Best Capstone Project IIITA 2024', 'Deloitte Analytics Champion 2024', NULL,
 'Demand Forecasting in Retail using LSTM Networks', NULL, NULL);

INSERT INTO `non_academic_details` (`email`, `p1`, `p2`, `p3`, `p4`, `cp1`, `cp2`, `cpa1`, `cpa2`, `cpa3`, `ha1`, `ha2`, `cca1`, `cca2`, `cca3`, `cca4`, `cca5`, `i1`, `i2`) VALUES
('iib2022001@iiita.ac.in',
 'Sales Analytics Dashboard/Power BI, SQL, Python/https://github.com/nehaagarwal/sales-dashboard',
 'Customer Churn Predictor/Python, scikit-learn, Streamlit/https://github.com/nehaagarwal/churnpredictor',
 'Market Basket Analysis Tool/Python, Pandas, Apriori Algorithm/https://github.com/nehaagarwal/mba',
 NULL,
 'https://kaggle.com/nehaagarwal', 'https://www.hackerrank.com/nehaagarwal',
 'Kaggle Expert in Data Analytics', 'HackerRank 5-star SQL', NULL,
 'DataHack Analytics Hackathon 2023 – Runner Up', 'Smart India Hackathon 2024 – Finalist',
 'President - Data Science Club IIITA', 'Member - Women in STEM IIITA', NULL, NULL, NULL,
 'Accenture/May–Jul 2024/Data Analyst Intern', 'HDFC Bank/Dec 2023/BI Intern'),
('iib2022002@iiita.ac.in',
 'ERP Dashboard for SMEs/SAP Fiori, ABAP, SQL/https://github.com/akashtiwari/erp-dashboard',
 'Demand Forecasting Engine/Python, LSTM, Prophet, FastAPI/https://github.com/akashtiwari/demand-forecast',
 'Supply Chain Risk Analyser/Python, NetworkX, Tableau/https://github.com/akashtiwari/scra',
 NULL,
 'https://leetcode.com/akashtiwari', 'https://kaggle.com/akashtiwari',
 'LeetCode 200+ SQL problems solved', 'Kaggle Notebook Expert', NULL,
 'Deloitte Analytics Challenge 2024 – Winner', 'IIM Lucknow Case Study Competition – Top 5',
 'Core Member - Business Analytics Club IIITA', 'Volunteer - Consultancy Cell IIITA', NULL, NULL, NULL,
 'Deloitte/May–Jul 2024/Business Analyst Intern', 'TCS/Dec 2023/ERP Consultant Intern');

INSERT INTO `skills` (`one`, `two`, `three`, `four`, `five`, `email`) VALUES
('Python',     'Power BI',    'SQL',          'Tableau',     'Excel',     'iib2022001@iiita.ac.in'),
('SAP',        'SQL',         'Python',       'Tableau',     'Excel',     'iib2022002@iiita.ac.in');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
