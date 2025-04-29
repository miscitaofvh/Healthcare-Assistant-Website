import { Route } from "react-router-dom";
import Forum from "./pages";
import CreatePost from "./pages/CreatePostPage";
import CategoryList from "./pages/Category/CategoryList";
import CategoryPage from "./pages/Category/CategoryPage";
import ThreadList from "./pages/ThreadList";
import ThreadPage from "./pages/ThreadPage";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostPage";
import TagList from "./pages/Tag/TagList";
import TagPage from "./pages/Tag/TagPage";
import CreateTag from "./pages/Tag/CreateTag";
import UpdateTag from "./pages/Tag/UpdateTag";

export const forumRoutes = (
  <Route path="/forum">
    <Route index element={<Forum />} />
    <Route path="tags" element={<TagList />} />
    <Route path="tags/:id" element={<TagPage />} />
    <Route path="tags/create" element={<CreateTag />} />
    <Route path="tags/update/:id" element={<UpdateTag />} />
    <Route path="create" element={<CreatePost />} />
    <Route path="posts" element={<PostList />} />
    <Route path="posts/:id" element={<PostDetail />} />
    <Route path="categories" element={<CategoryList />} />
    <Route path="categories/:id" element={<CategoryPage />} />
    <Route path="threads" element={<ThreadList />} />
    <Route path="threads/:id" element={<ThreadPage />} />
  </Route>
);