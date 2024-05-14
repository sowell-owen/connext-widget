import { Box, Button, Link, Step, StepLabel, Stepper, Typography } from "@mui/material";
import * as React from 'react';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';
import { SdkUtils } from "@connext/sdk";
import { TXTransferStatus } from "./types";
import { OpenInNew, Verified } from "@mui/icons-material";

// used to get MM:SS string from seconds
const toMMSS = (sec_num: number) =>  {
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    const retM = minutes < 10 ? "0"+minutes : minutes
    const retS = seconds < 10 ? "0"+seconds : seconds

    return retM+':'+retS;
}


function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number, time: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" size={180} {...props} />
        <Box
            sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Typography
            variant="caption"
            component="div"
            color="text.secondary"
            fontSize={35}
            fontWeight="bold"
            >{`${toMMSS(Math.round(props.time))}`}</Typography>
        </Box>
    </Box>
  );
}

// tx steps to display in UI
const steps = ["XCalled", "Completed"];
// maximum time to wait for tx completion
const totalTime = 5 * 60;


export default function Loader(props: {
    hash: string,
    setTxHash: (a: string) => void;
    sdkUtils: SdkUtils | undefined;
    from: string;
    to: string;
}) {
    const { hash, setTxHash, sdkUtils, from, to } = props;
    const [ counter, setCounter ] = React.useState(0);
    const [ status,  setStatus  ] = React.useState<TXTransferStatus>("XCalled");

    const isFinished = counter === totalTime;

    // returns user to main page by setting txHash ""
    const handleGoBack = () => {
        setTxHash("");
    }

    // used for time calculation
    React.useEffect(() => {
        if (["CompletedFast", "CompletedSlow", "Executed"].includes(status)) {
            setCounter(totalTime);
            return;
        }
        // updates counter if counter is < 5min
        const timer = counter < totalTime && setInterval(() => setCounter(counter + 1), 1000);
        /* @ts-ignore */
        return () => clearInterval(timer);
    }, [counter]);

    // used for fetching tx data (every 3 sec)
    React.useEffect(() => {
        if (sdkUtils && hash.length > 0 && !["CompletedFast", "CompletedSlow", "Executed"].includes(status)) {
            const timer = counter < 5 * 60 && setInterval(async() => {
                // fetch transfers from connextscan by txHash
                const transfers = await sdkUtils?.getTransfers({
                    transactionHash: hash,
                });

                // transaction exists
                if (transfers.length > 0) {
                    console.log(transfers[0]);
                    const statusDT = transfers[0].status;
                    setStatus(statusDT);
                }
            }, 3000);
            /* @ts-ignore */
            return () => clearInterval(timer);
        } else if (counter >= totalTime) {
            clearInterval(counter);
        }
    }, [hash, sdkUtils, status])



    return (
        <>
            <Stepper activeStep={steps.indexOf(status) !== -1 ? steps.indexOf(status) : steps.length } alternativeLabel>
                <Step>
                    <StepLabel>{from}</StepLabel>
                </Step>
                <Step>
                    <StepLabel>{to}</StepLabel>
                </Step>
            </Stepper>
            <Box sx={{ height: '285px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgressWithLabel time={totalTime - counter} value={((totalTime - (totalTime - counter)) * 100) / (totalTime)}/>
            </Box>
            <Button
                startIcon={<Verified/>}
                disabled={!["CompletedFast", "CompletedSlow", "Executed"].includes(status)}
                fullWidth
                variant="contained"
                sx={{ fontWeight: "bold", padding: 2 }}
                onClick={handleGoBack}
            >
                Completed, go back
            </Button>
            <Link
                target="_blank"
                href={`https://connextscan.io/tx/${hash}`}
                underline={isFinished ? "always" : "none"}
                color={isFinished ? "primary" : "inherit"}
                sx={{
                    display:'flex',
                    justifyContent:'center',
                    alignItems: 'center',
                    width: '100%',
                    opacity: isFinished ? 1 : 0.5,
                    cursor: isFinished ? 'pointer' : 'default',
                    mt: 2,
                }}
            >
                <OpenInNew sx={{ mr: 1 }}/>
                View Transaction
            </Link>
        </>
    );
}