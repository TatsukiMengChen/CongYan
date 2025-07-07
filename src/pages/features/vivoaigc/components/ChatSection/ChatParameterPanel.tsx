import React from "react";
import { Form, Slider, Collapse } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Panel } = Collapse;

const ChatParameterPanel: React.FC = () => {
  return (
    <Collapse ghost>
      <Panel
        header={
          <span className="flex items-center gap-2 text-gray-600">
            <SettingOutlined />
            高级参数设置
          </span>
        }
        key="parameters"
      >
        <div className="space-y-4">
          <Form.Item
            name="temperature"
            label="温度参数 (创造性)"
            tooltip="较高的值会让输出更随机，较低的值会让输出更聚焦和确定"
          >
            <Slider
              min={0.1}
              max={2.0}
              step={0.1}
              marks={{
                0.1: "0.1",
                0.9: "0.9",
                2.0: "2.0",
              }}
            />
          </Form.Item>

          <Form.Item
            name="maxTokens"
            label="最大令牌数"
            tooltip="生成答案的最大长度"
          >
            <Slider
              min={100}
              max={4000}
              step={100}
              marks={{
                100: "100",
                2048: "2048",
                4000: "4000",
              }}
            />
          </Form.Item>
        </div>
      </Panel>
    </Collapse>
  );
};

export default ChatParameterPanel;
