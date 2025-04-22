import { UserInfo } from '../api/user'; // 导入 UserInfo 类型

// 辅助函数：获取头像 URL
export const getAvatarSrc = (userInfo: UserInfo | null): string => {
  // 假设默认头像在 public/avatar/ 目录下
  const defaultAvatarPath = "/avatar/default.png"; // 使用绝对路径
  // 假设最终回退头像在 public/avat/ 目录下 (注意路径可能是 /avat/ 或 /avatar/) - 保持与原逻辑一致
  const fallbackAvatar = "/avat/avatar-boy.png"; // 使用绝对路径

  if (!userInfo) {
    return fallbackAvatar; // 没有用户信息，使用回退头像
  }

  const { avatar_url, user_role, gender } = userInfo;

  // 检查 avatar_url 是否是完整的 URL
  const isFullUrl = avatar_url && (avatar_url.startsWith('http://') || avatar_url.startsWith('https://'));

  if (avatar_url && avatar_url !== defaultAvatarPath && avatar_url !== 'avatar/default.png') { // 同时检查旧的相对路径以防万一
    // 如果是完整 URL，直接使用
    if (isFullUrl) {
      return avatar_url;
    } else {
      // 如果不是完整 URL，尝试拼接基础路径或假定它是相对于根的路径
      // 如果需要 API 基础路径:
      // const fullPath = `${apiBaseUrl}/${avatar_url.startsWith('/') ? avatar_url.substring(1) : avatar_url}`;
      // 如果假定它是根相对路径:
      const fullPath = avatar_url.startsWith('/') ? avatar_url : `/${avatar_url}`;
      return fullPath;
    }
  }

  // 如果是默认头像路径 (检查绝对和可能的旧相对路径)
  if (avatar_url === defaultAvatarPath || avatar_url === 'avatar/default.png') {
    let rolePart = "";
    switch (user_role) {
      case "patient": rolePart = "patient"; break;
      case "doctor": rolePart = "doctor"; break;
      case "relative": rolePart = "relative"; break;
      default:
        return fallbackAvatar;
    }

    let genderPart = "";
    switch (gender) {
      case "male": genderPart = "boy"; break;
      case "female": genderPart = "girl"; break;
      default: genderPart = "boy"; // 默认性别
    }

    // 拼接绝对路径
    const defaultAvatarGeneratedPath = `/avatar/${rolePart}-${genderPart}.png`;
    return defaultAvatarGeneratedPath;
  }

  // 其他情况（例如 avatar_url 为 null 或 undefined），使用回退头像
  return fallbackAvatar;
};
