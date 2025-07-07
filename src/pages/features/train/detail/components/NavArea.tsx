import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "antd-mobile";
import { Tooltip } from "antd";
import Navbar from "../../../../../components/Navbar";
import Icon from "../../../../../components/Icon";
import { useTextContext } from "../context/TextContext";
import DrawingModal from "./DrawingModal";

export const NavArea = ({
  title,
  author,
  fullText,
}: {
  title: string;
  author: string;
  fullText?: string;
}) => {
  const navigator = useNavigate();
  const { currentAudio, backgroundImage, isGeneratingImage } = useTextContext();

  const [showTooltip, setShowTooltip] = useState(false);
  const [hasUsedDrawing, setHasUsedDrawing] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  // 检查是否首次使用绘画功能
  useEffect(() => {
    const hasUsed = localStorage.getItem("hasUsedDrawing");
    setHasUsedDrawing(!!hasUsed);

    // 如果没有使用过且没有背景图片，显示提示
    if (!hasUsed && !backgroundImage) {
      setTimeout(() => setShowTooltip(true), 1000);
    }
  }, [backgroundImage]);

  const handleOpenDrawingModal = () => {
    setShowDrawingModal(true);
    setShowTooltip(false);

    // 标记已使用
    if (!hasUsedDrawing) {
      localStorage.setItem("hasUsedDrawing", "true");
      setHasUsedDrawing(true);
    }
  };

  return (
    <>
      <div
        className={`relative ${backgroundImage ? "z-50" : "z-10"}`}
        style={
          backgroundImage
            ? {
                backgroundColor: "rgba(252, 252, 255, 0.95)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 2px 16px rgba(0, 0, 0, 0.1)",
              }
            : {}
        }
      >
        <Navbar
          onBack={() => {
            currentAudio?.pause();
            navigator(-1);
          }}
          style={
            backgroundImage
              ? {
                  backgroundColor: "transparent",
                }
              : {}
          }
          right={
            <div className="relative">
              <Tooltip
                open={showTooltip && !hasUsedDrawing}
                title="训练太枯燥？试试智能配图！"
                placement="bottom"
                onOpenChange={(open) => !open && setShowTooltip(false)}
                arrow
              >
                <Button
                  size="small"
                  color="primary"
                  fill="none"
                  loading={isGeneratingImage}
                  onClick={handleOpenDrawingModal}
                  className={`inline-flex items-center gap-1 transition-all duration-300 ${
                    backgroundImage
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700"
                      : "hover:bg-blue-50 hover:border-blue-300"
                  }`}
                  style={{
                    minWidth: "fit-content",
                    height: "32px",
                    padding: "0 12px",
                    fontSize: "14px",
                    lineHeight: "1",
                  }}
                >
                  {backgroundImage ? (
                    <>
                      <Icon name="check" size={14} />
                      <span>已配图</span>
                    </>
                  ) : isGeneratingImage ? (
                    <span>生成中</span>
                  ) : (
                    <>
                      <Icon name="image" size={14} />
                      <span>配图</span>
                    </>
                  )}
                </Button>
              </Tooltip>
            </div>
          }
        >
          <div>
            <div className="text-14px">{title}</div>
            <div className="text-3">{author}</div>
          </div>
        </Navbar>
      </div>

      <DrawingModal
        visible={showDrawingModal}
        onClose={() => setShowDrawingModal(false)}
        title={title}
        fullText={fullText || title}
      />
    </>
  );
};
