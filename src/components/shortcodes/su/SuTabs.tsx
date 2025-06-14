// src/components/shortcodes/su/SuTabs.tsx
import React, { useState } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Special component for individual tabs
export const SuTab: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  // This component is only used as a marker for the parser
  // The actual rendering is handled by SuTabs
  return <>{children}</>;
};

const SuTabs: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const [value, setValue] = useState(0);
  
  const {
    style = 'default',
    class: className,
  } = attributes || {};

  // Process children to extract tabs
  const tabData: Array<{ title: string; anchor?: string; content: React.ReactNode }> = [];
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('SuTabs children:', children);
    console.log('Children count:', React.Children.count(children));
  }
  
  React.Children.forEach(children, (child) => {
    // Skip text nodes that are just whitespace
    if (typeof child === 'string' && !child.trim()) {
      return;
    }
    
    if (React.isValidElement(child)) {
      // Check if this is a rendered su_tab by looking at the key or other props
      // Since we control the rendering, we can look for our special marker
      const childProps = child.props as any;
      
      // Debug log each child
      if (process.env.NODE_ENV === 'development') {
        console.log('Child type:', child.type);
        console.log('Child props:', childProps);
      }
      
      // Check for our data attributes on the wrapper div
      if (child.type === 'div' && childProps['data-shortcode'] === 'su_tab') {
        tabData.push({
          title: childProps['data-title'] || `Tab ${tabData.length + 1}`,
          anchor: childProps['data-anchor'],
          content: childProps.children
        });
      }
      // Also check if it's wrapped in a Fragment
      else if (child.type === React.Fragment && child.props.children) {
        // Recursively check fragment children
        React.Children.forEach(child.props.children, (fragmentChild) => {
          if (React.isValidElement(fragmentChild) && 
              fragmentChild.type === 'div' && 
              (fragmentChild.props as any)['data-shortcode'] === 'su_tab') {
            const props = fragmentChild.props as any;
            tabData.push({
              title: props['data-title'] || `Tab ${tabData.length + 1}`,
              anchor: props['data-anchor'],
              content: props.children
            });
          }
        });
      }
    }
  });

  // If no tabs found, show the raw content
  if (tabData.length === 0) {
    console.warn('SuTabs: No tab data found, showing raw content');
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          my: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
        className={className}
      >
        {children}
      </Paper>
    );
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Map SU tab styles to MUI
  const getTabsVariant = () => {
    switch (style) {
      case 'modern':
        return 'fullWidth';
      case 'simple':
        return 'standard';
      default:
        return 'standard';
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        my: 2,
        border: style === 'default' ? '1px solid' : 'none',
        borderColor: 'divider',
      }}
      className={className}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange}
          variant={getTabsVariant() as any}
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabData.map((tab, index) => (
            <Tab
              key={index}
              label={tab.title}
              id={tab.anchor ? `tab-${tab.anchor}` : undefined}
              sx={{
                textTransform: 'none',
                minHeight: 48,
              }}
            />
          ))}
        </Tabs>
      </Box>
      
      {tabData.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Paper>
  );
};

export default SuTabs;