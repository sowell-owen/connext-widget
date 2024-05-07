"use client"; // this is a client component
import { Card, CardContent } from "@mui/material";
import WidgetTabs from "./tabs/tabs";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeSwitcher from "./theme-switcher/theme-switcher";
import { useEffect, useMemo, useState } from "react";



export default function Widget() {
    const [ darkMode, setDarkMode ] = useState(false);

    // memoized MUI theme value
    const theme = useMemo(() => 
        createTheme({
            palette: {
                mode: darkMode ? 'dark' : 'light',
            },
        }),
    [darkMode]);
    
    // reads theme value (dark or light) from local storage and updates state
    useEffect(() => {
        const mode = JSON.parse(localStorage.getItem("connext-widget-theme") as string)?.theme || "light";
        setDarkMode(mode === "dark");
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Card sx={{ maxWidth: "500px", width: '450px', position: 'relative' }}>
                <ThemeSwitcher darkMode={darkMode} setDarkMode={setDarkMode}/>
                <CardContent sx={{p: 2, "&:last-child": { paddingBottom: 0 }}}>
                    <WidgetTabs />
                </CardContent>
            </Card>
        </ThemeProvider>
    );
}