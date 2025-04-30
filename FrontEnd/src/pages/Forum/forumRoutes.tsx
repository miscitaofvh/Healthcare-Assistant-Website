import { Route } from "react-router-dom";
import Forum from "./pages";
import CreatePost from "./pages/CreatePostPage";
import CategoryList from "./pages/Category/CategoryList";
import CategoryPage from "./pages/Category/CategoryPage";
import CreateCategory from "./pages/Category/CreateCategory";
import UpdateCategory from "./pages/Category/UpdateCategory";
import ThreadList from "./pages/Thread/ThreadList";
import ThreadPage from "./pages/Thread/ThreadPage";
import CreateThread from "./pages/Thread/CreateThread";
import UpdateThread from "./pages/Thread/UpdateThread";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostPage";
import TagList from "./pages/Tag/TagList";
import TagPage from "./pages/Tag/TagPage";
import CreateTag from "./pages/Tag/CreateTag";
import UpdateTag from "./pages/Tag/UpdateTag";

export const forumRoutes = (
  <Route path="/forum">
    <Route index element={<Forum />} />
    
    {/* Posts routes */}
    <Route path="create-post" element={<CreatePost />} />
    <Route path="posts">
      <Route index element={<PostList />} />
      <Route path=":id" element={<PostDetail />} />
    </Route>
    
    {/* Threads routes */}
    <Route path="threads">
      <Route index element={<ThreadList />} />
      <Route path="create" element={<CreateThread />} />
      <Route path=":id">
        <Route index element={<ThreadPage />} />
        <Route path="update" element={<UpdateThread />} />
      </Route>
    </Route>
    
    {/* Categories routes */}
    <Route path="categories">
      <Route index element={<CategoryList />} />
      <Route path="create" element={<CreateCategory />} />
      <Route path=":id">
        <Route index element={<CategoryPage />} />
        <Route path="update" element={<UpdateCategory />} />
      </Route>
    </Route>
    
    {/* Tags routes */}
    <Route path="tags">
      <Route index element={<TagList />} />
      <Route path="create" element={<CreateTag />} />
      <Route path=":id">
        <Route index element={<TagPage />} />
        <Route path="update" element={<UpdateTag />} />
      </Route>
    </Route>
  </Route>
);