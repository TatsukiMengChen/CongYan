import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
// Import Modal and Input from antd
import { Modal, Input } from 'antd'; 
import {
  FloatingBubble,
  // Remove Input and Modal from antd-mobile import
  // Input,
  // Modal,
  PullToRefresh,
  Toast,
} from 'antd-mobile';
import AddIcon from '@mui/icons-material/Add';
import {
  AddFavoriteCharacterAPI,
  DeleteFavoriteCharacterAPI,
  FavoriteCharacterInfo,
  GetAllFavoriteCharactersAPI,
} from '../../../api/favorite';
import { GetHanziPhoneticsAPI, HanziPhonetics } from '../../../api/hanzi';
import { GetTTSAPI } from '../../../api/tts';
import Navbar from '../../../components/Navbar';
import { CharacterDetailPopup } from '../train/detail/components/CharacterDetailPopup';
import styles from './index.module.scss';

import { LoadingState, ErrorState, EmptyState } from './components/StateComponents';

interface FavoriteDetailState {
  char: string;
  score: number | null;
  sim_sa: number | null;
  sim_ya: number | null;
  sim_sd: number | null;
}

const FavoritePage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteCharacterInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [phoneticsInfo, setPhoneticsInfo] = useState<HanziPhonetics | null>(null);
  const [isFetchingPhonetics, setIsFetchingPhonetics] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const currentAudioElement = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GetAllFavoriteCharactersAPI();
      if (res.status === 0 && res.characters) {
        const sortedFavorites = res.characters.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFavorites(sortedFavorites);
      } else {
        setError(res.message || '获取收藏列表失败');
        setFavorites([]);
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRefresh = async () => {
    console.log("收藏夹页下拉刷新触发");
    await fetchFavorites();
    console.log("收藏夹页数据刷新完成");
  };

  const handleDelete = async (character: string) => {
    Toast.show({ icon: 'loading', content: '删除中...' });
    try {
      const res = await DeleteFavoriteCharacterAPI({ character });
      if (res.status === 0) {
        Toast.show({ icon: 'success', content: `"${character}" 已取消收藏` });
        setFavorites(prev => prev.filter(fav => fav.character !== character));
        if (selectedChar === character) {
          handleClosePopup();
        }
      } else {
        Toast.show({ icon: 'fail', content: res.message || '取消收藏失败' });
      }
    } catch (err) {
      Toast.show({ icon: 'fail', content: '操作失败' });
      console.error("Delete favorite error:", err);
    }
  };

  const stopCharacterAudio = useCallback(() => {
    if (currentAudioElement.current) {
      currentAudioElement.current.pause();
      currentAudioElement.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
  }, []);

  const playCharacterAudio = useCallback(async (character: string | null) => {
    if (!character || isAudioLoading || isAudioPlaying) return;

    stopCharacterAudio();

    const cacheKey = `char-${character}`;
    let audio: HTMLAudioElement | null = audioCache.current[cacheKey] || null;

    const startPlayback = async (audioElement: HTMLAudioElement) => {
      currentAudioElement.current = audioElement;
      audioElement.currentTime = 0;

      const endedListener = () => {
        setIsAudioPlaying(false);
        currentAudioElement.current = null;
        audioElement.removeEventListener('ended', endedListener);
        audioElement.removeEventListener('error', errorListener);
      };
      const errorListener = (e: Event) => {
        console.error("Audio playback error:", e);
        Toast.show({ icon: 'fail', content: "播放音频失败" });
        setIsAudioPlaying(false);
        currentAudioElement.current = null;
        audioElement.removeEventListener('ended', endedListener);
        audioElement.removeEventListener('error', errorListener);
      };
      audioElement.addEventListener('ended', endedListener);
      audioElement.addEventListener('error', errorListener);

      try {
        setIsAudioPlaying(true);
        await audioElement.play();
      } catch (playError) {
        console.error("Error starting audio playback:", playError);
        Toast.show({ icon: 'fail', content: "播放音频时出错" });
        setIsAudioPlaying(false);
        currentAudioElement.current = null;
        audioElement.removeEventListener('ended', endedListener);
        audioElement.removeEventListener('error', errorListener);
      }
    };

    if (audio) {
      await startPlayback(audio);
    } else {
      setIsAudioLoading(true);
      try {
        const res = await GetTTSAPI(character);
        if (res.status === 0 && res.audio) {
          const audioSrc = `data:audio/wav;base64,${res.audio}`;
          audio = new Audio(audioSrc);
          audioCache.current[cacheKey] = audio;
          setIsAudioLoading(false);
          await startPlayback(audio);
        } else {
          Toast.show({ icon: 'fail', content: res.message || "获取单字音频失败" });
          setIsAudioLoading(false);
        }
      } catch (error) {
        console.error("Error fetching TTS audio:", error);
        Toast.show({ icon: 'fail', content: "加载音频时出错" });
        setIsAudioLoading(false);
      }
    }
  }, [isAudioLoading, isAudioPlaying, stopCharacterAudio]);

  const handleItemClick = (character: string) => {
    if (!character) return;
    setSelectedChar(character);
    setIsPopupVisible(true);
    setPhoneticsInfo(null);
    setIsFetchingPhonetics(true);

    GetHanziPhoneticsAPI(character)
      .then((res) => {
        if (res.status === 0 && res.phonetics) {
          setPhoneticsInfo(res.phonetics);
        } else {
          Toast.show({ icon: 'fail', content: res.message || "获取拼音详情失败" });
          console.error("Failed to get phonetics:", res.message);
        }
      })
      .catch((err: any) => {
        Toast.show({ icon: 'fail', content: "获取拼音详情时出错" });
        console.error("Error fetching phonetics:", err);
      })
      .finally(() => {
        setIsFetchingPhonetics(false);
      });
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
    stopCharacterAudio();
    setSelectedChar(null);
    setPhoneticsInfo(null);
    setIsFetchingPhonetics(false);
  };

  const handleAddFavoriteClick = () => {
    let inputValue = ''; // Variable to hold input value

    Modal.confirm({
      title: '添加自定义收藏',
      // antd Modal.confirm content doesn't directly render React nodes with stateful inputs easily.
      // We create the input outside and update the variable.
      content: (
        <div>
          <p>请输入您想要收藏的单个汉字。</p>
          <Input
            placeholder='输入单个汉字'
            allowClear // Use allowClear for antd Input
            style={{ marginTop: 8 }}
            onChange={e => { // antd Input onChange provides an event object
              inputValue = e.target.value; 
            }}
            maxLength={1} // Limit input to one character
          />
        </div>
      ),
      okText: '添加', // Use okText for antd Modal
      cancelText: '取消', // Use cancelText for antd Modal
      onOk: async () => { // Use onOk for antd Modal
        const charToAdd = inputValue.trim();
        const chineseCharRegex = /^[\u4e00-\u9fa5]$/;
        if (!chineseCharRegex.test(charToAdd)) {
          // Use antd-mobile Toast or switch to antd Message/Notification
          Toast.show({ icon: 'fail', content: '请输入一个有效的单个汉字' }); 
          // To keep the modal open in antd, you need to return a rejected Promise or throw an error.
          // However, simple validation is often handled before calling the API.
          // For simplicity, we'll let it close and show the toast. Re-opening is needed for correction.
          return; 
        }

        if (favorites.some(fav => fav.character === charToAdd)) {
          Toast.show({ icon: 'fail', content: `"${charToAdd}" 已经收藏过了` });
          return;
        }

        Toast.show({ icon: 'loading', content: '添加中...' });
        try {
          const res = await AddFavoriteCharacterAPI({ character: charToAdd });
          if (res.status === 0) {
            Toast.show({ icon: 'success', content: `"${charToAdd}" 收藏成功` });
            await fetchFavorites(); // Refresh list
          } else {
            Toast.show({ icon: 'fail', content: res.message || '收藏失败' });
          }
        } catch (error) {
          Toast.show({ icon: 'fail', content: '操作失败' });
          console.error("Add favorite error:", error);
        }
        // No explicit return needed here for onOk to close the modal upon success/completion.
      },
      onCancel() {
        console.log('取消添加收藏');
      },
      // antd Modal buttons are horizontal by default.
    });
  };

  const renderContent = () => {
    if (loading && favorites.length === 0) {
      return <LoadingState />;
    }
    
    if (error && favorites.length === 0) {
      return <ErrorState message={error} />;
    }
    
    if (favorites.length === 0 && !loading) {
      return <EmptyState />;
    }
    
    return (
      <div className={styles.favoriteGrid}>
        {favorites.map(fav => (
          <div
            key={fav.uuid}
            className={styles.gridItem}
            onClick={() => handleItemClick(fav.character)}
          >
            {/* 汉字 */}
            <span>{fav.character}</span> 
            {/* 收藏日期 - 显示年月日 */}
            <span className={styles.gridItemDate}>
              {new Date(fav.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })} 
            </span>
          </div>
        ))}
      </div>
    );
  };

  const popupDetail: FavoriteDetailState = {
    char: selectedChar || '',
    score: null,
    sim_sa: null,
    sim_ya: null,
    sim_sd: null,
  };

  return (
    <div className="page-container flex flex-col h-full">
      <Navbar onBack={() => navigate(-1)}>我的收藏</Navbar>
      <div className={`page-content flex-1 overflow-y-auto ${styles.pullToRefreshContainer}`}>
        <PullToRefresh
          onRefresh={handleRefresh}
          renderText={status => {
            return {
              pulling: '下拉刷新收藏列表',
              canRelease: '释放立即刷新',
              refreshing: '刷新中...',
              complete: '刷新成功',
            }[status];
          }}
        >
          {renderContent()} 
        </PullToRefresh>
      </div>

      <FloatingBubble
        style={{
          '--initial-position-bottom': '70px',
          '--initial-position-right': '20px',
          '--edge-distance': '20px',
          '--size': '48px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={handleAddFavoriteClick}
      >
        <AddIcon style={{ fontSize: 28, color: 'white' }} />
      </FloatingBubble>

      <CharacterDetailPopup
        visible={isPopupVisible}
        onClose={handleClosePopup}
        detail={popupDetail}
        phoneticsInfo={phoneticsInfo}
        isFetchingPhonetics={isFetchingPhonetics}
        isAudioPlaying={isAudioPlaying}
        isAudioLoading={isAudioLoading}
        onPlayAudio={() => playCharacterAudio(selectedChar)}
        onStopAudio={stopCharacterAudio}
      />
    </div>
  );
};

export default FavoritePage;
