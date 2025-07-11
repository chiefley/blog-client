// src/components/comments/Comments.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface CommentsProps {
  postId: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CommentsErrorBoundary extends React.Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Comments error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Unable to load comments. Please try refreshing the page.
        </Alert>
      );
    }

    return this.props.children;
  }
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: '3px solid',
        borderColor: 'primary.main',
      }}>
        <ChatBubbleOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={600}>
          Comments
        </Typography>
      </Box>
      
      <CommentsErrorBoundary>
        <CommentList postId={postId} />
        <CommentForm postId={postId} />
      </CommentsErrorBoundary>
    </Box>
  );
};

export default Comments;