import { HanziPhonetics } from '../api/hanzi';

// 提取拼音首字母
export const getPinyinInitial = (pinyin: string | undefined): string => {
  if (!pinyin || pinyin.length === 0) return '#';
  
  // 提取首个拼音的首字母并转为大写
  const initial = pinyin.trim().charAt(0).toUpperCase();
  
  // 检查是否是A-Z的字母
  if (/[A-Z]/.test(initial)) {
    return initial;
  }
  
  return '#'; // 非字母情况返回#
};

// 生成所有可能的字母索引
export const generateAlphabeticIndexes = (): string[] => {
  const letters = Array.from({ length: 26 }, (_, i) => 
    String.fromCharCode(65 + i)
  );
  
  // 添加#作为特殊字符的分组
  return [...letters, '#'];
};

// 按拼音首字母对收藏项进行分组
export const groupByPinyinInitial = (
  items: Array<{ character: string; pinyin?: string }>,
  pinyinMap: Record<string, string>
): Record<string, Array<{ character: string; pinyin?: string }>> => {
  const groups: Record<string, Array<{ character: string; pinyin?: string }>> = {};
  
  items.forEach(item => {
    // 从映射中获取拼音，如果没有则使用默认值
    const pinyin = pinyinMap[item.character] || item.pinyin;
    const initial = getPinyinInitial(pinyin);
    
    if (!groups[initial]) {
      groups[initial] = [];
    }
    
    groups[initial].push({
      ...item,
      pinyin
    });
  });
  
  return groups;
};

// 从HanziPhonetics中提取主要拼音
export const extractMainPinyin = (phonetics: HanziPhonetics | null): string => {
  if (!phonetics || !phonetics.pinyin || phonetics.pinyin.length === 0) {
    return '';
  }
  
  // 通常第一个拼音是主要读音
  return phonetics.pinyin[0];
};
