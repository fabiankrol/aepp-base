import { EpochChain } from '@aeternity/aepp-sdk';

export default store => store.watch(
  (state, { currentNetwork }) => currentNetwork.url,
  async url => store.commit('setEpoch', await EpochChain({ url, internalUrl: url })),
  { immediate: true },
);
