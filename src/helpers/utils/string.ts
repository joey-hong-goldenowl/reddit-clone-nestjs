import { CommentInteractionType } from 'src/comment/entities/comment-interaction.entity';
import { PostInteractionType } from 'src/post/entities/post-interaction.entity';

export const getCloudinaryFileId = (imageUrl: string): string => {
  const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
  return fileName.split('.')[0];
};

export const generatePostInteractionPushNotificationMessage = (type: PostInteractionType, username: string): string => {
  const interactionType = type === PostInteractionType.UPVOTE ? 'upvoted' : 'downvoted';
  return `u/${username} ${interactionType} your post`;
};

export const generateCommentInteractionPushNotificationMessage = (type: CommentInteractionType, username: string): string => {
  const interactionType = type === CommentInteractionType.UPVOTE ? 'upvoted' : 'downvoted';
  return `u/${username} ${interactionType} your comment`;
};
