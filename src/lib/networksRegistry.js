export const defaultNetwork = {
  name: 'Hyperchain alpha',
  url: 'http://13.239.157.207:3013',
  middlewareUrl: 'https://mainnet.aeternity.io/mdw',
  explorerUrl: 'https://explorer.aeternity.io',
  compilerUrl: 'https://compiler.aepps.com',
};

export default Object.freeze((process.env.NODE_ENV === 'production' ? [
  defaultNetwork,
] : [
  defaultNetwork,
]).map(Object.freeze));
