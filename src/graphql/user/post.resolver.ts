import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Post } from './models/post.model';
import { PostService } from './post.service';

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}
  @ResolveField(() => [String])
  async likedByAddresses(@Parent() post: Post) {
    return await this.postService.getLikedByAddresses(post.id);
  }
}
