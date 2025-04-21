import React from 'react';
import { List } from 'antd-mobile';
import { FavoriteCharacterInfo } from '../../../../api/favorite';
import styles from '../index.module.scss';

interface FavoriteItemProps {
  favorite: FavoriteCharacterInfo;
  pinyin?: string; // 拼音可能不是API直接提供的，由父组件传入
  onClick: (character: string) => void;
}

const FavoriteItem: React.FC<FavoriteItemProps> = ({ favorite, pinyin, onClick }) => {
  return (
    <List.Item
      key={favorite.uuid}
      onClick={() => onClick(favorite.character)}
      className={styles.favoriteItem}
      clickable
    >
      <div className={styles.character}>{favorite.character}</div>
      <div className={styles.meta}>
        {pinyin && <div className={styles.pinyin}>拼音: {pinyin}</div>}
        <div className={styles.date}>
          收藏于: {new Date(favorite.created_at).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </List.Item>
  );
};

export default FavoriteItem;
