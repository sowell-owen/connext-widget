// converts network name to Sentence Case (if should be in that case)
export default function toSentenceCase(str: string) {
    if (str === "xlayer") return "XLayer"
    if (str === "bsc") return "BSC"
    return str[0].toUpperCase() + str.slice(1, str.length);
}