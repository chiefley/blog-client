import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  CircularProgress, 
  Alert,
  List,
  ListItem
} from '@mui/material';
import { Comment } from '../../types/interfaces';
import { getComments } from '../../services/wordpressApi';
import CommentItem from './CommentItem';

interface CommentListProps {
  postId: number;
}

const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedComments = await getComments(postId);
        setComments(fetchedComments);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // Function to build hierarchical comments
  const buildCommentHierarchy = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First, create a map of all comments by ID
    comments.forEach(comment => {
      // Ensure replies array exists
      const commentWithReplies = { ...comment, replies: [] };
      commentMap.set(comment.id, commentWithReplies);
    });

    // Then, build the hierarchy
    comments.forEach(comment => {
      if (comment.parent === 0) {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id)!);
      } else {
        // This is a reply
        const parentComment = commentMap.get(comment.parent);
        if (parentComment) {
          parentComment.replies.push(commentMap.get(comment.id)!);
        } else {
          // If parent doesn't exist (should not happen normally), treat as root
          rootComments.push(commentMap.get(comment.id)!);
        }
      }
    });

    return rootComments;
  };

  // Build the hierarchical comments
  const hierarchicalComments = buildCommentHierarchy(comments);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (comments.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No comments yet. Be the first to comment!
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', py: 2 }}>
      {hierarchicalComments.map(comment => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
        />
      ))}
    </List>
  );
};

export default CommentList;