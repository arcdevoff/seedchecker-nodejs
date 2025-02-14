// import { WorkerSignatureWASM } from "./modul/Debank/worker.js";
import { Connection, PublicKey } from "@solana/web3.js";
import httpRequest from "./httpRequest.js";
import fs from "fs";

export default async (listAddress) => {
  try {
    const price = JSON.parse(fs.readFileSync("resources/price.json", "utf8"));
    let result = { ...listAddress }; // Копирование данных addresses в новый объект

    await Promise.all([
      // TRX
      (async () => {
        try {
          let start = performance.now();

          const link = `https://apilist.tronscanapi.com/api/account/token_asset_overview?address=${result.trx.address}`;

          const response = await httpRequest(link);
          let res = response.data;
          let balance = res.totalAssetInUsd;

          if (balance != undefined) {
            balance = Number(balance.toFixed(0));
          } else {
            balance = 0;
          }

          // // console.log('Баланс TRON: ',  balance);

          result.trx.balance = balance;
          let end = performance.now() - start;
          // console.log('trx', end);

          return;
        } catch (error) {
          // // console.log('Error sending request:', error);
          // throw error;
          console.log(error);
          result.trx.balance = "undefined";
        }
      })(),

      // LTC
      (async () => {
        let address = result.ltc.address;
        try {
          let start = performance.now();

          const link = `https://api.blockchair.com/litecoin/dashboards/address/${address}?limit=1`;

          const response = await httpRequest(link);

          let res = response.data;
          let balance = res.data[address].address.balance_usd.toFixed(0);
          // // console.log('Баланс LTC: ', +balance)

          result.ltc.balance = Number(balance);
          let end = performance.now() - start;
          // console.log('ltc',end);
          return;
        } catch (error) {
          // // console.log('Error sending request:', error);
          result.ltc.balance = "undefined";

          // throw error;
        }
      })(),

      // XLM
      (async () => {
        try {
          let start = performance.now();

          const link = `https://horizon.stellar.org/accounts/${result.xlm.address}`;

          const response = await httpRequest(link);
          const data = JSON.parse(response.data);

          // // console.log(response.data.balances[0].balance);
          const balance = parseFloat(data.balances[0].balance);
          const balanceUSD = +(balance * price.xlm).toFixed(0);
          // // console.log('Баланс XLM: ', balanceUSD)

          result.xlm.balance = Number(balanceUSD);
          let end = performance.now() - start;
          // console.log('xml',end);
          return;
        } catch (error) {
          if (error.code == "ERR_BAD_REQUEST") {
            // // console.log('Пустой баланс XLM');
            result.xlm.balance = 0;
          } else {
            // // console.log('Ошибка при получении баланса XLM:', error);
            result.xlm.balance = "undefined";
          }
        }
      })(),

      // ETH
      (async () => {
        result.eth.balance = 0;

        //     let address = '0x91f2425b1c4907fba53ff5c13ef3942c45387a62'
        //     try {
        //       let start = performance.now()

        //         const { signature, nonce, ts } = await WorkerSignatureWASM({
        //             method: 'get',
        //             url_path: '/asset/net_curve_24h',
        //             payload: `user_addr=${address}`
        //         });

        //         const link = `https://api.debank.com/asset/net_curve_24h?user_addr=${address}`;

        //         const response = await axios({
        //           method: 'get', // or 'post', depending on your API endpoint
        //           url: link,
        //           headers: {
        //             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0',
        //             'Content-Type': 'application/json',
        //             'Accept': '*/*',
        //             'Accept-Encoding': 'gzip, deflate, br',
        //             'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        //             'Connection': 'keep-alive',
        //             'DNT': '1',
        //             'Host': 'api.debank.com',
        //             'Origin': 'https://debank.com/',
        //             'Referer': 'https://debank.com',
        //             'Sec-Fetch-Dest': 'empty',
        //             'Sec-Fetch-Mode': 'cors',
        //             'Sec-Fetch-Site': 'same-site',
        //             'source': 'web',
        //             'TE': 'trailers',
        //             'X-Api-Nonce': nonce,
        //             'X-Api-Sign': signature,
        //             'X-Api-Ts': ts,
        //             'X-Api-Ver': 'v2',
        //             'Cookie': '',
        //             'Cache-Control': 'no-cache, no-store, must-revalidate',
        //             'Pragma': 'no-cache'
        //           },
        //           httpsAgent: new https.Agent({
        //             rejectUnauthorized: false, // disable SSL certificate verification
        //             // proxy: {
        //             //   host: curlProxy.split(':')[0],
        //             //   port: parseInt(curlProxy.split(':')[1], 10),
        //             //   protocol: 'https:',
        //             // },
        //             settings: {
        //               'protocol': 'https:',
        //               'headers': {
        //                 'host': 'api.debank.com',
        //                 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0'
        //               }
        //             }
        //           }),
        //           responseType: 'json' // specify response type if needed
        //         });

        //         let res = response.data;
        //         let balance = res.data.usd_value_list[res.data.usd_value_list.length - 1][1];  // Общий баланс

        //         balance = Number(balance).toFixed(0);
        //         balance = Number(balance);
        //         // // console.log(`Баланс ETH: ${balance}`);
        //         result.BalanceUSD_ETH = Number(balance);
        //         let end = performance.now() - start
        //         // console.log('eth',end);
        //         return
        //       } catch (error) {
        //             // // console.log('Error sending request:', error);
        //             result.BalanceUSD_ETH = 'undefined'
        //         // throw error;
        //       }
      })(),

      // BTC
      (async () => {
        try {
          let start = performance.now();

          const link = `https://api.blockchain.info/haskoin-store/btc/address/${result.btc.address}/balance`;
          const response = await httpRequest(link);

          let res = response.data;
          let balance = res.confirmed;
          balance = price.btc * Number(codBTC(balance) + balance);
          balance = Number(balance).toFixed(0);

          function codBTC(sum) {
            let sumStr = String(sum);
            let key = sumStr.length;

            switch (key) {
              case 1:
                return "0.00000";
              case 2:
                return "0.00000";
              case 3:
                return "0.00000";
              case 4:
                return "0.0000";
              case 5:
                return "0.000";
              case 6:
                return "0.00";
              case 7:
                return "0.0";
              case 8:
                return "0.";

              default:
                return "";
            }
          }

          // // console.log('Баланс BTC: ',  balance);
          result.btc.balance = Number(balance);

          let end = performance.now() - start;
          // console.log('btc',end);
          return;
        } catch (error) {
          // // console.log('Error sending request:', error);
          result.btc.balance = "undefined";

          // throw error;
        }
      })(),

      // DOGE
      (async () => {
        let start = performance.now();
        try {
          const link = `https://leap.oraclus.com/v1/address/dogecoin/${result.doge.address}`;

          const response = await httpRequest(link);

          let res = response.data;

          let balance = res.net_worth_usd;

          if (balance == "0.00") {
            balance = 0;
          } else {
            balance = Number(balance).toFixed(0);
          }

          // // console.log(`Баланс DOGE: ${balance}`);

          result.doge.balance = +balance;
          let end = performance.now() - start;
          // console.log('doge',end);
          return;
        } catch (error) {
          // // console.log('Error sending request:', error);
          result.doge.balance = "undefined";

          // throw error;
        }
      })(),

      // XRP
      (async () => {
        let address = result.xrp.address;
        try {
          let start = performance.now();

          const link = `https://api.blockchair.com/ripple/raw/account/${address}`;

          const response = await httpRequest(link);

          let res = response.data;

          if (res.data == null) {
            // // console.log('Нет баланса');
            result.xrp.balance = 0;
          } else {
            let balance = res.data[address].account.account_data.Balance; // .toFixed(0);
            let curs = res.context.market_price_usd;

            // // console.log({'balance': balance, 'curs': curs});

            // Формируем правильное число
            balance =
              balance.length == 11
                ? balance.replace(/(\d{5})/, "$1.")
                : balance;
            balance =
              balance.length == 10
                ? balance.replace(/(\d{4})/, "$1.")
                : balance;
            balance =
              balance.length == 9 ? balance.replace(/(\d{3})/, "$1.") : balance;
            balance =
              balance.length == 8 ? balance.replace(/(\d{2})/, "$1.") : balance;
            balance =
              balance.length == 7 ? balance.replace(/(\d{1})/, "$1.") : balance;

            balance = Number(balance);

            // Формируем значение в USD
            balance = balance * curs;
            balance = +balance.toFixed(0);

            // // console.log({ 'BalanceUSD_XRP' : balance });

            result.xrp.balance = +balance;
            let end = performance.now() - start;
            // console.log('xrp',end);
            return;
          }
        } catch (error) {
          // // console.log('Error sending request:', error);
          result.xrp.balance = "undefined";

          // throw error;
        }
      })(),

      // ATOM
      (async () => {
        let address = result.atom.address;
        try {
          let start = performance.now();

          const link = `https://cosmos.api.explorers.guru/api/accounts/${address}/tokens`;

          const response = await httpRequest(link);

          let res = response.data;
          let balance = res[0].amount;
          let price = res[0].price;

          if (balance == 0) {
            balance = 0;
          } else {
            let resul = balance * price;
            balance = +resul.toFixed(0);
          }

          // // console.log('Баланс ATOM: ', balance)

          result.atom.balance = Number(balance);
          let end = performance.now() - start;
          // console.log('atom',end);
          return;
        } catch (error) {
          // // console.log('Error sending request:', error);
          result.atom.balance = "undefined";

          // throw error;
        }
      })(),

      // SOL
      (async () => {
        let address = result.sol.address;
        try {
          let start = performance.now();

          let curs = price.sol;

          const solanaAddress = address; // Замените на ваш адрес Solana

          const publicKey = new PublicKey(solanaAddress);
          const connection = new Connection(
            "https://api.mainnet-beta.solana.com"
          );
          const balance = await connection.getBalance(publicKey);

          const lamports = balance;
          const SOL_DECIMALS = 9; // Количество десятичных знаков в SOL

          const balanceInSOL = lamports / Math.pow(10, SOL_DECIMALS);

          let BalanceCurs = curs * balanceInSOL;
          BalanceCurs = Number(BalanceCurs.toFixed(0));

          // // console.log('Баланс вашего кошелька Solana:', BalanceCurs);

          result.sol.balance = Number(BalanceCurs);
          let end = performance.now() - start;
          // console.log('sol',end);
          return;
        } catch (error) {
          console.log(error);
          // // console.log('Error sending request:', error);
          result.sol.balance = "undefined";

          // throw error;
        }
      })(),

      // BNB
      (async () => {
        let address = result.bnb.address;
        try {
          let start = performance.now();

          const link = `https://explorer.bnbchain.org/api/v1/balances/${address}`;

          const response = await httpRequest(link);

          let res = response.data;
          let balance = res.balance;
          let totalBalance = 0;

          if (balance.length != 0) {
            for (let i in balance) {
              totalBalance += balance[i].free * balance[i].assetPrice;
            }

            balance = totalBalance.toFixed(0);
            // // console.log({ 'BalanceUSD_BNB' : balance });
          } else {
            balance = 0;
            // // console.log({ 'BalanceUSD_BNB' : balance });
          }

          result.bnb.balance = Number(balance);

          let end = performance.now() - start;
          // console.log('bnb',end);
          return;
        } catch (error) {
          // // console.log('Error sending request:', error);
          result.bnb.balance = "undefined";

          // throw error;
        }
      })(),
    ]);

    return result;
    // // console.log(result);
  } catch (error) {
    console.error("Ошибка при обработке данных:", error);
  }
};
