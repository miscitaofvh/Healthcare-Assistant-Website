USE healthcare_service_db;

-- Insert a user
INSERT INTO users (user_id, username, password_hash, email, full_name, role, is_active) 
VALUES
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Broder', '$2b$10$H.gvMk3Qn1rqXtlZwydWUuSdvYaKWt9me.SvT2LA1tlQTIBUQ8ZLG', 'iluvstudyforever@gmail.com', 'Duc Anh', 'User', TRUE),
('f17dc442-2be2-11f0-b462-2c3b7093608e', 'SyJoon', '$2b$10$H.gvMk3Qn1rqXtlZwydWUuSdvYaKWt9me.SvT2LA1tlQTIBUQ8ZLG', '23520041@gm.uit.edu.vn', 'Duc Anh', 'User', TRUE);
-- Insert categories
INSERT INTO forum_categories (user_id, category_name, description) 
VALUES
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Technology', 'Discuss the latest trends in technology'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Health', 'Health-related discussions, tips, and advice'),
('f17dc442-2be2-11f0-b462-2c3b7093608e', 'IOT', 'IOT in smart City');
-- Insert threads
-- First, retrieve the category_id for 'Technology' and 'Health' to reference in the threads
-- Assuming 'Technology' gets category_id 1 and 'Health' gets category_id 2
-- Adjust if necessary based on the actual ids in your table
INSERT INTO forum_threads (thread_name, category_id, user_id, description) 
VALUES
('Latest Tech Innovations', 1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'A discussion on the most recent innovations in tech'),
('Healthy Living Tips', 2, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Share your tips and experiences on healthy living'),
('IOT is advantaged', 2, 'f17dc442-2be2-11f0-b462-2c3b7093608e', 'They help us in work');
-- Insert posts
INSERT INTO forum_posts (thread_id, user_id, title, content) 
VALUES
(1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'New AI breakthrough', 'Discussing a major breakthrough in AI technology'),
(2, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Best workout routines', 'Lets talk about the best workout routines for overall health'),
(3, 'f17dc442-2be2-11f0-b462-2c3b7093608e', 'IOT in the school', 'IOT in school is the device/technology both help and teach sutdent/');
-- Insert tags (including user_id and description)
INSERT INTO forum_tags (user_id, tag_name, description) 
VALUES
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'AI', 'Artificial Intelligence-related topics'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Fitness', 'Discussions about fitness and physical health'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Health', 'General health and wellness topics'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Technology', 'Technology is the key to future');
-- Map tags to posts
-- Here we are associating the correct tags to the posts
INSERT INTO forum_tags_mapping (post_id, tag_id) 
VALUES
(1, 1),  -- 'AI' tag for post 1
(2, 1),  -- 'AI' tag for post 2
(2, 2),  -- 'Fitness' tag for post 2
(2, 3),  -- 'Health' tag for post 2
(3, 4);  -- 'Health' tag for post 2
-- Insert likes
-- INSERT INTO forum_likes (post_id, user_id) 
-- VALUES
-- (1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba');

-- Insert comments
INSERT INTO forum_comments (post_id, user_id, content) 
VALUES
(1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'This is a fascinating topic on AI'),
(2, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'I completely agree, fitness is essential for health');