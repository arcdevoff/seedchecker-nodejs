import fs from "fs";

export default (data) => {
  const { mnemonic, id } = data;
  let logObject;

  if (data?.result && typeof data?.result === "object") {
    const { result } = data;

    logObject = {
      id,
      seed: mnemonic,
      "TRX - TRON": result.trx.address,
      "LTC - Litecoin": result.ltc.address,
      "XLM - Stellar": result.xlm.address,
      "ETH - Ethereum": result.eth.address,
      "BTC - Bitcoin": result.btc.address,
      "DOGE - Dogecoin": result.doge.address,
      "XRP - Ripple": result.xrp.address,
      "ATOM - Cosmos": result.atom.address,
      "SOL - Solana": result.sol.address,
      "BNB - Binance": result.bnb.address,
      BalanceUSD_TRX: result.trx.balance,
      BalanceUSD_LTC: result.ltc.balance,
      BalanceUSD_XLM: result.xlm.balance,
      BalanceUSD_ETH: result.eth.balance,
      BalanceUSD_BTC: result.btc.balance,
      BalanceUSD_DOGE: result.doge.balance,
      BalanceUSD_XRP: result.xrp.balance,
      BalanceUSD_ATOM: result.atom.balance,
      BalanceUSD_SOL: result.sol.balance,
      BalanceUSD_BNB: result.bnb.balance,
    };
  } else if (data?.error === "invalid_mnemonic") {
    logObject = {
      id,
      seed: mnemonic,
      status: "noValid",
    };
  }

  console.log(logObject);
  const logString = JSON.stringify(logObject, null, 2);
  fs.appendFileSync("log.json", logString + "\n");
};
