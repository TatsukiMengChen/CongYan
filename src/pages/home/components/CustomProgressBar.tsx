import React from 'react';
import styles from './CustomProgressBar.module.scss';

interface CustomProgressBarProps {
  value: number; // Percentage value (0-100)
  gradient: string; // CSS gradient string
}

export const CustomProgressBar: React.FC<CustomProgressBarProps> = ({ value, gradient }) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={styles.progressBarTrack}>
      <div
        className={styles.progressBarFill}
        style={{
          width: `${clampedValue}%`,
          backgroundImage: gradient,
        }}
      />
    </div>
  );
};
