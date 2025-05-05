export class CommentService {
    static async getById(commentId) {
        const [comment] = await db.execute(
            `SELECT comment_id, user_id, content 
         FROM forum_comments 
         WHERE comment_id = ?`,
            [commentId]
        );
        return comment[0];
    }

    static async verifyOwnership(commentId, userId) {
        const comment = await this.getById(commentId);
        return comment?.user_id === userId;
    }
}