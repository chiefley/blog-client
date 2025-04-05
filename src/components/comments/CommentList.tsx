//src/components/comments/CommentList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  CircularProgress, 
  Alert,
  List,
  Paper
} from '@mui/material';
import { Comment } from '../../types/interfaces';
import { getComments } from '../../services/wordpressApi';
import CommentItem from './CommentItem';
import MoodIcon from '@mui/icons-material/Mood';

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
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
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
      <Paper elevation={0} sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 4,
        px: 3,
        mb: 4,
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CircularProgress size={28} />
        <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
          Loading comments...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 3, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  if (comments.length === 0) {
    return (
      <Paper elevation={0} sx={{ 
        py: 4, 
        px: 3,
        mb: 4,
        textAlign: 'center',
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <MoodIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
        <Typography variant="body1" color="text.secondary" gutterBottom>
          No comments yet.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Be the first to share your thoughts!
        </Typography>
      </Paper>
    );
  }

  return (
    <List sx={{ width: '100%', py: 2, mb: 3 }}>
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