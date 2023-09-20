import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Post } from './models/post.model';
import { PostService } from './post.service';

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}
  @Query(() => Post)
  async postById(
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<Post> {
    const post = await this.postService.getPostById(postId);
    return post;
  }
}
