import {
  BehaviorSubject, combineLatest, timer, of,
} from 'rxjs';
import {
  multicast, refCount, pluck, switchMap, map, filter,
} from 'rxjs/operators';
import { memoize } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from '../../lib/constants';


export default (store) => {
  // eslint-disable-next-line no-underscore-dangle
  const watchAsObservable = (getter, options) => store._watcherVM.$watchAsObservable(
    () => getter(store.state, store.getters),
    options,
  );

  const sdk = watchAsObservable(({ sdk: s }) => s, { immediate: true })
    .pipe(
      pluck('newValue'),
      filter(s => s),
    );

  const getBalance = memoize(address => sdk
    .pipe(
      switchMap(s => timer(0, 3000).pipe(map(() => s))),
      switchMap(async s => BigNumber(await s.balance(address).catch(() => 0))
        .shiftedBy(-MAGNITUDE)),
      multicast(new BehaviorSubject(BigNumber(0))),
      refCount(),
    ));

  const getAccounts = accountsGetter => watchAsObservable(accountsGetter, { immediate: true })
    .pipe(
      pluck('newValue'),
      switchMap(acs => combineLatest(acs.map(({ address }) => getBalance(address)))
        .pipe(map(balances => balances.map((balance, idx) => ({ ...acs[idx], balance }))))),
    );

  const accounts = getAccounts((state, { identities }) => identities);

  store.state.observables = { // eslint-disable-line no-param-reassign
    topBlockHeight: sdk
      .pipe(
        switchMap(s => timer(0, 30000).pipe(map(() => s))),
        switchMap(async s => (await s.topBlock()).height),
        multicast(new BehaviorSubject(0)),
        refCount(),
      ),
    getBalance,
    activeAccount: watchAsObservable(
      (state, { activeIdentity }) => activeIdentity,
      { immediate: true },
    )
      .pipe(
        pluck('newValue'),
        switchMap(acc => (acc
          ? getBalance(acc.address).pipe(map(balance => ({ ...acc, balance })))
          : of(acc))),
      ),
    accounts,
    inactiveAccounts: getAccounts(
      ({ selectedIdentityIdx }, { identities }) => [
        ...identities.slice(0, selectedIdentityIdx),
        ...identities.slice(selectedIdentityIdx + 1),
      ],
    ),
    totalBalance: accounts.pipe(
      map(acs => acs.reduce((prev, { balance }) => prev.plus(balance), BigNumber(0))),
    ),
  };
};
