import React, { useState } from "react";
import { Modal, Button, Space, Image } from "antd";
import { Grid } from "antd-mobile";
import Icon from "../../../../../components/Icon";
import { useTextContext } from "../context/TextContext";
import styles from "./DrawingModal.module.scss";

interface DrawingModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  fullText: string;
}

const DrawingModal: React.FC<DrawingModalProps> = ({
  visible,
  onClose,
  title,
  fullText,
}) => {
  const {
    backgroundImage,
    setBackgroundImage,
    isGeneratingImage,
    generateBackgroundImage,
    imageLoadingState,
    setImageLoadingState,
  } = useTextContext();

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    await generateBackgroundImage(title, fullText);
  };

  const handleRegenerate = async () => {
    await generateBackgroundImage(title, fullText);
  };

  const handleViewOriginal = () => {
    setPreviewImage(backgroundImage);
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    setImageLoadingState("idle");
    onClose();
  };

  const handleApplyBackground = () => {
    // 图片已经在生成时自动应用了
    onClose();
  };

  const getModalContent = () => {
    if (!backgroundImage) {
      // 无背景图片状态
      return (
        <div className="text-center p-8">
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="image" size={40} className="text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <Icon name="magic" size={14} className="text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            为训练添加智能配图
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            AI将根据您的训练内容生成符合意境的背景图片，
            <br />
            让康复练习更加生动有趣
          </p>
          <Button
            type="primary"
            size="large"
            loading={isGeneratingImage}
            onClick={handleGenerate}
            className="w-full h-12 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              background: isGeneratingImage
                ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              border: "none",
            }}
          >
            {isGeneratingImage ? (
              "正在生成配图..."
            ) : (
              <div className="flex items-center gap-2">
                <Icon name="magic" size={16} />
                生成智能配图
              </div>
            )}
          </Button>
        </div>
      );
    }

    // 有背景图片状态
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden shadow-inner">
            {imageLoadingState === "loading" ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
                <Icon
                  name="loading"
                  size={24}
                  className="text-gray-400 animate-spin"
                />
              </div>
            ) : (
              <img
                src={backgroundImage}
                alt="训练背景图"
                className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                onLoad={() => setImageLoadingState("loaded")}
                onError={() => setImageLoadingState("error")}
              />
            )}
            {/* 悬浮预览按钮 */}
            {imageLoadingState === "loaded" && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <Icon name="eye" size={14} className="text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Grid columns={2} gap={12}>
            <Button
              type="default"
              icon={
                !isGeneratingImage ? (
                  <Icon name="refresh" size={16} />
                ) : undefined
              }
              loading={isGeneratingImage}
              onClick={handleRegenerate}
              block
              className="h-11 rounded-lg font-medium border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200"
            >
              {isGeneratingImage ? "生成中..." : "重新生成"}
            </Button>
            <Button
              type="default"
              icon={<Icon name="eye" size={16} />}
              onClick={handleViewOriginal}
              block
              className="h-11 rounded-lg font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
            >
              查看原图
            </Button>
          </Grid>

          <Grid columns={2} gap={12}>
            <Button
              type="primary"
              icon={<Icon name="check" size={16} />}
              onClick={handleApplyBackground}
              block
              className="h-11 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
              }}
            >
              应用背景
            </Button>
            <Button
              danger
              icon={<Icon name="delete" size={16} />}
              onClick={handleRemoveBackground}
              block
              className="h-11 rounded-lg font-medium bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ border: "none" }}
            >
              移除背景
            </Button>
          </Grid>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Icon name="image" size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold">智能配图</span>
          </div>
        }
        footer={null}
        width={420}
        centered
        styles={{
          body: { padding: 0 },
          header: { borderBottom: "none", paddingBottom: 16 },
        }}
        className={styles.drawingModal}
      >
        <div className="relative overflow-hidden">{getModalContent()}</div>
      </Modal>

      {/* 查看原图的预览模态框 */}
      <Modal
        open={!!previewImage}
        onCancel={() => setPreviewImage(null)}
        title="查看原图"
        footer={null}
        width="90%"
        centered
        styles={{
          body: { padding: 12 },
        }}
      >
        {previewImage && (
          <div className="text-center">
            <Image
              src={previewImage}
              alt="训练背景图"
              className="max-w-full max-h-96 object-contain"
              preview={false}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default DrawingModal;
