import MuiTextField, { TextFieldProps } from "@mui/material/TextField";
import useInputStore from "../store/input";

const TextField: React.FC<TextFieldProps> = (props) => {
  const { setInput: setIsTyping } = useInputStore();

  return (
    <MuiTextField
      {...props}
      onFocus={() => setIsTyping(true)}
      onBlur={() => setIsTyping(false)}
    />
  );
};

export default TextField;
