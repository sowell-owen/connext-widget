// returns formatted funds (first 8 chars) (if the str exists)
export function formatFunds(str: string) {
    if (!str) {
        return "--";
    }
    return str.slice(0, 8);
}

// returns formatted funds (first 8 chars with currency) (if the str exists)
export function formatFundsWithSymbol(str: string) {
    if (!str) {
        return "--";
    }
    const splitted = str.split(' ');
    return `${splitted[0].slice(0, 8)} ${splitted[1]}`
}