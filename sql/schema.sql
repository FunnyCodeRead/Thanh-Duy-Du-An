CREATE DATABASE IF NOT EXISTS ai_recruitment
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ai_recruitment;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'HR', 'MANAGER') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    description TEXT,
    requirements TEXT,
    skills TEXT,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_jobs_title (title),
    INDEX idx_jobs_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    skills TEXT,
    experience TEXT,
    education TEXT,
    source ENUM('FACEBOOK', 'LINKEDIN', 'WEBSITE', 'REFERRAL', 'JOB_SITE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    cv_file VARCHAR(255),
    cv_text LONGTEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_candidates_full_name (full_name),
    INDEX idx_candidates_email (email),
    INDEX idx_candidates_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    status ENUM('NEW', 'SCREENING', 'INTERVIEW', 'PASSED', 'REJECTED') NOT NULL DEFAULT 'NEW',
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    CONSTRAINT uq_applications_candidate_job UNIQUE (candidate_id, job_id),
    CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_applications_job (job_id),
    INDEX idx_applications_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED NOT NULL,
    interviewer_id INT UNSIGNED NOT NULL,
    interview_date DATETIME NOT NULL,
    location VARCHAR(255),
    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviews_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_interviews_interviewer FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_interviews_date (interview_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evaluations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED NOT NULL,
    evaluator_id INT UNSIGNED NOT NULL,
    technical_score TINYINT UNSIGNED NOT NULL,
    communication_score TINYINT UNSIGNED NOT NULL,
    experience_score TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_evaluations_technical CHECK (technical_score BETWEEN 1 AND 5),
    CONSTRAINT chk_evaluations_communication CHECK (communication_score BETWEEN 1 AND 5),
    CONSTRAINT chk_evaluations_experience CHECK (experience_score BETWEEN 1 AND 5),
    CONSTRAINT fk_evaluations_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_evaluations_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_results (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED NOT NULL,
    type ENUM('CV_SUMMARY', 'INTERVIEW_QUESTION', 'EMAIL') NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_results_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
