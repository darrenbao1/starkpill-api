import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Comment } from './models/comment.model';
import { CommentService } from './comment.service';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}
  @Query(() => Comment)
  async postById(
    @Args('comment', { type: () => Int }) commentId: number,
  ): Promise<Comment> {
    const comment = await this.commentService.getCommentById(commentId);
    return comment;
  }
}
