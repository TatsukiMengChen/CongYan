import React from 'react';
import styles from '../index.module.scss';

interface IndexBarProps {
  indexes: string[];
  activeIndex: string | null;
  onIndexClick: (index: string) => void;
}

const IndexBar: React.FC<IndexBarProps> = ({ indexes, activeIndex, onIndexClick }) => {
  return (
    <div className={styles.indexBar}>
      {indexes.map((index) => (
        <div
          key={index}
          className={`${styles.indexItem} ${activeIndex === index ? styles.active : ''}`}
          onClick={() => onIndexClick(index)}
        >
          {index}
        </div>
      ))}
    </div>
  );
};

export default IndexBar;
