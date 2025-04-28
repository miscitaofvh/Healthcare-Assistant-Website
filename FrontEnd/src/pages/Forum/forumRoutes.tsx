import { Route } from "react-router-dom";
import Forum from "./pages";
import CreatePost from "./pages/CreatePostPage";
import CategoryList from "./pages/CategoryList";
import CategoryPage from "./pages/CategoryPage";
import ThreadList from "./pages/ThreadList";
import ThreadPage from "./pages/ThreadPage";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostPage";


export const forumRoutes = (
  <Route path="/forum">
    <Route index element={<Forum />} />
    <Route path="create" element={<CreatePost />} />
    <Route path="posts" element={<PostList />} />
    <Route path="post/:id" element={<PostDetail />} />
    <Route path="categories" element={<CategoryList />} />
    <Route path="categories/:id" element={<CategoryPage />} />
    <Route path="threads" element={<ThreadList />} />
    <Route path="threads/:id" element={<ThreadPage />} />
  </Route>
);