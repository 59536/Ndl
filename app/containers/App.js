// @flow
import * as React from 'react';
import { Route, Switch, withRouter } from 'react-router';
import backendService from '../services/backendService';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import walletService from '../services/walletService';
import { bindActionCreators } from 'redux';
import { cliActions } from '../actions/cliActions';
import { walletActions } from '../actions/walletActions';
import { poolsActions } from '../actions/poolsActions';
import { mixActions } from '../actions/mixActions';
import { Link } from 'react-router-dom';
import * as Icon from 'react-feather';
import routes from '../constants/routes';
import ConfigPage from '../containers/ConfigPage';
import InitPage from '../containers/InitPage';
import PremixPage from './PremixPage';
import DepositPage from '../containers/DepositPage';
import LastActivityPage from './LastActivityPage';
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
import cliService from '../services/cliService';
import ConnectingPage from './ConnectingPage';
import StatusPage from './StatusPage';
import LoginPage from './LoginPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cliLocalService } from '../services/cliLocalService';
import { API_VERSION, GUI_VERSION } from '../const';

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

    // init services
    backendService.init(props.dispatch)
    cliService.init(props.cli, cliState =>
      props.cliActions.set(cliState)
    )
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

    // start cli
    cliService.start()
  }

  routes() {
    if (cliService.isLoggedIn()) {
      // logged in
      return <Switch>
        <Route path={routes.STATUS} component={StatusPage}/>
        <Route path={routes.DEPOSIT} component={DepositPage}/>
        <Route path={routes.PREMIX} component={PremixPage}/>
        <Route path={routes.POSTMIX} component={PostmixPage}/>
        <Route path={routes.CONFIG} component={ConfigPage}/>
        <Route path={routes.HOME} component={LastActivityPage}/>
      </Switch>
    }

    if (!cliService.isConfigured() || cliService.isCliStatusNotInitialized()) {
      // not configured/initialized
      return <Switch>
        <Route path={routes.STATUS} component={StatusPage}/>
        <Route path={routes.HOME} component={InitPage} />
      </Switch>
    }
    if (!cliService.isCliStatusReady()) {
      // not connected
      return <Switch>
        <Route path={routes.STATUS} component={StatusPage}/>
        <Route path={routes.HOME} component={ConnectingPage} />
      </Switch>
    }
    if (!cliService.isLoggedIn()) {
      return <Switch>
        <Route path={routes.STATUS} component={StatusPage}/>
        <Route path={routes.CONFIG} component={ConfigPage}/>
        <Route path={routes.HOME} component={LoginPage}/>
      </Switch>
    }
  }

  render() {
    const cliLocalStatusIcon = cliService.isCliLocal() ? cliLocalService.getStatusIcon((icon,text)=>icon) : undefined
    const cliStatusIcon = cliService.getStatusIcon((icon,text)=>icon)
    const loginStatusIcon = cliService.getLoginStatusIcon((icon,text)=>icon)
    const cliUrl = cliService.isCliLocal() ? 'local' : cliService.getCliUrl()
    const cliInfo = cliService.isCliLocal() ? 'CLI '+cliLocalService.getCliVersionStr():'CLI_API '+API_VERSION

    return <div>
      <Helmet>
        <title>Whirlpool - Samourai Wallet - GUI {GUI_VERSION}, {cliInfo}</title>
      </Helmet>
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <div className='col-sm-3 col-md-2 mr-0 navbar-brand-col'>

          <div className="branding">
            <a href='#' className="brand-logo">
              <span className="logo icon-samourai-logo-trans svglogo"></span>
            </a>
            <a href='#' className='product-title'>Whirlpool</a>
          </div>
          <div>
            {loginStatusIcon && <div className='loginStatus'>{loginStatusIcon} {cliService.isConnected() && <small className='cliNetwork'>{cliService.getNetwork()}net</small>}</div>}
            {cliStatusIcon && <div className='cliStatus'>{cliLocalStatusIcon} {cliUrl} {cliStatusIcon}</div>}
          </div>
        </div>
        <div className='col-md-10'>
          {cliService.isLoggedIn() && (mixService.isReady() ? <MixStatus mixState={this.props.mix} mixActions={this.props.mixActions}/> : <small>Fetching mix state...</small>)}
        </div>
      </nav>

      <div className="container-fluid">

        <div className="row">
          <nav className="col-md-2 d-none d-md-block bg-light sidebar">
            <div className="sidebar-sticky">

              {cliService.isLoggedIn() && walletService.isReady() &&  <div>
                <button className='btn btn-sm btn-primary btn-deposit' onClick={() => modalService.openDeposit()}><Icon.Plus size={12}/> Deposit</button>
                <div><small>Balance: {utils.toBtc(walletService.getBalanceDeposit()+walletService.getBalancePremix()+walletService.getBalancePostmix(), true)}</small></div>
              </div>}

              <ul className="nav flex-column">
                {cliService.isCliStatusReady() && !cliService.isLoggedIn() && <li className="nav-item">
                  <Link to={routes.HOME} className="nav-link">
                    <span data-feather="terminal"></span>
                    <strong>Authentication</strong>
                  </Link>
                </li>}
                {cliService.isLoggedIn() && walletService.isReady() && <li className="nav-item">
                  <Link to={routes.LAST_ACTIVITY} className="nav-link">
                      <span data-feather="terminal"></span>
                      Last activity
                  </Link>
                </li>}
                {cliService.isLoggedIn() && walletService.isReady() && <li className="nav-item">
                  <Link to={routes.DEPOSIT} className="nav-link">
                      <span data-feather="plus"></span>
                      Deposit
                      ({walletService.getUtxosDeposit().length} · {utils.toBtc(walletService.getBalanceDeposit(), true)})
                  </Link>
                </li>}
                {cliService.isLoggedIn() && walletService.isReady() && <li className="nav-item">
                  <Link to={routes.PREMIX} className="nav-link">
                    <span data-feather="play"></span>
                    Premix
                    ({walletService.getUtxosPremix().length} · {utils.toBtc(walletService.getBalancePremix(), true)})
                  </Link>
                </li>}
                {cliService.isLoggedIn() && walletService.isReady() && <li className="nav-item">
                  <Link to={routes.POSTMIX} className="nav-link">
                    <span data-feather="check"></span>
                    Postmix
                    ({walletService.getUtxosPostmix().length} · {utils.toBtc(walletService.getBalancePostmix(), true)})
                  </Link>
                </li>}
                {cliService.isLoggedIn() && walletService.isReady() && <br/>}
                {cliService.isConfigured() && cliService.isCliStatusReady() && <li className="nav-item">
                  <Link to={routes.CONFIG} className="nav-link">
                    <span data-feather="settings"></span>
                    Configuration
                  </Link>
                </li>}
                {(!cliService.isConfigured() || cliService.isCliStatusNotInitialized()) && <li className="nav-item">
                  <Link to={routes.HOME} className="nav-link">
                    <span data-feather="settings"></span>
                    <strong>Setup</strong>
                  </Link>
                </li>}
                <li className="nav-item">
                  <Link to={routes.STATUS} className="nav-link">
                    <span data-feather="terminal"></span>
                    System
                  </Link>
                </li>
              </ul>

              {cliService.isLoggedIn() && !walletService.isReady() && <div>
                <small>Fetching wallet...</small>
              </div>}
            </div>
            <Status
              status={this.props.status}
              statusActions={this.props.statusActions}
            />
          </nav>

          <main role="main" className="col-md-10 ml-sm-auto col-lg-10 px-4">

            {this.routes()}

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
    cli: state.cli,
    wallet: state.wallet,
    mix: state.mix
  };
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
    statusActions: bindActionCreators(statusActions, dispatch),
    cliActions: bindActionCreators(cliActions, dispatch),
    walletActions: bindActionCreators(walletActions, dispatch),
    poolsActions: bindActionCreators(poolsActions, dispatch),
    mixActions: bindActionCreators(mixActions, dispatch)
  }
}

export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(App));
