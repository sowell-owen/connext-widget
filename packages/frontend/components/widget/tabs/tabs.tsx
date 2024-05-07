import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Deposit from '../tabs-content/deposit/deposit';


// mui tab
function CustomTabPanel(props: {
    children: React.ReactNode;
    value: number;
    index: number;
}) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

// used for generating props for Tab component
function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function WidgetTabs() {
    const [value, setValue] = React.useState(0);

    // handler which is used to chnage current tab
    const handleChange = (event: React.SyntheticEvent<Element, Event>, newValue: React.SetStateAction<number>) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={e => handleChange} aria-label="basic tabs example" variant="fullWidth">
                    <Tab label="Deposit" {...a11yProps(0)} />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <Deposit />
            </CustomTabPanel>
        </Box>
    );
}