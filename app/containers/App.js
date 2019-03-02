// @flow
import * as React from 'react';
import { withRouter } from 'react-router'
import backendService from '../services/backendService';
import { connect } from 'react-redux';
import walletService from '../services/walletService';
import { bindActionCreators } from 'redux';
import { walletActions } from '../actions/walletActions';
import { poolsActions } from '../actions/poolsActions';
import { mixActions } from '../actions/mixActions';
import { Link } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import * as Icon from 'react-feather';
import routes from '../constants/routes';
import ConfigPage from '../containers/ConfigPage';
import InitPage from '../containers/InitPage';
import PremixPage from './PremixPage';
import DepositPage from '../containers/DepositPage';
import Status from '../components/Status';
import { statusActions } from '../services/statusActions';
import PostmixPage from './PostmixPage';
import utils from '../services/utils';
import MixStatus from '../components/MixStatus';
import mixService from '../services/mixService';
import modalService from '../services/modalService';
import Tx0Modal from '../components/Modals/Tx0Modal';
import DepositModal from '../components/Modals/DepositModal';
import poolsService from '../services/poolsService';

type Props = {
  children: React.Node
};

class App extends React.Component<Props> {
  props: Props;

  constructor(props) {
    super(props)

    this.state = {
      // managed by modalService
      modalTx0: false
    }

    backendService.init(props.dispatch)

    mixService.init(props.mix, mixState =>
      props.mixActions.set(mixState)
    )
    walletService.init(props.wallet, walletState =>
      props.walletActions.set(walletState)
    )
    poolsService.init(props.pools, poolsState =>
      props.poolsActions.set(poolsState)
    )
    modalService.init(this.setState.bind(this))
  }

  render() {
    return <div>
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <div className='col-sm-3 col-md-2 mr-0 navbar-brand-col'>

          <div className="branding">
            <a href='#' className="brand-logo">
              <span className="logo icon-samourai-logo-trans svglogo"></span>
            </a>
            <a href='#' className='product-title'>Whirlpool</a>
          </div>

        </div>
        <div className='col-md-10'>
          {mixService.isReady() ? <MixStatus mixState={this.props.mix} mixActions={this.props.mixActions}/> : <small>Fetching mix state...</small>}
        </div>
      </nav>

      <div className="container-fluid">

        <div className="row">
          <nav className="col-md-2 d-none d-md-block bg-light sidebar">
            <div className="sidebar-sticky">
              <button className='btn btn-sm btn-primary btn-deposit' onClick={() => modalService.openDeposit()}><Icon.Plus size={12}/> Deposit</button>
              <ul className="nav flex-column">
                {walletService.isReady() && <li className="nav-item">
                  <Link to={routes.DEPOSIT}>
                    <a className="nav-link">
                      <span data-feather="plus"></span>
                      Deposit ({walletService.getUtxosDeposit().length} · {utils.toBtc(walletService.getBalanceDeposit(), true)})
                    </a>
                  </Link>
                </li>}
                {walletService.isReady() && <li className="nav-item">
                  <Link to={routes.PREMIX}>
                    <a className="nav-link">
                      <span data-feather="play"></span>
                      Mixing ({walletService.getUtxosPremix().length} · {utils.toBtc(walletService.getBalancePremix(), true)})
                    </a>
                  </Link>
                </li>}
                {walletService.isReady() && <li className="nav-item">
                  <Link to={routes.POSTMIX}>
                    <a className="nav-link">
                      <span data-feather="check"></span>
                      Mixed ({walletService.getUtxosPostmix().length} · {utils.toBtc(walletService.getBalancePostmix(), true)})
                    </a>
                  </Link>
                </li>}
                <li className="nav-item">
                  <Link to={routes.CONFIG}>
                    <a className="nav-link">
                      <span data-feather="settings"></span>
                      Configuration
                    </a>
                  </Link>
                </li>
              </ul>
              {!walletService.isReady() && <div><small>Fetching wallet...</small></div>}
            </div>
            <Status
              status={this.props.status}
              statusActions={this.props.statusActions}
            />
          </nav>

          <main role="main" className="col-md-10 ml-sm-auto col-lg-10 px-4">

            <Switch>
              <Route path={routes.DEPOSIT} component={DepositPage} />
              <Route path={routes.PREMIX} component={PremixPage} />
              <Route path={routes.POSTMIX} component={PostmixPage} />
              <Route path={routes.CONFIG} component={ConfigPage} />
              <Route path={routes.INIT} component={InitPage} />
            </Switch>

            {this.state.modalTx0 && <Tx0Modal utxo={this.state.modalTx0} onClose={modalService.close.bind(modalService)}/>}
            {this.state.modalDeposit && <DepositModal onClose={modalService.close.bind(modalService)}/>}

          </main>
        </div>

      </div>
    </div>
  }
}


function mapStateToProps(state) {
  return {
    status: state.status,
    wallet: state.wallet,
    mix: state.mix
  };
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
    statusActions: bindActionCreators(statusActions, dispatch),
    walletActions: bindActionCreators(walletActions, dispatch),
    poolsActions: bindActionCreators(poolsActions, dispatch),
    mixActions: bindActionCreators(mixActions, dispatch)
  }
}

export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(App));
