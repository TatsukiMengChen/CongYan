import { useNavigate } from "react-router";
import Navbar from "../../../../../components/Navbar";
import { useTextContext } from "../context/TextContext";

export const NavArea = ({ title, author }: { title: string; author: string }) => {
  const navigator = useNavigate();
  const { currentAudio } = useTextContext();
  return (
    <Navbar
      onBack={() => {
        currentAudio?.pause();
        navigator(-1);
      }}
    >
      <div>
        <div className="text-14px">{title}</div>
        <div className="text-3">{author}</div>
      </div>
    </Navbar>
  );
};
