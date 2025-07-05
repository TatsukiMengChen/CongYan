import React from "react";
import { Form, Select, Card } from "antd";
import { DRAW_STYLES } from "../../../../../api/vivoAigc";

const { Option } = Select;

const DrawStyleSelector: React.FC = () => {
  const styles = [
    {
      value: DRAW_STYLES.GENERAL_V6,
      label: "通用v6.0",
      description: "通用风格，适合大多数场景",
    },
    {
      value: DRAW_STYLES.FANTASY_ANIME,
      label: "梦幻动漫",
      description: "二次元动漫风格",
    },
    {
      value: DRAW_STYLES.REALISTIC,
      label: "唯美写实",
      description: "写实风格，细节丰富",
    },
  ];

  return (
    <Form.Item name="styleConfig" label="绘画风格">
      <Select placeholder="选择绘画风格">
        {styles.map((style) => (
          <Option key={style.value} value={style.value}>
            <div>
              <div className="font-medium">{style.label}</div>
              <div className="text-xs text-gray-500">{style.description}</div>
            </div>
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default DrawStyleSelector;
