import { Chip, ListItemButton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { GetTrainTextByCategoryAPI, TrainText } from "../../../api/train";
import Navbar from "../../../components/Navbar";

const TrainTextCard = (props: TrainText) => {
  const getColor = (grade: string) => {
    switch (grade) {
      case "middle rank":
        return "primary";
      case "senior":
        return "warning";
      default:
        return "default";
    }
  };

  const getGrade = (grade: string) => {
    switch (grade) {
      case "middle rank":
        return "普通";
      case "senior":
        return "困难";
      default:
        return "简单";
    }
  };

  // 计算中文字符的长度
  const getChineseCharacterLength = (text: string) => {
    const chineseCharacters = text.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseCharacters.length;
  };

  return (
    <div
      className="relative mx-4 my-4 overflow-hidden rounded-md p-4"
      style={{ boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px" }}
    >
      <Chip
        className="absolute right-2 top-2"
        variant="filled"
        color="default"
        size="small"
        label="无记录"
      />

      <Chip
        className="absolute bottom-2 right-2"
        variant="outlined"
        color={getColor(props.grade!)}
        size="small"
        label={getGrade(props.grade!)}
      />

      <Typography variant="subtitle1">
        {props.title} - {props.author}
      </Typography>
      <Typography variant="subtitle2">
        文本长度：{getChineseCharacterLength(props.text || "")}
      </Typography>
      <Typography variant="subtitle2">
        建议时长：{props.suggestedDuration} s
      </Typography>
      <div className="absolute left-0 top-0 h-full w-full">
        <ListItemButton className="h-full" onClick={props.onClick} />
      </div>
    </div>
  );
};

const TrainTextListPage = () => {
  const location = useLocation();
  const { title, type } = location.state || { title: "散文", type: "prose" };
  const [textList, setTextList] = useState<TrainText[]>(() => {
    const savedList = sessionStorage.getItem("textList");
    return savedList ? JSON.parse(savedList) : [];
  });
  const navigator = useNavigate();

  useEffect(() => {
    if (textList.length === 0) {
      GetTrainTextByCategoryAPI(type).then((res) => {
        if (res.code === 200 && res.data) {
          setTextList(res.data);
          sessionStorage.setItem("textList", JSON.stringify(res.data));
        }
      });
    }
  }, [type, textList.length]);

  return (
    <div className="h-100vh flex flex-col">
      <Navbar onBack={() => navigator(-1)}>
        <div>
          <div className="text-14px">练习</div>
          <div className="text-3">{title}</div>
        </div>
      </Navbar>
      <div className="overflow-y-auto">
        {textList.map((text, id) => (
          <TrainTextCard
            key={id}
            {...text}
            onClick={() => {
              navigator("detail", {
                state: {
                  text: text,
                },
              });
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TrainTextListPage;
