import React, { useEffect, useState } from 'react';
import { useTextContext } from '../context/TextContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';

export const AsrDisplay: React.FC = () => {
  const { asrTranscription, isRecording } = useTextContext();
  const [visible, setVisible] = useState(false);
  const [dots, setDots] = useState('');
  const muiTheme = useMuiTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  // Animation for the "正在识别" dots
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [isRecording]);

  useEffect(() => {
    if (asrTranscription) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [asrTranscription]);

  if (!asrTranscription && !visible && !isRecording) {
    return null;
  }

  return (
    <AnimatePresence>
      {(asrTranscription || isRecording) && (
        <motion.div
          style={{
            padding: 16,
            borderRadius: 12,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            marginLeft: 0,
            marginRight: 0,
            marginBottom: 8,
            backgroundColor: isDarkMode ? '#1a1c1e' : '#f8fafc',
            boxShadow: isDarkMode
              ? 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(55, 55, 55, 0.1), 0px 0px 0px rgba(0, 0, 0, 0)'
              : 'inset 5px 5px 10px rgba(0, 0, 0, 0.1), inset -5px -5px 10px rgba(255, 255, 255, 0.8), 0px 0px 0px rgba(0, 0, 0, 0)',
            color: isDarkMode ? '#e0e0e0' : '#333333',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.02)'
          }}
          initial={{
            opacity: 0,
            boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
            backgroundColor: isDarkMode ? 'rgba(21, 23, 24, 0.3)' : 'rgba(252, 252, 255, 0.5)' // Made light mode more transparent
          }}
          animate={{
            opacity: 1,
            boxShadow: isDarkMode
              ? 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(55, 55, 55, 0.1), 0px 0px 0px rgba(0, 0, 0, 0)'
              : 'inset 5px 5px 10px rgba(0, 0, 0, 0.05), inset -5px -5px 10px rgba(255, 255, 255, 0.9), 0px 0px 0px rgba(0, 0, 0, 0)', // Reduced shadow intensity
            backgroundColor: isDarkMode ? '#1a1c1e' : '#f8fafc' // Changed from #f0f2f5 to #f8fafc
          }}
          exit={{
            opacity: 0,
            boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
            backgroundColor: isDarkMode ? 'rgba(21, 23, 24, 0.3)' : 'rgba(252, 252, 255, 0.5)' // Made light mode more transparent
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.4
          }}
        >
          <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
            {isRecording && (
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: isDarkMode ? 'rgba(180, 180, 180, 0.8)' : 'rgba(80, 80, 80, 0.8)',
                  textShadow: isDarkMode ? '1px 1px 1px rgba(0, 0, 0, 0.5)' : '1px 1px 1px rgba(255, 255, 255, 0.5)'
                }}
              >
                正在识别{dots}
              </Typography>
            )}
            {asrTranscription && (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    color: isDarkMode ? '#e0e0e0' : '#333333',
                    textShadow: isDarkMode ? '1px 1px 1px rgba(0, 0, 0, 0.3)' : '1px 1px 1px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  {asrTranscription}
                </Typography>
              </>
            )}
            {!asrTranscription && isRecording && (
              <Typography
                variant="body1"
                sx={{
                  color: isDarkMode ? '#e0e0e0' : '#333333',
                  textShadow: isDarkMode ? '1px 1px 1px rgba(0, 0, 0, 0.3)' : '1px 1px 1px rgba(255, 255, 255, 0.5)'
                }}
              >
                ...
              </Typography>
            )}
          </Box>
        </motion.div>
      )
      }
    </AnimatePresence >
  );
};
