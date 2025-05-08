DROP DATABASE IF EXISTS healthcare_service_db;
CREATE DATABASE IF NOT EXISTS healthcare_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_username ON users(username);

-- ========== DOCTORS ==========
CREATE TABLE doctors (
    doctor_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id   CHAR(36) NOT NULL UNIQUE,
    specialty VARCHAR(255) NOT NULL,
    license   VARCHAR(50)  NOT NULL UNIQUE,
    hospital  VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_tracking_user ON health_tracking(user_id);

-- ========== APPOINTMENTS ==========
CREATE TABLE appointments (
    appointment_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id     CHAR(36) NOT NULL,
    doctor_id      CHAR(36) NOT NULL,
    appointment_time DATETIME NOT NULL,
    status         ENUM('Pending','Confirmed','Cancelled') DEFAULT 'Pending',
    notes          TEXT DEFAULT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(user_id)   ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_doctor   ON appointments(doctor_id);
CREATE INDEX idx_patient  ON appointments(patient_id);
CREATE INDEX idx_appt_time ON appointments(appointment_time);

-- ========== ARTICLE CATEGORIES ==========
CREATE TABLE article_categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_category_name ON article_categories(category_name);

-- ========== ARTICLE TAGS ==========
CREATE TABLE article_tags (
    tag_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_article_tag_article ON article_tags(tag_id);

-- ========== ARTICLES ==========
CREATE TABLE articles (
    article_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id CHAR(36) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    view_count INT UNSIGNED DEFAULT 0,
    comment_count INT UNSIGNED DEFAULT 0,
    publication_date DATE NOT NULL,
    image_url VARCHAR(2083) DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES article_categories(category_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_article_author ON articles(author_id);
CREATE INDEX idx_article_category ON articles(category_id);
CREATE INDEX idx_article_date ON articles(publication_date);
CREATE FULLTEXT INDEX idx_article_search ON articles(title, content);

-- ========== ARTICLE TAGS RELATION ==========
CREATE TABLE article_tag_mapping (
    article_id INT UNSIGNED NOT NULL,
    tag_id     INT UNSIGNED NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id),
    FOREIGN KEY (tag_id)     REFERENCES article_tags(tag_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========== ARTICLE COMMENTS ==========
CREATE TABLE article_comments (
    comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    parent_id INT DEFAULT NULL,
    user_id CHAR(36) NOT NULL,
    comment_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_article_comment_article ON article_comments(article_id);
CREATE INDEX idx_article_comment_user ON article_comments(user_id);

-- ========== ARTICLE VIEWS ==========
CREATE TABLE article_views (
    view_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_article_view_article ON article_views(article_id);
CREATE INDEX idx_article_view_user ON article_views(user_id);

-- ========== CHATBOT CONVERSATIONS ==========
CREATE TABLE chatbot_conversations (
    conversation_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'New Conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_chatbot_conversation_user ON chatbot_conversations(user_id);

-- ========== CHATBOT MESSAGES ==========
CREATE TABLE chatbot_messages (
    message_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    sender_type ENUM('user', 'bot', 'doctor') NOT NULL,
    sender_id CHAR(36),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_chatbot_message_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_message_sender ON chatbot_messages(sender_id);

-- ========== FORUM CATEGORIES ==========
CREATE TABLE forum_categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE 
);

CREATE INDEX idx_category_name ON forum_categories(category_name);

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

-- ========= FORUM TAG ==========
CREATE TABLE forum_tags (
    tag_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL,
    description TEXT DEFAULT NULL,
    usage_count INT UNSIGNED DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_tag_user ON forum_tags(user_id);
CREATE INDEX idx_tag_popularity ON forum_tags(usage_count DESC, last_used_at DESC);

-- ========== FORUM POSTS ==========
CREATE TABLE forum_posts (
    post_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(2083) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_post_thread ON forum_posts(thread_id);
CREATE INDEX idx_post_user ON forum_posts(user_id);

-- ========= FORUM TAG RELATION ==========
CREATE TABLE forum_tags_mapping (
    relation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    tag_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES forum_tags(tag_id) ON DELETE CASCADE,
    UNIQUE (post_id, tag_id)
);

-- ========== FORUM COMMENTS ==========
CREATE TABLE forum_comments (
    comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_post ON forum_comments(post_id);
CREATE INDEX idx_comment_user ON forum_comments(user_id);

-- ========== FORUM COMMENT LIKES ==========
CREATE TABLE forum_comment_likes (
    like_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comment_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_like_comment ON forum_comment_likes(comment_id);
CREATE INDEX idx_comment_like_user ON forum_comment_likes(user_id);

-- ========== FORUM COMMENT REPORTS ==========
CREATE TABLE forum_comment_reports (
    report_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comment_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by CHAR(36) DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_comment_report_comment ON forum_comment_reports(comment_id);
CREATE INDEX idx_comment_report_user ON forum_comment_reports(user_id);

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

-- ========== FORUM ACTIVITY ==========
CREATE TABLE forum_activities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    activity_type ENUM('post', 'comment', 'like', 'report') NOT NULL,
    target_type ENUM('post', 'comment') NOT NULL,
    target_id INT UNSIGNED NOT NULL,
    activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_activity_user ON forum_activities(user_id);
CREATE INDEX idx_activity_type ON forum_activities(activity_type);
CREATE INDEX idx_activity_target ON forum_activities(target_type, target_id);