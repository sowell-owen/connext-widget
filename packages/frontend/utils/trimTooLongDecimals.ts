// this function trims too long decimals. (decimals is set for 18 as default for ETH)
export default function trim_decimal_overflow(n: string, decimals=18){
    if(n.indexOf(".") === -1) return n
    
    const arr = n.split(".");
    const fraction = arr[1] .substr(0, decimals);
    return arr[0] + "." + fraction;
}