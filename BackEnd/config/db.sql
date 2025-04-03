DROP DATABASE IF EXISTS healthcare_service_db;
CREATE DATABASE IF NOT EXISTS healthcare_service_db;
USE healthcare_service_db;

-- Users table
CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash CHAR(60) NOT NULL, -- Optimized for bcrypt
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    dob DATE,
    gender ENUM('Male', 'Female') DEFAULT NULL,
    phone_number VARCHAR(15) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    profile_picture_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP DEFAULT NULL,
    last_login TIMESTAMP DEFAULT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    role ENUM('User', 'Admin', 'Doctor') DEFAULT 'User'
);

-- Indexes for performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_username ON users(username);

-- Doctors table
CREATE TABLE doctors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    license VARCHAR(255) UNIQUE NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_specialty ON doctors(specialty);

-- Health tracking table (can be large, consider partitioning)
CREATE TABLE health_tracking (
    tracking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    blood_pressure VARCHAR(50),
    heart_rate INT,
    blood_sugar DECIMAL(5,2),
    temperature DECIMAL(5,2),
    sleep_duration INT,
    calories_burned INT,
    exercise_data TEXT DEFAULT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_tracking_user ON health_tracking(user_id);

-- Categories table
CREATE TABLE categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL
);

-- Health articles
CREATE TABLE health_articles (
    article_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT UNSIGNED,
    category_id INT UNSIGNED,  
    publication_date DATE NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE INDEX idx_article_author ON health_articles(author_id);
CREATE INDEX idx_article_category ON health_articles(category_id);

-- Comments table
CREATE TABLE comments (
    comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    article_id INT UNSIGNED NOT NULL,	
    comment_content TEXT NOT NULL,
    count_likes INT DEFAULT 0,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES health_articles(article_id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_user ON comments(user_id);
CREATE INDEX idx_comment_article ON comments(article_id);

-- Questions table (Fix foreign key reference)
CREATE TABLE questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    question_text TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    status ENUM('pending', 'answered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_question_user ON questions(user_id);

-- Answers table
CREATE TABLE answers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    answered_by INT UNSIGNED NOT NULL,
    answer_text TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT TRUE,
    confidence_score DECIMAL(5,2) DEFAULT NULL,
    review_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (answered_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (review_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_answer_question ON answers(question_id);
CREATE INDEX idx_answer_user ON answers(answered_by);

-- Appointments table
CREATE TABLE appointments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('scheduled', 'completed', 'canceled') DEFAULT 'scheduled',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE INDEX idx_appointment_user ON appointments(user_id);
CREATE INDEX idx_appointment_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointment_date ON appointments(appointment_date);

-- Gamification table
CREATE TABLE gamification (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    challenge_name VARCHAR(255) NOT NULL,
    progress INT DEFAULT 0,
    status ENUM('ongoing', 'completed', 'failed') DEFAULT 'ongoing',
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_gamification_user ON gamification(user_id);

-- Leaderboards table
CREATE TABLE leaderboards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    points INT DEFAULT 0,
    ranking INT DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_leaderboard_user ON leaderboards(user_id);


CREATE TABLE forum_posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_user ON forum_posts(user_id);
CREATE INDEX idx_forum_title ON forum_posts(title);

CREATE TABLE forum_comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_comment_post ON forum_comments(post_id);
CREATE INDEX idx_forum_comment_user ON forum_comments(user_id);


CREATE TABLE forum_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL
);

CREATE INDEX idx_forum_category_name ON forum_categories(category_name);
ALTER TABLE forum_posts ADD COLUMN category_id INT UNSIGNED DEFAULT NULL,
ADD FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE SET NULL;

