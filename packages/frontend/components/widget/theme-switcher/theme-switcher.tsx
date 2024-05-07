import { FormControlLabel, Switch } from "@mui/material";

export default function ThemeSwitcher(props: {
    darkMode: boolean,
    setDarkMode: (a: boolean) => void;
}) {
    const { darkMode, setDarkMode } = props;

    // handles swicth click
    const changeTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isCHecked = e.target.checked;
        localStorage.setItem("connext-widget-theme", JSON.stringify({ theme: isCHecked ? 'dark' : 'light' })); 
        setDarkMode(isCHecked);
    }

    return (
        <FormControlLabel 
            control={<Switch checked={darkMode} onChange={changeTheme} />} 
            label="Darkmode"
            sx={{ position: 'absolute', right: 0, top: 5, zIndex: 99 }}
        />
    );
}