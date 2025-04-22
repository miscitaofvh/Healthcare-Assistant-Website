DROP DATABASE IF EXISTS healthcare_service_db;
CREATE DATABASE IF NOT EXISTS healthcare_service_db;
USE healthcare_service_db;

-- ========== USERS ==========
CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    dob DATE,
    gender ENUM('Male', 'Female') DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    profile_picture_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP DEFAULT NULL,
    last_login TIMESTAMP DEFAULT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    role ENUM('User', 'Admin', 'Doctor', 'Moderator') DEFAULT 'User'
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_username ON users(username);

-- ========== DOCTORS ==========
CREATE TABLE doctors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    license VARCHAR(50) UNIQUE NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_specialty ON doctors(specialty);

-- ========== HEALTH TRACKING ==========
CREATE TABLE health_tracking (
    tracking_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
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

-- ========== APPOINTMENTS ==========
CREATE TABLE appointments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
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

-- ========== ARTICLE CATEGORIES ==========
CREATE TABLE article_categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_name ON article_categories(category_name);

-- ========== ARTICLE TAGS ==========
CREATE TABLE article_tags (
    tag_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_article_tag_article ON article_tags(tag_id);

-- ========== ARTICLES ==========
CREATE TABLE article (
    article_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id CHAR(36) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    tag_id INT UNSIGNED DEFAULT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    view_count INT UNSIGNED DEFAULT 0,
    like_count INT UNSIGNED DEFAULT 0,
    comment_count INT UNSIGNED DEFAULT 0,
    publication_date DATE NOT NULL,
    image_url VARCHAR(2083) DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES article_categories(category_id) ON DELETE CASCADE
);

CREATE INDEX idx_article_author ON article(author_id);
CREATE INDEX idx_article_category ON article(category_id);
CREATE INDEX idx_article_date ON article(publication_date);
CREATE FULLTEXT INDEX idx_article_search ON article(title, content);

-- ========== ARTICLE LIKES ==========
CREATE TABLE article_likes (
    like_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES article(article_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_article_like_article ON article_likes(article_id);
CREATE INDEX idx_article_like_user ON article_likes(user_id);

-- ========== ARTICLE COMMENTS ==========
CREATE TABLE article_comments (
    comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    comment_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES article(article_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_article_comment_article ON article_comments(article_id);
CREATE INDEX idx_article_comment_user ON article_comments(user_id);

-- ========== ARTICLE VIEWS ==========
CREATE TABLE article_views (
    view_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES article(article_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_article_view_article ON article_views(article_id);
CREATE INDEX idx_article_view_user ON article_views(user_id);

-- ========== COMMENTS ==========
CREATE TABLE comments (
    comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    article_id INT UNSIGNED NOT NULL,
    comment_content TEXT NOT NULL,
    count_likes INT DEFAULT 0,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES article(article_id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_user ON comments(user_id);
CREATE INDEX idx_comment_article ON comments(article_id);

-- ========== CHAT HISTORY ==========
CREATE TABLE chat_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    status ENUM('pending', 'answered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_by CHAR(36) DEFAULT NULL,
    answer_text TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT TRUE,
    review_by CHAR(36) DEFAULT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (answered_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (review_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ========== ANSWERS ==========
CREATE TABLE answers (
    answer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    answered_by CHAR(36) NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES chat_history(id) ON DELETE CASCADE
);

CREATE INDEX idx_answer_question ON answers(question_id);
CREATE INDEX idx_answer_user ON answers(answered_by);

-- ========== FORUM CATEGORIES ==========
CREATE TABLE forum_categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_name ON forum_categories(category_name);

-- ========== FORUM TAGS ==========
CREATE TABLE forum_tags (
    tag_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_forum_tag_tag ON forum_tags(tag_id);

-- ========== FORUM THREADS ==========
CREATE TABLE forum_threads (
    thread_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_name VARCHAR(100) UNIQUE NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES forum_categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_thread_category ON forum_threads(category_id);
CREATE INDEX idx_thread_user ON forum_threads(user_id);

-- ========== FORUM POSTS ==========
CREATE TABLE forum_posts (
    post_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(2083) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_post_thread ON forum_posts(thread_id);
CREATE INDEX idx_post_user ON forum_posts(user_id);

-- ========== FORUM LIKES ==========
CREATE TABLE forum_likes (
    like_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (post_id, user_id)
);

CREATE INDEX idx_like_post ON forum_likes(post_id);
CREATE INDEX idx_like_user ON forum_likes(user_id);

-- ========== FORUM REPORTS ==========
CREATE TABLE forum_reports (
    report_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    reported_by CHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by CHAR(36) DEFAULT NULL,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_report_post ON forum_reports(post_id);
CREATE INDEX idx_report_user ON forum_reports(reported_by);

-- ========== FORUM ==========
CREATE TABLE forum (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    thread_id INT UNSIGNED NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES forum_categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_user ON forum(user_id);
CREATE INDEX idx_forum_category ON forum(category_id);
CREATE INDEX idx_forum_thread ON forum(thread_id);
CREATE INDEX idx_forum_post ON forum(post_id);
