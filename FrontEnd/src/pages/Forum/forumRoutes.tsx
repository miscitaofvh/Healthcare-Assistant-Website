// src/components/Forum/forumRoutes.tsx

import React from "react";
import { Route } from "react-router-dom";
import Forum from "./pages";
import CreatePostPage from "./pages/CreatePostPage";
// import CategoryPage from "./pages/CategoryPage";
// import ThreadPage from "./pages/ThreadPage";
// import PostList from "./pages/PostList";
// import CategoryList from "./pages/CategoryList";
// import ThreadList from "./pages/ThreadList";
import PostDetail from "./pages/[id]";

export const forumRoutes = (
  <Route path="/forum" element={<Forum />}>
    <Route path="create" element={<CreatePostPage />} />
    {/* <Route path="categories" element={<CategoryList />} />
    <Route path="categories/:categoryId" element={<CategoryPage />} />
    <Route path="threads" element={<ThreadList />} />
    <Route path="threads/:threadId" element={<ThreadPage />} />
    <Route path="posts" element={<PostList />} /> */}
    <Route path=":id" element={<PostDetail />} />
  </Route>
);
