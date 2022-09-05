//* Chain IDs and names
exports.ETH_CHAIN_ID = '1';
exports.BSC_CHAIN_ID = '56';
exports.POLYGON_CHAIN_ID = '137';
exports.AVALANCHE_CHAIN_ID = '43114';
// exports.SWAPS_TESTNET_CHAIN_ID = '1337';
exports.CHAIN_ID_TO_NAME_MAP = {
    [exports.ETH_CHAIN_ID]: 'ethereum',
    [exports.BSC_CHAIN_ID]: 'bsc',
    [exports.POLYGON_CHAIN_ID]: 'polygon',
    [exports.AVALANCHE_CHAIN_ID]: 'avalanche',
};
exports.CHAIN_HTTP_PROVIDER = {
    [exports.ETH_CHAIN_ID]: 'https://mainnet.infura.io/v3',
    [exports.BSC_CHAIN_ID]: 'https://bsc-mainnet.infura.io/v3',
    [exports.POLYGON_CHAIN_ID]: 'https://polygon-mainnet.infura.io/v3',
    [exports.AVALANCHE_CHAIN_ID]: 'https://avalanche-mainnet.infura.io/v3',
};
//* APIs base urls
// exports.API_BASE_URL = 'https://swap.metaswap.codefi.network';
// exports.DEV_BASE_URL = 'https://swap.metaswap-dev.codefi.network';
// exports.GAS_API_BASE_URL = 'https://gas.metaswap.codefi.network';

exports.SWAPS_API_BASE_URL = 'https://aggregator-api.kyberswap.com';
//* Contract addresses
//* Tokens
exports.SWAPS_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.NATIVE_SWAPS_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// exports.ETH_SWAPS_CONTRACT_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c';
// exports.BSC_SWAPS_CONTRACT_ADDRESS = '0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31';
// exports.POLYGON_SWAPS_CONTRACT_ADDRESS = '0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31';
// exports.AVALANCHE_SWAPS_CONTRACT_ADDRESS = '0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31';
// exports.WETH_CONTRACT_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
// exports.WBNB_CONTRACT_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
// exports.WMATIC_CONTRACT_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
// exports.WAVAX_CONTRACT_ADDRESS = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7';
// exports.SWAPS_WRAPPED_TOKENS_ADDRESSES = {
//     [exports.ETH_CHAIN_ID]: exports.WETH_CONTRACT_ADDRESS,
//     [exports.SWAPS_TESTNET_CHAIN_ID]: exports.WETH_CONTRACT_ADDRESS,
//     [exports.BSC_CHAIN_ID]: exports.WBNB_CONTRACT_ADDRESS,
//     [exports.POLYGON_CHAIN_ID]: exports.WMATIC_CONTRACT_ADDRESS,
//     [exports.AVALANCHE_CHAIN_ID]: exports.WAVAX_CONTRACT_ADDRESS,
// };
// exports.SWAPS_CONTRACT_ADDRESSES = {
//     [exports.ETH_CHAIN_ID]: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     [exports.BSC_CHAIN_ID]: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     [exports.POLYGON_CHAIN_ID]: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     [exports.AVALANCHE_CHAIN_ID]: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
// };
// exports.ALLOWED_CONTRACT_ADDRESSES = {
//     [exports.ETH_CHAIN_ID]: [
//         exports.SWAPS_CONTRACT_ADDRESSES[exports.ETH_CHAIN_ID],
//         exports.SWAPS_WRAPPED_TOKENS_ADDRESSES[exports.ETH_CHAIN_ID],
//     ],
//     [exports.SWAPS_TESTNET_CHAIN_ID]: [
//         exports.SWAPS_CONTRACT_ADDRESSES[exports.SWAPS_TESTNET_CHAIN_ID],
//         exports.SWAPS_WRAPPED_TOKENS_ADDRESSES[exports.SWAPS_TESTNET_CHAIN_ID],
//     ],
//     [exports.BSC_CHAIN_ID]: [
//         exports.SWAPS_CONTRACT_ADDRESSES[exports.BSC_CHAIN_ID],
//         exports.SWAPS_WRAPPED_TOKENS_ADDRESSES[exports.BSC_CHAIN_ID],
//     ],
//     [exports.POLYGON_CHAIN_ID]: [
//         exports.SWAPS_CONTRACT_ADDRESSES[exports.POLYGON_CHAIN_ID],
//         exports.SWAPS_WRAPPED_TOKENS_ADDRESSES[exports.POLYGON_CHAIN_ID],
//     ],
//     [exports.AVALANCHE_CHAIN_ID]: [
//         exports.SWAPS_CONTRACT_ADDRESSES[exports.AVALANCHE_CHAIN_ID],
//         exports.SWAPS_WRAPPED_TOKENS_ADDRESSES[exports.AVALANCHE_CHAIN_ID],
//     ],
// };

// exports.ETH_SWAPS_TOKEN_OBJECT = {
//     symbol: 'ETH',
//     name: 'Ether',
//     address: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     decimals: 18,
// };
// exports.BSC_SWAPS_TOKEN_OBJECT = {
//     symbol: 'BNB',
//     name: 'Binance Coin',
//     address: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     decimals: 18,
// };
// exports.POLYGON_SWAPS_TOKEN_OBJECT = {
//     symbol: 'MATIC',
//     name: 'Matic',
//     address: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     decimals: 18,
// };
// exports.AVALANCHE_SWAPS_TOKEN_OBJECT = {
//     symbol: 'AVAX',
//     name: 'Avalanche',
//     address: exports.NATIVE_SWAPS_TOKEN_ADDRESS,
//     decimals: 18,
// };
// exports.SWAPS_NATIVE_TOKEN_OBJECTS = {
//     [exports.ETH_CHAIN_ID]: exports.ETH_SWAPS_TOKEN_OBJECT,
//     [exports.SWAPS_TESTNET_CHAIN_ID]: exports.ETH_SWAPS_TOKEN_OBJECT,
//     [exports.BSC_CHAIN_ID]: exports.BSC_SWAPS_TOKEN_OBJECT,
//     [exports.POLYGON_CHAIN_ID]: exports.POLYGON_SWAPS_TOKEN_OBJECT,
//     [exports.AVALANCHE_CHAIN_ID]: exports.AVALANCHE_SWAPS_TOKEN_OBJECT,
// };

// const InfuraKey = process.env.MM_INFURA_PROJECT_ID;

// exports.ETH_CHAIN_ID = '1'; // ethereum
// exports.BSC_CHAIN_ID = '56'; // bsc
// exports.POLYGON_CHAIN_ID = '137'; // polygon
// exports.AVALANCHE_CHAIN_ID = '43114'; // avalanche
// exports.SWAPS_TESTNET_CHAIN_ID = '1337';

// const NetworkList = {
//     [MAINNET]: {
//         name: 'Ethereum Main Network',
//         shortName: 'Ethereum',
//         networkId: 1,
//         chainId: 1,
//         hexChainId: '0x1',
//         color: '#3cc29e',
//         networkType: 'mainnet',
//     },
//     [ROPSTEN]: {
//         name: 'Ropsten Test Network',
//         shortName: 'Ropsten',
//         networkId: 3,
//         chainId: 3,
//         hexChainId: '0x3',
//         color: '#ff4a8d',
//         networkType: 'ropsten',
//     },
//     [KOVAN]: {
//         name: 'Kovan Test Network',
//         shortName: 'Kovan',
//         networkId: 42,
//         chainId: 42,
//         hexChainId: '0x2a',
//         color: '#7057ff',
//         networkType: 'kovan',
//     },
//     [RINKEBY]: {
//         name: 'Rinkeby Test Network',
//         shortName: 'Rinkeby',
//         networkId: 4,
//         chainId: 4,
//         hexChainId: '0x4',
//         color: '#f6c343',
//         networkType: 'rinkeby',
//     },
//     [GOERLI]: {
//         name: 'Goerli Test Network',
//         shortName: 'Goerli',
//         networkId: 5,
//         chainId: 5,
//         hexChainId: '0x5',
//         color: '#3099f2',
//         networkType: 'goerli',
//     },
// };