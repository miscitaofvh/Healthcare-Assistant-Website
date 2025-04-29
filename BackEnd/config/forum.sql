USE healthcare_service_db;

-- Insert a user
INSERT INTO users (user_id, username, password_hash, email, full_name, role, is_active) 
VALUES
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Broder', '$2b$10$H.gvMk3Qn1rqXtlZwydWUuSdvYaKWt9me.SvT2LA1tlQTIBUQ8ZLG', 'iluvstudyforever@gmail.com', 'Duc Anh', 'User', TRUE);

-- Insert categories
INSERT INTO forum_categories (user_id, category_name, description) 
VALUES
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Technology', 'Discuss the latest trends in technology'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Health', 'Health-related discussions, tips, and advice');

-- Insert threads
-- First, retrieve the category_id for 'Technology' and 'Health' to reference in the threads
-- Assuming 'Technology' gets category_id 1 and 'Health' gets category_id 2
-- Adjust if necessary based on the actual ids in your table
INSERT INTO forum_threads (thread_name, category_id, user_id, description) 
VALUES
('Latest Tech Innovations', 1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'A discussion on the most recent innovations in tech'),
('Healthy Living Tips', 2, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Share your tips and experiences on healthy living');

-- Insert posts
INSERT INTO forum_posts (thread_id, user_id, title, content, image_url) 
VALUES
(1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'New AI breakthrough', 'Discussing a major breakthrough in AI technology', 'https://cdn.popsww.com/blog/sites/2/2023/06/uchiha-obito.jpg'),
(2, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Best workout routines', 'Lets talk about the best workout routines for overall health', 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTEs50E3bDzJzYUO4FHowW40WQ1EJi39xcmYhRQbbgFIkCaoWSw6DAOX4_h6ozxgU2gEC8WoXBQQh4oqtlau7aV6x8iWBpnnsXofevwAA');

-- Insert tags (including user_id and description)
INSERT INTO forum_tags (user_id, tag_name, description) 
VALUES
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'AI', 'Artificial Intelligence-related topics'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Fitness', 'Discussions about fitness and physical health'),
('a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'Health', 'General health and wellness topics');

-- Map tags to posts
-- Here we are associating the correct tags to the posts
INSERT INTO forum_tags_mapping (post_id, tag_id) 
VALUES
(1, 1),  -- 'AI' tag for post 1
(2, 1),  -- 'AI' tag for post 2
(2, 2),  -- 'Fitness' tag for post 2
(2, 3);  -- 'Health' tag for post 2

-- Insert likes
INSERT INTO forum_likes (post_id, user_id) 
VALUES
(1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba');

-- Insert comments
INSERT INTO forum_comments (post_id, user_id, content) 
VALUES
(1, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'This is a fascinating topic on AI'),
(2, 'a89eff07-24d0-11f0-9e94-7c4d8fa36fba', 'I completely agree, fitness is essential for health');
