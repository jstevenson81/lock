import React from 'react';
import Screen from '../../core/screen';
import SocialButtonsPane from '../../field/social/social_buttons_pane';
import LoginPane from '../../connection/database/login_pane';
import PaneSeparator from '../../core/pane_separator';
import { hasScreen, signUpLink, authWithUsername } from '../../connection/database/index';
import { signIn as databaseSignIn } from '../../connection/database/actions';
import { renderSignedInConfirmation } from '../../core/signed_in_confirmation';
import LoginSignUpTabs from '../../connection/database/login_sign_up_tabs';
import * as l from '../../core/index';
import { icon } from '../../ui/input/password_input';
import * as c from '../../field/index';
import { emailDomain } from '../../field/email';
import {
  signIn as enterpriseSignIn,
  startHRD
} from '../../connection/enterprise/actions';
import {
  findADConnectionWithoutDomain,
  isADEnabled,
  isHRDDomain,
  isSSODomain
} from '../../connection/enterprise';


function shouldRenderTabs(m) {
  return l.hasSomeConnections(m, "database")
    && hasScreen(m, "signUp")
    && !isSSOEnabled(m);
}

function isSSOEnabled(m) {
  return isSSODomain(
    m,
    usernameStyle(m) === "username"  ? c.username(m) : c.email(m)
  );
}

function usernameStyle(m) {
  return authWithUsername(m) && !isADEnabled(m) ? "username" : "email";
}

const SingleSignOnNotice = ({children}) => (
  <div className="auth0-sso-notice-container">
    <span dangerouslySetInnerHTML={{__html: icon}} /> {" "}
    <span className="auth0-sso-notice">{children}</span>
  </div>
);

const Component = ({model, t}) => {
  const headerText = t("headerText") || null;
  const header = headerText && <p>{headerText}</p>;

  const sso = isSSOEnabled(model);
  const onlySocial = l.hasOnlyConnections(model, "social");

  const tabs = shouldRenderTabs(model)
    && <LoginSignUpTabs
         key="loginsignup"
         lock={model}
         loginTabLabel={t("loginTabLabel", {__textOnly: true})}
         signUpLink={signUpLink(model)}
         signUpTabLabel={t("signUpTabLabel", {__textOnly: true})}
       />;


  const social = !sso  && l.hasSomeConnections(model, "social")
    && <SocialButtonsPane
         lock={model}
         showLoading={onlySocial}
         signUp={false}
         smallButtonsHeader={shouldRenderTabs(model) ? '' : t("smallSocialButtonsHeader", {__textOnly: true})}
         t={t}
       />;

  const showPassword = !sso
    && (l.hasSomeConnections(model, "database")
       || !!findADConnectionWithoutDomain(model));

  const showForgotPasswordLink = showPassword
    && l.hasSomeConnections(model, "database");

  const login = (sso
    || l.hasSomeConnections(model, "database")
    || l.hasSomeConnections(model, "enterprise"))
    && <LoginPane
         emailInputPlaceholder={t("emailInputPlaceholder", {__textOnly: true})}
         forgotPasswordLabel={t("forgotPasswordLabel", {__textOnly: true})}
         lock={model}
         passwordInputPlaceholder={t("passwordInputPlaceholder", {__textOnly: true})}
         showForgotPasswordLink={showForgotPasswordLink}
         showPassword={showPassword}
         usernameInputPlaceholder={t("usernameInputPlaceholder", {__textOnly: true})}
         usernameStyle={usernameStyle(model)}
       />;

  const ssoNotice = sso
    && <SingleSignOnNotice>
         {t("ssoEnabled", {__textOnly: true})}
       </SingleSignOnNotice>;

  const separator = social && login
    && <PaneSeparator>{t("separatorText")}</PaneSeparator>;

  return <div>{ssoNotice}{tabs}{header}{social}{separator}{login}</div>;

};

export default class Login extends Screen {

  constructor() {
    super("login");
  }

  renderAuxiliaryPane(lock) {
    return renderSignedInConfirmation(lock);
  }

  renderTabs(model) {
    return shouldRenderTabs(model);
  }

  submitHandler(model) {
    if (l.hasOnlyConnections(model, "social")) {
      return null;
    }

    if (isHRDDomain(model, c.email(model))) {
      return startHRD;
    }

    return isSSOEnabled(model) || !l.hasSomeConnections(model, "database")
      ? enterpriseSignIn
      : databaseSignIn;
  }

  render() {
    return Component;
  }

}
