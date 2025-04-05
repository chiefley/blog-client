import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { getComments } from '../../services/wordpressApi';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  onCommentSubmitted?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  postId, 
  parentId = 0,
  onCommentSubmitted
}) => {
  const [comment, setComment] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setError(null);
    
    try {
      await postComment({
        post: postId,
        parent: parentId,
        content: comment,
        author_name: name,
        author_email: email
      });
      
      // Clear form after successful submission
      setComment('');
      setName('');
      setEmail('');
      setSuccess(true);
      
      // Call the callback if provided
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
      {parentId === 0 ? (
        <Typography variant="h6" gutterBottom>
          Leave a Comment
        </Typography>
      ) : (
        <Typography variant="subtitle1" gutterBottom>
          Reply to comment
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            helperText="Your email won't be published"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </Grid>
      </Grid>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Comment submitted successfully"
      />
    </Box>
  );
};

export default CommentForm;