import { getPosts, getTagByForumPost } from "../../api/Forum/main"; 
import { Post, Tag } from "../../../types/forum";

export const loadPosts = async (
  setLoading: (loading: boolean) => void,
  setPosts: (posts: Post[]) => void,
  setError: (error: string) => void
) => {
  try {
    setLoading(true);
    const response = await getPosts();
    if (response.status !== 200) throw new Error("Failed to load posts");
    const data = response.data.data; // no need for await here
    setPosts(data);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}


export const fetchPosts = async (): Promise<Post[]> => {
  const response = await getPosts();
  if (response.status !== 200) {
    throw new Error("Failed to fetch posts");
  }
  const forumPostsWithTags = await Promise.all(
    response.data.data.map(async (forumPost: any) => {
      try {
        const tagRes = await getTagByForumPost(forumPost.post_id.toString());
        return {
          ...forumPost,
          tag_name: tagRes.data.map((tag: Tag) => tag.tag_name),
        };
      } catch {
        return { ...forumPost, tag_name: [] };
      }
    })
  );
  
  return forumPostsWithTags;
};
