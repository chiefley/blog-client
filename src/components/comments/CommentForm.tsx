// src/components/comments/CommentForm.tsx
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { postComment } from '../../services/wordpressApi';

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
    <Paper 
      elevation={0} 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        mb: 4, 
        p: 3,
        borderRadius: 2,
        backgroundColor: parentId === 0 ? 'white' : 'background.default',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {parentId === 0 ? (
        <Typography variant="h6" gutterBottom sx={{ 
          fontWeight: 600,
          color: 'primary.dark',
          borderBottom: '2px solid',
          borderColor: 'primary.light',
          pb: 1,
          mb: 2
        }}>
          Leave a Comment
        </Typography>
      ) : (
        <Typography variant="subtitle1" gutterBottom sx={{ 
          fontWeight: 600,
          color: 'primary.dark',
          pb: 1
        }}>
          Reply to comment
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
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
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
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
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
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
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiFormHelperText-root': {
                fontSize: '0.75rem',
                fontStyle: 'italic',
                mt: 0.5
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ 
              py: 1,
              px: 3,
              borderRadius: 1.5,
              fontWeight: 600,
              boxShadow: 1,
              '&:hover': {
                boxShadow: 2
              }
            }}
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
    </Paper>
  );
};

export default CommentForm;