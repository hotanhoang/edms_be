exports.NotificationController = void 0;
const BaseController = require("../BaseController");
const axios = require('axios');
const constants = require("./Constants")
const Web3 = require('web3');

const defaultState = {
    swaps: {
        acceptVersion: "Latest",
        fetchParams: {
            chainId: '1',
            amountIn: '0',
            to: '',
            tokenIn: '',
            tokenOut: '',
            slippageTolerance: ''
        },
    },
};

// Swap between 2 tokens with encoded data
// Swap Params Response

class SwapsTokenController extends BaseController.BaseController {
    constructor(config, state) {
        super(config, state || defaultState);
        this.name = 'SwapsTokenController';
        this.defaultState = defaultState
        this.web3 = new Web3(new Web3.providers.HttpProvider(`${constants.CHAIN_HTTP_PROVIDER[config.chainId]}/${config.API_KEY}`));
        this.initialize();
    }
    retrieveInfoSwapTokens = (fetchParams) => {
        const { acceptVersion } = this.state.swaps;
        return new Promise(function (resolve) {
            if (fetchParams.chainId && constants.CHAIN_ID_TO_NAME_MAP[fetchParams.chainId]) {
                const headers = {
                    'Accept-Version': acceptVersion,
                    'Content-Type': 'application/json'
                };
                const params = { ...fetchParams }
                if (params.tokenIn === constants.SWAPS_CONTRACT_ADDRESS) {
                    params.tokenIn = constants.NATIVE_SWAPS_TOKEN_ADDRESS
                }
                if (params.tokenOut === constants.SWAPS_CONTRACT_ADDRESS) {
                    params.tokenOut = constants.NATIVE_SWAPS_TOKEN_ADDRESS
                }
                // console.log('URL : ', `${constants.SWAPS_API_BASE_URL}/${constants.CHAIN_ID_TO_NAME_MAP[fetchParams.chainId]}/route/encode`)
                // console.log('params : ', params)

                axios.get(`${constants.SWAPS_API_BASE_URL}/${constants.CHAIN_ID_TO_NAME_MAP[fetchParams.chainId]}/route/encode`, {
                    headers: headers,
                    params: params,
                }).then(response => {
                    resolve(response.data)
                }).catch((error) => {
                    console.log('retrieveInfoSwapTokens error : ', error)
                    resolve({
                        code: 500,
                        error: error
                    })
                });
            } else {
                resolve({
                    code: 404,
                    error: 'Not found chainId'
                })
            }
        });
    }

    estimateGas = (estimateGasOption) => {
        const web3 = this.web3
        return new Promise(function (resolve) {
            web3.eth.estimateGas(estimateGasOption, (error, data) => {
                if (error) {
                    resolve({
                        code: 500,
                        error: error
                    })
                } else {
                    resolve({
                        code: 0,
                        data: {
                            gas: data
                        }
                    })
                }
            })
        })
    }

    swapTokens = (transactionObject) => {
        const web3 = this.web3
        return new Promise(function (resolve) {
            web3.eth.sendTransaction(transactionObject, (error, data) => {
                if (error) {
                    resolve({
                        code: 500,
                        error: error
                    })
                } else {
                    resolve({
                        code: 0,
                        data: {
                            gas: data
                        }
                    })
                }
            })
        });
    }

}
exports.SwapsTokenController = SwapsTokenController;
exports.default = SwapsTokenController;
