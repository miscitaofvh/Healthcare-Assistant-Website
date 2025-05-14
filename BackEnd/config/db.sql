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
    patient_notes  TEXT DEFAULT NULL,
    doctor_notes   TEXT DEFAULT NULL,
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
    user_id CHAR(36) NOT NULL,
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
    parent_id INT UNSIGNED DEFAULT NULL,
    status ENUM('active', 'closed', 'pinned', 'archived') DEFAULT 'active',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES forum_categories(category_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_category_name ON forum_categories(category_name);

-- ========== FORUM THREADS ==========
CREATE TABLE forum_threads (
    thread_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_name VARCHAR(100) UNIQUE NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    status ENUM('active', 'closed', 'pinned', 'archived') DEFAULT 'active',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES forum_categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_thread_category ON forum_threads(category_id);
CREATE INDEX idx_thread_user ON forum_threads(user_id);

-- ========== FORUM POSTS ==========
CREATE TABLE forum_posts (
    post_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    view_count INT UNSIGNED DEFAULT 0 NOT NULL,
    comment_count INT UNSIGNED DEFAULT 0 NOT NULL,
    like_count INT UNSIGNED DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_post_thread ON forum_posts(thread_id);
CREATE INDEX idx_post_user ON forum_posts(user_id);

-- ========== FORUM COMMENTS ==========
CREATE TABLE forum_comments (
    comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_comment_id INT UNSIGNED DEFAULT NULL,
    depth TINYINT UNSIGNED DEFAULT 0,
    thread_path VARCHAR(255) DEFAULT NULL,
    post_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
    UNIQUE (comment_id, user_id),
    INDEX idx_comment_parent (parent_comment_id),
    INDEX idx_comment_depth (depth),
    INDEX idx_comment_thread (thread_path),
    INDEX idx_comment_post (post_id),
    INDEX idx_comment_user (user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========== FORUM TAGS ==========
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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_tag_user ON forum_tags(user_id);
CREATE INDEX idx_tag_popularity ON forum_tags(usage_count DESC, last_used_at DESC);

-- ========== FORUM TAGS MAPPING ==========
CREATE TABLE forum_tags_mapping (
    relation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    tag_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES forum_tags(tag_id) ON DELETE CASCADE,
    UNIQUE (post_id, tag_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========== FORUM LIKES ==========
CREATE TABLE forum_likes (
    like_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (post_id, user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_like_post ON forum_likes(post_id);
CREATE INDEX idx_like_user ON forum_likes(user_id);

-- ========== FORUM COMMENT LIKES ==========
CREATE TABLE forum_comment_likes (
    like_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comment_id INT UNSIGNED NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (comment_id, user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_comment_like_comment ON forum_comment_likes(comment_id);
CREATE INDEX idx_comment_like_user ON forum_comment_likes(user_id);

-- ========== FORUM POST DELETIONS ==========
CREATE TABLE forum_post_deletions (
    delete_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    deleted_by CHAR(36) NOT NULL,
    reason TEXT DEFAULT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_post_deletion_post ON forum_post_deletions(post_id);
CREATE INDEX idx_post_deletion_user ON forum_post_deletions(deleted_by);

-- ========== FORUM POST REPORTS ==========
CREATE TABLE forum_post_reports (
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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_report_post ON forum_post_reports(post_id);
CREATE INDEX idx_report_user ON forum_post_reports(reported_by);

-- ========== FORUM COMMENT REPORTS ==========
CREATE TABLE forum_comment_reports (
    report_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comment_id INT UNSIGNED NOT NULL,
    reported_by CHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by CHAR(36) DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_comment_report_comment ON forum_comment_reports(comment_id);
CREATE INDEX idx_comment_report_user ON forum_comment_reports(reported_by);

-- ========== FORUM ACTIVITY ==========
CREATE TABLE forum_activities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    activity_type ENUM('category', 'thread', 'post', 'tag', 'comment', 'like', 'report') NOT NULL,
    target_type ENUM('create', 'update', 'delete') NOT NULL,
    target_id INT UNSIGNED NOT NULL,
    activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX idx_activity_user ON forum_activities(user_id);
CREATE INDEX idx_activity_type ON forum_activities(activity_type);
CREATE INDEX idx_activity_target ON forum_activities(target_type, target_id);

-- ===================================================================
-- Trigger for forum

-- Purpose: Increment comment_count when a comment is added and decrement when deleted.
DELIMITER //

CREATE TRIGGER after_comment_insert
AFTER INSERT ON forum_comments
FOR EACH ROW
BEGIN
    UPDATE forum_posts
    SET comment_count = comment_count + 1
    WHERE post_id = NEW.post_id;
END//

CREATE TRIGGER after_comment_delete
AFTER DELETE ON forum_comments
FOR EACH ROW
BEGIN
    UPDATE forum_posts
    SET comment_count = comment_count - 1
    WHERE post_id = OLD.post_id;
END//

DELIMITER ;

-- Purpose: Increment like_count when a like is added and decrement when removed.
DELIMITER //

CREATE TRIGGER after_like_insert
AFTER INSERT ON forum_likes
FOR EACH ROW
BEGIN
    UPDATE forum_posts
    SET like_count = like_count + 1
    WHERE post_id = NEW.post_id;
END//

CREATE TRIGGER after_like_delete
AFTER DELETE ON forum_likes
FOR EACH ROW
BEGIN
    UPDATE forum_posts
    SET like_count = like_count - 1
    WHERE post_id = OLD.post_id;
END//

DELIMITER ;

-- Purpose: Increment usage_count and update last_used_at when a tag is mapped to a post, and decrement when unmapped.
DELIMITER //

CREATE TRIGGER after_tag_mapping_insert
AFTER INSERT ON forum_tags_mapping
FOR EACH ROW
BEGIN
    UPDATE forum_tags
    SET usage_count = usage_count + 1,
        last_used_at = CURRENT_TIMESTAMP
    WHERE tag_id = NEW.tag_id;
END//

CREATE TRIGGER after_tag_mapping_delete
AFTER DELETE ON forum_tags_mapping
FOR EACH ROW
BEGIN
    UPDATE forum_tags
    SET usage_count = usage_count - 1,
        last_used_at = CURRENT_TIMESTAMP
    WHERE tag_id = OLD.tag_id;
END//

DELIMITER ;

-- Purpose: Log create, update, and delete actions for categories, threads, posts, comments, tags, likes, and reports. These triggers cover key tables.
DELIMITER //

-- Forum Categories
CREATE TRIGGER after_category_insert
AFTER INSERT ON forum_categories
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'category', 'create', NEW.category_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_category_update
AFTER UPDATE ON forum_categories
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'category', 'update', NEW.category_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_category_delete
AFTER DELETE ON forum_categories
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'category', 'delete', OLD.category_id, CURRENT_TIMESTAMP);
END//

-- Forum Threads
CREATE TRIGGER after_thread_insert
AFTER INSERT ON forum_threads
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'thread', 'create', NEW.thread_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_thread_update
AFTER UPDATE ON forum_threads
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'thread', 'update', NEW.thread_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_thread_delete
AFTER DELETE ON forum_threads
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'thread', 'delete', OLD.thread_id, CURRENT_TIMESTAMP);
END//

-- Forum Posts
CREATE TRIGGER after_post_insert
AFTER INSERT ON forum_posts
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'post', 'create', NEW.post_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_post_update
AFTER UPDATE ON forum_posts
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'post', 'update', NEW.post_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_post_delete
AFTER DELETE ON forum_posts
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'post', 'delete', OLD.post_id, CURRENT_TIMESTAMP);
END//

-- Forum Comments
CREATE TRIGGER after_comment_insert_activity
AFTER INSERT ON forum_comments
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'comment', 'create', NEW.comment_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_comment_update
AFTER UPDATE ON forum_comments
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'comment', 'update', NEW.comment_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_comment_delete_activity
AFTER DELETE ON forum_comments
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'comment', 'delete', OLD.comment_id, CURRENT_TIMESTAMP);
END//

-- Forum Tags
CREATE TRIGGER after_tag_insert
AFTER INSERT ON forum_tags
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'tag', 'create', NEW.tag_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_tag_update
AFTER UPDATE ON forum_tags 
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'tag', 'update', NEW.tag_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_tag_delete
AFTER DELETE ON forum_tags
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'tag', 'delete', OLD.tag_id, CURRENT_TIMESTAMP);
END//

-- Forum Likes
CREATE TRIGGER after_like_insert_activity
AFTER INSERT ON forum_likes
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'like', 'create', NEW.like_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_like_delete_activity
AFTER DELETE ON forum_likes
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'like', 'delete', OLD.like_id, CURRENT_TIMESTAMP);
END//

-- Forum Comment Likes
CREATE TRIGGER after_comment_like_insert
AFTER INSERT ON forum_comment_likes
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.user_id, 'like', 'create', NEW.like_id, CURRENT_TIMESTAMP);
END//

CREATE TRIGGER after_comment_like_delete
AFTER DELETE ON forum_comment_likes
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (OLD.user_id, 'like', 'delete', OLD.like_id, CURRENT_TIMESTAMP);
END//

-- Forum Post Reports
CREATE TRIGGER after_post_report_insert
AFTER INSERT ON forum_post_reports
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.reported_by, 'report', 'create', NEW.report_id, CURRENT_TIMESTAMP);
END//

-- Forum Comment Reports
CREATE TRIGGER after_comment_report_insert
AFTER INSERT ON forum_comment_reports
FOR EACH ROW
BEGIN
    INSERT INTO forum_activities (user_id, activity_type, target_type, target_id, activity_timestamp)
    VALUES (NEW.reported_by, 'report', 'create', NEW.report_id, CURRENT_TIMESTAMP);
END//

DELIMITER ;