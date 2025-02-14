export default (symbol) => {
  let explorer;

  switch (symbol) {
    case "btc":
      explorer = "https://www.blockchain.com/explorer/addresses/btc/";
      break;
    case "trx":
      explorer = "https://tronscan.io/?ltclid=#/address/";
      break;
    case "eth":
      explorer = "https://debank.com/profile/";
      break;
    case "bnb":
      explorer = "https://explorer.bnbchain.org/address/";
      break;
    case "doge":
      explorer = "https://dogechain.info/address/";
      break;
    case "xrp":
      explorer = "https://blockchair.com/xrp-ledger/account/";
      break;
    case "ltc":
      explorer = "https://blockchair.com/litecoin/address/";
      break;
    case "xlm":
      explorer = "https://blockchair.com/stellar/account/";
      break;
    case "atom":
      explorer = "https://atomscan.com/accounts/";
      break;
    case "sol":
      explorer = "https://explorer.solana.com/address/";
      break;
    default:
      break;
  }

  return explorer;
};
