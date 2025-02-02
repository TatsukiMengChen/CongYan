import { useTheme } from "@mui/material/styles";
import { NavBar, NavBarProps } from "antd-mobile";

const Navbar = (props: NavBarProps) => {
  const theme = useTheme();

  return (
    <NavBar
      {...props}
      style={{
        backgroundColor: theme.palette.mode === "dark" ? "#1A1C1E" : "#FCFCFF",
        color: theme.palette.text.primary,
        ...props.style,
      }}
    />
  );
};

export default Navbar;
