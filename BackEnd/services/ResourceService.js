import connection from '../config/connection.js';
import { CommentService } from './CommentService';
import { PostService } from './PostService';

export const ResourceService = {
  comment: CommentService,
  post: PostService
};