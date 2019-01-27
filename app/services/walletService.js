import ifNot from 'if-not-running';
import backendService from './backendService';

const REFRESH_RATE = 10000;
class WalletService {
  constructor () {
    this.setState = undefined
    this.state = undefined
    this.refreshTimeout = undefined
  }

  init (state, setState) {
    ifNot.run('walletService:init', () => {
      this.setState = setState
      if (this.state === undefined) {
        console.log('wallet: init...')
        if (state !== undefined) {
          console.log('wallet: load', Object.assign({}, state))
          this.state = state
        }
      } else {
        console.log('wallet: already initialized')
      }
    })
    if (this.refreshTimeout === undefined) {
      this.refreshTimeout = setInterval(this.loadFromBackend.bind(this), REFRESH_RATE)
    }
  }

  isLoaded () {
    return this.state !== undefined && this.state.wallet !== undefined
  }

  getUtxosDeposit () {
    if (!this.isLoaded()) {
      console.error('getUtxosDeposit() but not loaded!')
      return []
    }
    return this.state.wallet.utxosDeposit
  }

  getUtxosPremix () {
    if (!this.isLoaded()) {
      console.error('getUtxosPremix() but not loaded!')
      return []
    }
    return this.state.wallet.utxosPremix
  }

  getUtxosPostmix () {
    if (!this.isLoaded()) {
      console.error('getUtxosPostmix() but not loaded!')
      return []
    }
    return this.state.wallet.utxosPostmix
  }

  loadFromBackend () {
    return ifNot.run('walletService:loadFromBackend', () => {
      // fetch backend
      return backendService.wallet.fetch().then(wallet => {
        // set state
        if (this.state === undefined) {
          console.log('walletService: initializing new state')
          this.state = {
            wallet: wallet
          }
        } else {
          console.log('walletService: updating existing state', Object.assign({}, this.state))
          this.state.wallet = wallet
        }
        this.pushState()
      })
    })
  }

  pushState () {
    this.setState(this.state)
  }
}

const walletService = new WalletService()
export default walletService
