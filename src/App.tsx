import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import Home from './pages/Home';
import PostDetail from './components/posts/PostDetail';
import CategoryPosts from './pages/CategoryPosts';
import TagPosts from './pages/TagPosts';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
          <Sidebar />
          <main style={{ flexGrow: 1, padding: '16px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:slug" element={<PostDetail />} />
              <Route path="/posts/category/:slug" element={<CategoryPosts />} />
              <Route path="/posts/tag/:slug" element={<TagPosts />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;