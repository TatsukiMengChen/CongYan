import React from "react";
import Navbar from "../../../../components/Navbar";

interface CorpusHeaderProps {
  onBack: () => void;
  corpusCount: number;
}

const CorpusHeader: React.FC<CorpusHeaderProps> = ({ onBack, corpusCount }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100">
      <Navbar onBack={onBack}>语料管理</Navbar>
    </div>
  );
};

export default CorpusHeader;
