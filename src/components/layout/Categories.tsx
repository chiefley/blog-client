import React, { useState, useEffect } from 'react';
import { 
  List, 
  ListItem, 
  Typography, 
  Chip, 
  Divider, 
  Box, 
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// Define the interface for category objects
interface Category {
  id: number;
  name: string;
  count: number;
  slug: string;
  parent: number;
  children?: Category[];
}

// Props interface
interface CategoriesProps {
  title?: string;
}

const Categories: React.FC<CategoriesProps> = ({ title = "Categories" }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // You should replace this with your actual API endpoint
        const response = await fetch('https://wpcms.thechief.com/wp-json/wp/v2/categories?per_page=100');
        
        if (!response.ok) {
          throw new Error(`Error fetching categories: ${response.status}`);
        }
        
        const data = await response.json();
        const flatCategories = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          count: cat.count,
          slug: cat.slug,
          parent: cat.parent,
          children: []
        }));

        // Build the category hierarchy
        const hierarchicalCategories = buildCategoryHierarchy(flatCategories);
        setCategories(hierarchicalCategories);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Function to build the category hierarchy
  const buildCategoryHierarchy = (flatCategories: Category[]): Category[] => {
    const categoriesById = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // First pass: add all categories to the map
    flatCategories.forEach(category => {
      categoriesById.set(category.id, { ...category, children: [] });
    });

    // Second pass: build the hierarchy
    flatCategories.forEach(category => {
      const categoryWithChildren = categoriesById.get(category.id)!;
      
      if (category.parent === 0) {
        // This is a root category
        rootCategories.push(categoryWithChildren);
      } else {
        // This is a child category
        const parent = categoriesById.get(category.parent);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(categoryWithChildren);
        } else {
          // If parent is not found, treat as root
          rootCategories.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  };

  // Toggle expand/collapse for a category
  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Check if a category is expanded
  const isExpanded = (categoryId: number): boolean => {
    return expandedCategories.includes(categoryId);
  };

  // Recursive function to render a category and its children
  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const expanded = isExpanded(category.id);

    return (
      <React.Fragment key={category.id}>
        <ListItem 
          component={RouterLink} 
          to={`/categories/${category.slug}`}  
          sx={{ 
            textDecoration: 'none', 
            color: 'inherit',
            pl: 2 + level * 2, // Increase padding based on hierarchy level
            py: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            pr: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {hasChildren && (
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    toggleExpand(category.id);
                  }}
                  sx={{ mr: 1, p: 0 }}
                >
                  {expanded ? 
                    <ExpandLessIcon fontSize="small" /> : 
                    <ExpandMoreIcon fontSize="small" />
                  }
                </IconButton>
              )}
              {!hasChildren && level > 0 && (
                <ArrowRightIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
              )}
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                {category.name}
              </Typography>
            </Box>
            <Chip 
              label={category.count} 
              size="small" 
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                ml: 1,
                minWidth: 24
              }} 
            />
          </Box>
        </ListItem>

        {/* Render children if this category is expanded */}
        {hasChildren && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List dense disablePadding>
        {categories.map(category => renderCategory(category))}
      </List>
    </Box>
  );
};

export default Categories;