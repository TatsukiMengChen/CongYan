import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { GetTrainTextByCategoryAPI, TrainText } from "../../api/train";
import Navbar from "../../components/Navbar";

const TrainTextListPage = () => {
  const location = useLocation();
  const { title, type } = location.state || { title: "散文", type: "prose" };
  const [textList, setTextList] = useState<TrainText[]>([]);
  const navigator = useNavigate();

  useEffect(() => {
    GetTrainTextByCategoryAPI(type).then((res) => {
      if (res.code === 0 && res.data) {
        setTextList(res.data);
      }
    });
  }, [type]);

  return (
    <div>
      <Navbar onBack={() => navigator(-1)}>
        <div>
          <div className="text-14px">练习</div>
          <div className="text-3">{title}</div>
        </div>
      </Navbar>
      <div>
        {textList.map((text) => (
          <div key={text.id}>{text.title}</div>
        ))}
      </div>
    </div>
  );
};

export default TrainTextListPage;
