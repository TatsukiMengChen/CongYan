import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { UserInfo } from '../api/user';

dayjs.extend(utc);

export const mapGender = (gender: UserInfo['gender']): string => {
  switch (gender) {
    case 'male': return '男';
    case 'female': return '女';
    default: return '未设置';
  }
};

export const mapRole = (role: UserInfo['user_role']): string => {
  switch (role) {
    case 'patient': return '患者';
    case 'doctor': return '医生';
    case 'relative': return '家属';
    default: return role || '未知';
  }
};

export const calculateAge = (birthDateString?: string | null): string | null => {
  if (!birthDateString) return null;
  try {
    // 确保日期是有效格式，优先使用 dayjs 解析
    const birthDate = dayjs(ensureISOFormat(birthDateString));
    if (!birthDate.isValid()) return null;

    const today = dayjs();
    return `${today.diff(birthDate, 'year')}岁`;
  } catch (e) {
    console.error("Error calculating age:", e);
    return null;
  }
};

export const formatBirthDateDisplay = (birthDateString?: string | null): string => {
  if (!birthDateString) return '未设置';
  try {
    const date = dayjs(ensureISOFormat(birthDateString));
    return date.isValid() ? date.format('YYYY-MM-DD') : '日期无效';
  } catch (e) {
    console.error("Error formatting birth date:", e);
    return '日期无效';
  }
};

export const formatBirthDateForAPI = (date: Date | null): string | null => {
  if (!date) return null;
  // 使用 dayjs 处理本地日期，并转换为 UTC 的 ISO 字符串，时间设为中午以避免时区问题
  return dayjs(date).hour(12).minute(0).second(0).millisecond(0).utc().toISOString();
};

export const ensureISOFormat = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  // 尝试用 dayjs 解析，如果成功则转为 UTC ISO 字符串
  const parsedDate = dayjs(dateString);
  if (parsedDate.isValid()) {
    // 如果原始字符串包含时区信息 (Z 或 +/-HH:mm)，则直接转 ISO
    if (/[Z+-]\d{2}:\d{2}$/.test(dateString) || dateString.endsWith('Z')) {
      return parsedDate.toISOString();
    }
    // 否则，假定为本地时间，转为 UTC ISO 字符串 (保留原时间，仅附加时区)
    // 或者，更安全的做法是假定为 UTC 日期，并设为当天中午
    return parsedDate.utc().hour(12).minute(0).second(0).millisecond(0).toISOString();
  }

  console.warn("无法将日期字符串转换为 ISO 格式:", dateString);
  // 返回 null 或原始字符串，取决于 API 的容错性
  return null;
};
