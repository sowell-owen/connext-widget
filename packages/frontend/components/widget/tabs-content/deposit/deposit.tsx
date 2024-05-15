"use client"; // this is a client component

import {
    Avatar,
    Paper,
    Button,
    Stack,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    InputAdornment,
    TextField,
    LinearProgress,
    Tooltip,
    CircularProgress
} from "@mui/material";
import { SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useBalance, useAccount, useSwitchChain, usePublicClient } from "wagmi";
import { DESTINATION_DOMAIN_ID, DEST_VAULT, VAULT_ADAPTER_ADDRESS, VAULT_ADPATER_CHAIN_ID } from "../../../../constants";
import { wagmiConfigCore, generateSDKConfig, WETH_CONFIG, chains } from "../../../../config/widget-config";
import { SdkBase, SdkUtils, create } from "@connext/sdk";
import { ethers, BigNumber } from "ethers";
import { useEthersSigner } from "../../../../hooks/useEthersSigner";
import { TBalanceCfg, TBalanceInChain, TChain } from "./types";
import { getBalance } from '@wagmi/core'
import {parseEther, formatEther, maxInt256, maxUint256} from "viem";
import toSentenceCase from "../../../../utils/toSentenceCase";
import { formatFunds, formatFundsWithSymbol } from "../../../../utils/formatting";
import trim_decimal_overflow from "../../../../utils/trimTooLongDecimals";
import Loader from "../loader/loader";
import { Error, ManageAccounts, PriceCheck, Wallet } from "@mui/icons-material";
import { useNativeCurrency } from "../../../../hooks/useNativeCurrency";


const tokens = [
    {
        img: "https://cdn3.emoji.gg/emojis/3031-ethereum.png",
        name: "Ethereum"
    }
]


export default function Deposit() {
    const inputRef = useRef<null | HTMLInputElement>();
    const [ txPending,        setTxPending        ] = useState(false);          // used to show loading spinner when tx was sent
    const [ token,            setToken            ] = useState("Ethereum");     // selected token
    const [ relayerFee,       setRelayerFee       ] = useState("Select chain"); // fee, payed to relayers on tx (in native currency)
    const [ relayerFeeBase,   setRelayerFeeBase   ] = useState<BigNumber>();    // value from connextSDK.estimateRelayerFee
    const [ estimateGasValue, setEstimateGasValue ] = useState("0");
    const [ amountReceived,   setAmountReceived   ] = useState("0");
    const [ enteredETH,       setEnteredETH       ] = useState("0");
    const [ maxFeePerGas,     setMaxFeePerGas     ] = useState("0");
    const [ connextSDK,       setConnextSDK       ] = useState<SdkBase           | undefined>(undefined); // the  CONNEXT sdk BASE object
    const [ connextSDKUtils,  setConnextSDKUtils  ] = useState<SdkUtils          | undefined>(undefined); // the  CONNEXT sdk UTILS object
    const [ chain,            setChain            ] = useState<TChain            | undefined>(undefined); // chain, selected by user
    const [ supportedChains,  setSupportedChains  ] = useState<TChain[]          | undefined>(undefined); // all available chains (got from sdk config after connextSDK init)
    const [ balances,         setBalances         ] = useState<TBalanceInChain[] | undefined>(undefined); // user balances in all available chains
    const [ populatedTx,      setPopulatedTx      ] = useState<ethers.providers.TransactionRequest | undefined>(undefined);
    const [ calculatingFees,  setCalculatingFees  ] = useState(false);  // used to track fees calculation status
    const [ txHash,           setTxHash           ] = useState("");     // transaction hash which was xCalled (if !== "" the timer will appear)
    const [ error,            setError            ] = useState(false);
    const [ dynamicBtnText,   setDynamicBtnText   ] = useState("Deposit")

    // ethers signer object
    const signer = useEthersSigner({chainId: chain?.chainId});

    // used to switch chain on connected wallet client
    const { switchChainAsync } = useSwitchChain();
    // just opens rainbowkit connect modal
    const { openConnectModal } = useConnectModal();

    // current user wallet data
    const { address, isConnected, chainId: currentChainIdInWallet } = useAccount();
    const publicClient = usePublicClient();

    // used to get chain
    const getChain = (): TChain => {
        return supportedChains?.find(i => i.name === chain?.name) as TChain || supportedChains?.[0] as TChain
    }

    // current user native currency
    const nativeCurrency = useNativeCurrency();

    // current user native balance
    const { data: nativeBalance } = useBalance({
        address: address,
    });

    // used for initializing connextSDK
    useEffect(() => {
        const run = async () => {
            if (!address || !isConnected) return;
            const sdkConfig = generateSDKConfig(address, "mainnet");

            // initialize the connextSDK
            const connextSDKInstance = await create(sdkConfig);
            setConnextSDK(connextSDKInstance.sdkBase);
            setConnextSDKUtils(connextSDKInstance.sdkUtils);
            await connextSDKInstance.sdkBase.getSupported().then(data => {
                setSupportedChains(data.filter(i => i.chainId !== +VAULT_ADPATER_CHAIN_ID));
                setChain(data[0]);

                // fetch and write balances into state
                const balancesData: TBalanceInChain[] = [];
                data.forEach(ch => {
                    const cfg: TBalanceCfg = {
                        address,
                        chainId: ch.chainId,
                    }

                    if (["xdai", "metis", "polygon", "bsc"].includes(ch.name)) {
                        cfg.token = WETH_CONFIG[+ch.domainId] as `0x${string}`;
                    }

                    /* @ts-ignore */
                    getBalance(wagmiConfigCore, cfg).then(balanceInfo => {
                        balancesData.push({ chainId: ch.chainId as number, balance: `${balanceInfo.formatted} ${balanceInfo.symbol}`})
                    });
                });
                setBalances(balancesData);
            });
        }
        run();
    }, [address, isConnected]);

    // used for getting balance on current chain
    const cfg = {
        address: address,
        chainId: chain?.chainId,
    }
    if (["xdai", "metis", "polygon", "bsc"].includes(chain?.name as string)) {
        /* @ts-ignore */
        cfg.token = WETH_CONFIG[+chain?.domainId];
    }

    const {data: userBalance} = useBalance(cfg);

    const prepareTx = useCallback(async() => {
        setPopulatedTx(undefined);

        // Prepare the xcall params
        const originDomain = chain?.domainId;
        console.log("Entered ether:", enteredETH)
        const etherToSendInWei = parseEther(trim_decimal_overflow(enteredETH, 18));
        console.log(userBalance)
        // calldata generates inside the contract
        const xcallParams = {
            origin: originDomain,                // domain id (selected by current user)
            destination: DESTINATION_DOMAIN_ID,  // domain id of the dest chain (where the vault contarct is deployed)
            to: DEST_VAULT,                      // the address that should receive the funds on destination
            delegate: VAULT_ADAPTER_ADDRESS,     // address allowed to execute transaction on destination side in addition to relayers
            asset: WETH_CONFIG[Number(originDomain as string)],   // address of the token contract
            slippage: "300", // the maximum amount of slippage the user will accept in BPS (e.g. 30 = 0.3%)
            amount: etherToSendInWei.toString(), // amount to transfer
            wrapNativeOnOrigin: userBalance?.symbol === "ETH" && chain?.domainId !== "6450786", // true if ETH is native currency and not BSC
            callData: "0x",  // empty calldata for a simple transfer (byte-encoded)
            relayerFee: relayerFeeBase?.toString(), // fee paid to relayers
        }

        // perform an xcall
        const xcallTxReq = await connextSDK?.xcall(xcallParams);
        if (!xcallTxReq) return;

        console.log('xcall:', xcallTxReq);

        // generate raw tx
        const populatedTx = await signer?.populateTransaction({
            ...xcallTxReq,
            gasLimit: 1000000,
            gasPrice: await publicClient?.getGasPrice(),
        });
        console.log('populated tx: ', populatedTx, await publicClient?.getGasPrice());

        // update ui
        setEstimateGasValue(formatEther(populatedTx?.gasLimit as bigint))
        if (populatedTx?.maxFeePerGas) {
            setMaxFeePerGas(formatEther(populatedTx?.maxFeePerGas as bigint))
        } else {
            setMaxFeePerGas("0");
        }
        setPopulatedTx({...populatedTx });
        setCalculatingFees(false);

        return populatedTx;
    }, [chain?.domainId, userBalance, enteredETH, relayerFeeBase, signer, publicClient, connextSDK]);

    // used to calculate estimate gas on chain change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                if (chain?.domainId && signer && isConnected && chain?.chainId === currentChainIdInWallet && connextSDK !== undefined && userBalance?.symbol && Number(enteredETH) >= 0) {
                    setCalculatingFees(true);
                    setError(false);

                    prepareTx();
                }
            } catch (error) {
                setError(true);
                console.log(error);
            }
        }, 750);


        return () => {
            clearTimeout(timer);
        }
    }, [chain, signer, isConnected, currentChainIdInWallet, connextSDK, enteredETH, userBalance?.symbol]);


    // chain change
    const handleChainChange = (event: { target: { value: SetStateAction<string>; }; }) => {
        setError(false);
        const selectedChain = supportedChains?.find(i => i.name === event.target.value.toString().toLowerCase());
        setChain(selectedChain);
    };

    // token change
    const handleTokenChange = (event: { target: { value: SetStateAction<string>; }; }) => {
        setToken(event.target.value);
    };

    // used to get availbaleDeposit
    const getAvailableDeposit = (startNumber: number=0) => {
        const maxFPerGas = Number(maxFeePerGas);
        const relFee = Number(relayerFee);
        const esGas = Number(estimateGasValue);

        // if ETH is native currency
        if (nativeCurrency === "ETH") {
            if (startNumber !== 0) {
                return startNumber - maxFPerGas - relFee - esGas;
            } else {
                // calc from max available
                return Number(userBalance?.formatted) - maxFPerGas - relFee - esGas;
            }
        }
        // check native balance and WETH balance
        else {
            const balance = balances?.find(i => i.chainId === chain?.chainId)?.balance.split(' ')[0];
            // calculate in WETH first
            let couldBeDepositedInWETH;
            if (startNumber !== 0) {
                couldBeDepositedInWETH = startNumber - maxFPerGas - esGas;
            } else {
                // calc from max available weth
                couldBeDepositedInWETH = Number(balance) - maxFPerGas - esGas;
            }

            return couldBeDepositedInWETH;
        }
    }

    // handle use max btn click
    const handleMaxETHClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        let availableDeposit = getAvailableDeposit();
        //console.log("AV DEP:", availableDeposit);
        if (Number(availableDeposit) < 0) {
            availableDeposit = "0.00";
        } else {
            availableDeposit = (""+availableDeposit).slice(0, 8);
        }
        availableDeposit = (""+availableDeposit).slice(0, 8);
        setEnteredETH(availableDeposit);
        inputRef?.current && (inputRef.current.value = availableDeposit)
    }

    // executes every time on input value change
    const handleETHInputChange = async(e: any) => {
        const prevValue = enteredETH;
        const enteredValue = e.target.value as string;

        // validate input (must be numeric)
        if (enteredValue.startsWith("0") && enteredValue.length == 2 && enteredValue[1] !== ".") {
            inputRef.current && (inputRef.current.value = prevValue);
            return;
        }

        // do not update value if the input is invalid
        if (isNaN(+enteredValue)) {
            inputRef.current && (inputRef.current.value = prevValue)
        }
        // in other way calculate fees and update state
        else {
            setCalculatingFees(true);
            setEnteredETH(enteredValue);
        }
    };

    // used to calculate amount received on entered value changed
    useEffect(() => {
        const calculateAmountReceived = async() => {
            const selectedChainToDeposit = getChain();
            await connextSDK?.calculateAmountReceived(
                selectedChainToDeposit?.domainId as string, // originDomain
                DESTINATION_DOMAIN_ID,           // destinationDomain
                WETH_CONFIG[+(selectedChainToDeposit?.domainId as string)], // The address of the token to be bridged from origin.
                Number(parseEther(enteredETH))              // amount
            ).then(data => {
                setAmountReceived(formatEther(data.amountReceived as bigint))
            }).catch(console.error);
        }
        if (chain?.chainId && +enteredETH > 0) {
            calculateAmountReceived();
        }
    }, [chain, enteredETH]);


    // used for connecting wallet
    const handleConnectWalletClick = async() => {
        if (!isConnected && openConnectModal) {
            openConnectModal();
            return;
        }
    }

    // used for swicthing chin
    const handleSwicthChainClick = async() => {
        const selectedChainToDeposit = getChain();
        switchChainAsync({chainId: selectedChainToDeposit?.chainId as number});
    }

    // handles the deposit button click and sends the tx to connext
    const handleDepositClick = async () => {
        setError(false);
        setTxPending(true);

        if (!isConnected || !signer) {
            console.log('Not connected | no signer')
            return;
        }

        try {
            const originDomain = Number(chain?.domainId);
            // Approve the asset transfer if the current allowance is lower than the amount.
            // Necessary because funds will first be sent to the Connext contract in xcall.
            const approveTxReq = await connextSDK?.approveIfNeeded(
                "" + originDomain,
                WETH_CONFIG[+originDomain],
                maxUint256.toString(),
            )

            // send approve tx if needed
            let populatedTxToSend = populatedTx;
            if (approveTxReq) {
                setDynamicBtnText("Validating...")
                const approveTxReceipt = await signer.sendTransaction(approveTxReq);
                await approveTxReceipt.wait();
                populatedTxToSend = await prepareTx();
            }

            setDynamicBtnText("Depositing...")
            const xcallTxReceipt = await signer?.sendTransaction(populatedTxToSend as ethers.providers.TransactionRequest);
            console.log('xcall receipt: ', xcallTxReceipt);
            await xcallTxReceipt.wait();

            // set tx hash
            setTxHash(xcallTxReceipt.hash);
        } catch (e) {
            setError(true);
            console.log('Error: ', e);
        } finally {
            setTxPending(false);
            setDynamicBtnText("Deposit");
        }
    }

    // recalculate estimateRelayerFee
    useEffect(() => {
        if (connextSDK && address && isConnected && supportedChains) {
            connextSDK.estimateRelayerFee({
                originDomain: chain?.domainId || supportedChains?.[0].domainId,
                destinationDomain: DESTINATION_DOMAIN_ID,
                priceIn: "native",
            }).then(data => {
                data && setRelayerFeeBase(data);
                data && setRelayerFee(formatEther(data.toBigInt()));
            });
        }
    }, [chain?.chainId, connextSDK, address, isConnected, supportedChains]);


    // used for getting fromated output of bigint value (passed as string)
    const fOutput = (value: string, isNative: boolean=false) => {
        if (isConnected && userBalance?.symbol) {
            if (chain?.chainId !== currentChainIdInWallet) return "Switch chain"
            return `${formatFunds(value)} (${isNative ? nativeCurrency : userBalance?.symbol})`;
        } else {
            return "--";
        }
    }


    return (
        <>
            {(() => {
                if (txHash.length > 0) {
                    return <Loader
                        hash={txHash}
                        setTxHash={setTxHash}
                        sdkUtils={connextSDKUtils}
                        from={toSentenceCase(chain?.name as string || "unknown")}
                        to={toSentenceCase(chains?.find(c => c.domain_id == DESTINATION_DOMAIN_ID)?.name as string || "unknown")}
                    />
                } else {
                    return (
                        <>
                            {
                                txPending
                                &&
                                <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }}>
                                    <LinearProgress />
                                </Box>
                            }
                            <Stack spacing={1} mb={2} display="flex" justifyContent="space-between" alignItems="center" direction="row">
                            <FormControl variant="filled" sx={{width: "100%", textAlign: "start"}}>
                                <InputLabel id="chain-select-filled-label">Chain</InputLabel>
                                <Select
                                    disabled={!isConnected || txPending}
                                    labelId="chain-select-filled-label"
                                    value={chain?.name ? toSentenceCase(chain?.name) : "Xdai"}
                                    onChange={handleChainChange}
                                >
                                    {supportedChains &&
                                        supportedChains.map((i, k) => {
                                            const isSelected = chain?.name ? toSentenceCase(chain.name) === toSentenceCase(i.name) : "Xdai" === toSentenceCase(i.name);
                                            return (
                                                <MenuItem value={toSentenceCase(i.name)} key={k}>
                                                    <Box sx={{display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                                                        <Typography>{toSentenceCase(i.name)}</Typography>
                                                        {!isSelected &&
                                                            (() => {
                                                                const balance = balances?.find(j => j.chainId === i.chainId)?.balance;
                                                                if (balance) {
                                                                    return (
                                                                        <Tooltip title={balance} placement="right">
                                                                            <Typography fontSize={12} fontWeight="bold" sx={{ color: '#1769aa' }}>
                                                                                {formatFundsWithSymbol(balance as string)}
                                                                            </Typography>
                                                                        </Tooltip>
                                                                    )
                                                                } else {
                                                                    return (
                                                                        <Typography>--</Typography>
                                                                    );
                                                                }
                                                            })()
                                                        }
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>


                                <FormControl variant="filled" sx={{width: "100%", textAlign: "start"}}>
                                    <InputLabel id="token-select-filled-label">Token</InputLabel>
                                    <Select
                                        labelId="token-select-filled-label"
                                        value={token}
                                        onChange={handleTokenChange}
                                        disabled
                                    >
                                        {
                                            tokens.map((i, k) => {
                                                return (
                                                    <MenuItem value={i.name} key={k}>
                                                        <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                                                            <Avatar src={i.img} alt={i.name} sx={{width: "20px", height: "20px"}}/>
                                                            <Typography>{i.name}</Typography>
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })
                                        }
                                    </Select>
                                </FormControl>
                            </Stack>

                            <TextField
                                //disabled={!isConnected || txPending || calculatingFees}
                                inputRef={inputRef}
                                id="input-with-icon-adornment"
                                fullWidth
                                type="number"
                                InputProps={{
                                    onInput: handleETHInputChange,
                                    sx: {
                                        my: 1,
                                        height: '100px',
                                        fontSize: '25px',
                                        fontWeight: 'bold'
                                    },
                                    defaultValue: 0.00,
                                    multiline: true,
                                    rows: 2,
                                    endAdornment:
                                        <InputAdornment position="end">
                                            <Box sx={{gap: 1, display: 'flex', alignItems: 'flex-end', flexDirection: 'column'}}>
                                                <Typography fontSize={16} fontWeight="bold">🚀 {userBalance?.symbol}</Typography>
                                                <Typography fontSize={12} fontWeight="bold">Balance {formatFunds(userBalance?.formatted as string)} {userBalance?.symbol}</Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={handleMaxETHClick}
                                                    sx={{borderRadius: 25, fontSize: "10px", p: 0, m: 0, width: "fit-content"}}
                                                    disabled={ calculatingFees || txPending || !isConnected || Number(userBalance?.formatted) === 0 }
                                                >
                                                    Use max
                                                </Button>
                                            </Box>
                                        </InputAdornment>
                                    }
                                }
                            />

                            <Paper>
                                <Stack borderRadius={2} my={2} padding={1} display="flex" justifyContent="space-between"
                                    direction="row">
                                    <Box sx={{display: 'flex', alignItems: 'flex-start', flexDirection: 'column'}}>
                                        <Typography fontSize={14}>Estimate gas</Typography>
                                        <Typography fontSize={14}>Relayer fee</Typography>
                                        <Typography fontSize={14}>Max fees per gas</Typography>
                                        <Typography fontSize={14}>Approximate time</Typography>
                                        <Typography fontSize={14}>To deposit</Typography>
                                    </Box>

                                    <Box sx={{display: 'flex', alignItems: 'flex-end', flexDirection: 'column'}}>
                                        {
                                            calculatingFees ?
                                            <CircularProgress size={20} sx={{ p: 0.44 }}/> :
                                            <Tooltip title={estimateGasValue} placement="left">
                                                <Typography fontSize={14} fontWeight="bold">
                                                    {fOutput(estimateGasValue)}
                                                </Typography>
                                            </Tooltip>
                                        }

                                        <Tooltip title={relayerFee} placement="left">
                                            <Typography fontSize={14} fontWeight="bold">
                                                {fOutput(relayerFee, true)}
                                            </Typography>
                                        </Tooltip>

                                        {
                                            calculatingFees ?
                                            <CircularProgress size={20} sx={{ p: 0.44 }}/> :
                                            <Tooltip title={maxFeePerGas} placement="left">
                                                <Typography fontSize={14} fontWeight="bold">
                                                    {fOutput(maxFeePerGas)}
                                                </Typography>
                                            </Tooltip>
                                        }
                                        <Typography fontSize={14} fontWeight="bold">
                                            {`< 5 minutes`}
                                        </Typography>
                                        {
                                            calculatingFees ?
                                            <CircularProgress size={20} sx={{ p: 0.44 }}/> :
                                            <Tooltip title={amountReceived} placement="left">
                                                <Typography fontSize={14} fontWeight="bold">
                                                    {fOutput(amountReceived)}
                                                </Typography>
                                            </Tooltip>
                                        }
                                    </Box>
                                </Stack>
                            </Paper>

                            {
                                (() => {
                                    if (isConnected && (chain?.chainId !== currentChainIdInWallet)) {
                                        return (
                                            <Button startIcon={<ManageAccounts/>} onClick={handleSwicthChainClick}  fullWidth variant="contained" sx={{ fontWeight: "bold", padding: 2 }}>
                                                Switch chain
                                            </Button>
                                        );
                                    } else if (!isConnected) {
                                        return (
                                            <Button startIcon={<Wallet/>} onClick={handleConnectWalletClick}  fullWidth variant="contained" sx={{ fontWeight: "bold", padding: 2 }}>
                                                Connect wallet
                                            </Button>
                                        );
                                    } else if (
                                        !inputRef?.current?.value ||
                                        (Number(inputRef?.current?.value) > Number(userBalance?.formatted)) ||
                                        +inputRef?.current?.value > getAvailableDeposit() ||
                                        inputRef?.current?.value && (+inputRef?.current?.value == 0 || getAvailableDeposit(+inputRef?.current?.value) < 0) ||
                                        Number(nativeBalance?.formatted) - Number(relayerFee) < 0
                                    ) {
                                        return (
                                            <Button startIcon={<Error/>} disabled={true} fullWidth color="error" variant="contained"
                                                sx={{ fontWeight: "bold",  padding: 2, ":disabled": { backgroundColor: "#FA8072", color: 'white'} }}
                                            >
                                                {(() => {
                                                    if (inputRef?.current?.value && (+inputRef?.current?.value == 0)) {
                                                        return "Unsufficient balance";
                                                    }

                                                    if (Number(nativeBalance?.formatted) - Number(relayerFee) < 0) {
                                                        return `Not enough ${nativeBalance?.symbol} balance`;
                                                    }

                                                    if (getAvailableDeposit(Number(amountReceived)) < 0) {
                                                        return "Fees greater than estimate received";
                                                    } else {
                                                        return "Unsufficient balance";
                                                    }
                                                })()}
                                            </Button>
                                        );
                                    } else {
                                        return (
                                            error
                                            ?
                                            <Button startIcon={<Error/>} disabled={!error} onClick={handleDepositClick} color="error" fullWidth variant="contained" sx={{ fontWeight: "bold", padding: 2 }}>
                                                An error occured, pls try again
                                            </Button>
                                            :
                                            <Button startIcon={<PriceCheck/>} disabled={txPending || calculatingFees || populatedTx === undefined} onClick={handleDepositClick} fullWidth variant="contained" sx={{ fontWeight: "bold", padding: 2 }}>
                                                {dynamicBtnText}
                                            </Button>
                                        );
                                    }
                                })()
                            }
                        </>
                    );
                }
            })()}
        </>
    );
}