enum SmEnum {
  SM_SAME = "SM_SAME",
  SM_DIFF_PART = "SM_DIFF_PART",
  SM_DIFF_METHOD = "SM_DIFF_METHOD",
  SM_DIFFERENT = "SM_DIFFERENT",
}

enum YmEnum {
  YM_SAME = "YM_SAME",
  YM_SAME_LIKE = "YM_SAME_LIKE",
  YM_DIFF_SHAPE = "YM_DIFF_SHAPE",
  YM_DIFF_STRUCT = "YM_DIFF_STRUCT",
  YM_DIFF_SMOOTH = "YM_DIFF_SMOOTH",
  YM_DIFF_SHAPE_AND_SMOOTH = "YM_DIFF_SHAPE_AND_SMOOTH",
  YM_DIFFERENT = "YM_DIFFERENT",
}

enum SdEnum {
  SD_SAME = "SD_SAME",
  SD_DIFFERENT = "SD_DIFFERENT",
}

export const GetPronunciationDesc = (value: string): string => {
  console.log(value);
  switch (value) {
    case SmEnum.SM_SAME:
      return "声母相同";
    case SmEnum.SM_DIFF_PART:
      return "声母发音部位不同";
    case SmEnum.SM_DIFF_METHOD:
      return "声母发音方式不同";
    case SmEnum.SM_DIFFERENT:
      return "发音完全不同";
    case YmEnum.YM_SAME:
      return "完全相同";
    case YmEnum.YM_SAME_LIKE:
      return "发音方式和口型都相同";
    case YmEnum.YM_DIFF_SHAPE:
      return "发音结构相同，口型不同";
    case YmEnum.YM_DIFF_STRUCT:
      return "发音口型相同，结构不同";
    case YmEnum.YM_DIFF_SMOOTH:
      return "发音口型相同且粗结构相同，发音细结构不同";
    case YmEnum.YM_DIFF_SHAPE_AND_SMOOTH:
      return "发音粗结构相同，口型不同";
    case YmEnum.YM_DIFFERENT:
      return "完全不同";
    case SdEnum.SD_SAME:
      return "发音相同";
    case SdEnum.SD_DIFFERENT:
      return "发音不同";
    default:
      return "无";
  }
};