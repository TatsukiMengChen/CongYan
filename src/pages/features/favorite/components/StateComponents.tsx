import React from 'react';
import { DotLoading, ErrorBlock } from 'antd-mobile';
import styles from '../index.module.scss';

export const LoadingState: React.FC = () => (
  <div style={{ padding: '64px 0', textAlign: 'center' }}>
    <DotLoading color='primary' />
    <div style={{ marginTop: 12, color: '#666' }}>加载中...</div>
  </div>
);

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <ErrorBlock status="default" title="加载失败" description={message} />
);

export const EmptyState: React.FC = () => (
  <ErrorBlock 
    status="empty" 
    title="暂无收藏" 
    description="点击右下角气泡添加收藏" 
  />
);
