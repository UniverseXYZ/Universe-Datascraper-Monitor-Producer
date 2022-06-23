export default () => ({
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  port: process.env.PORT,
  alchemy_token: process.env.ALCHEMY_TOKEN,
  chainstack_url: process.env.CHAINSTACK_URL,
  quicknode_url: process.env.QUICKNODE_URL,
  ethereum_quorum: process.env.ETHEREUM_QUORUM,
  app_env: process.env.APP_ENV,
  blockDelay: process.env.BLOCK_DELAY,
  ethereum_network: process.env.ETHEREUM_NETWORK,
  session_secret: process.env.SESSION_SECRET,
  infura: {
    project_id: process.env.INFURA_PROJECT_ID,
    project_secret: process.env.INFURA_PROJECT_SECRET,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    queueUrl: process.env.AWS_QUEUE_URL,
  },
  etherscan_api_key: process.env.ETHERSCAN_API_KEY,
  default_start_block: process.env.DEFAULT_START_BLOCK,
  default_end_block: process.env.DEFAULT_END_BLOCK,
  source: process.env.SOURCE,
  queueLimit: process.env.QUEUE_LIMIT,
});
