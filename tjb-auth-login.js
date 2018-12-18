import WebComponent from "https://tjb-webcomponents.github.io/tjb-webcomponent/tjb-wc.min.js";
import html from "https://tjb-webcomponents.github.io/html-template-string/html-template-string.js";
import {
  bounce
} from "https://tjb-webcomponents.github.io/tjb-gfx/tjb-gfx.min.js";
import "https://tjb-webcomponents.github.io/tjb-input/tjb-input.min.js";
import "https://tjb-webcomponents.github.io/tjb-statusbar/tjb-statusbar.min.js";
import "https://tjb-webcomponents.github.io/tjb-notify/tjb-notify.min.js";

class tjbAuthLogin extends WebComponent() {
  // Styles
  ///////////////////////////////////////////////////////////

  CSS() {
    return html `
      <style>
        :host {
          --login-color-info: grey;

          /* notify */
          --login-notify-background-error: #fa354c;
          --login-notify-background-success: limegreen;
          --login-notify-color-error: white;
          --login-notify-color-success: white;
          --login-notify-margin: -55px -40px 20px;
          --login-notify-padding: 15px 15px 15px 35px;

          /* input */
          --login-input-color-error: #fa354c;
          --login-input-color-success: limegreen;
          --login-input-padding: 10px;
          --login-input-margin: 0 0 30px 0;
          --login-input-width: 100%;
          --login-input-border: 1px solid transparent;
          --login-input-border-bottom: 1px solid lightgrey;
          --login-input-border-radius: 0;
          --login-input-font-size: 1rem;
          --login-input-info-color: grey;
          --login-input-info-font-size: 0.8rem;
          --login-input-label-margin: 0 0 5px 0;

          background: #fff;
          display: block;
          max-width: 350px;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
          padding: 55px 40px 10px;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
        }

        tjb-input {
          --input-color-error: var(--login-input-color-error);
          --input-color-success: var(--login-input-color-success);
          --input-padding: var(--login-input-padding);
          --input-margin: var(--login-input-margin);
          --input-width: var(--login-input-width);
          --input-border: var(--login-input-border);
          --input-border-bottom: var(--login-input-border-bottom);
          --input-border-radius: var(--login-input-border-radius);
          --input-font-size: var(--login-input-font-size);
          --input-info-color: var(--login-input-info-color);
          --input-info-font-size: var(--login-input-info-font-size);
          --input-label-margin: var(--login-input-label-margin);
        }

        tjb-notify {
          --notify-background-error: var(--login-notify-background-error);
          --notify-background-success: var(--login-notify-background-success);
          --notify-color-error: var(--login-notify-color-error);
          --notify-color-success: var(--login-notify-color-success);
          --notify-margin: var(--login-notify-margin);
          --notify-padding: var(--login-notify-padding);
        }

        .alert {
          animation: shake 150ms linear 3;
        }

        .login__fieldset {
          margin-bottom: 30px;
        }

        .login__fieldset--center {
          text-align: center;
        }

        .login__info {
          text-align: center;
          margin-bottom: 10px;
          color: var(--login-color-info);
        }

        .login__footnote {
          text-align: center;
        }

        @keyframes blink {
          50% {
            background: transparent;
          }
        }

        @keyframes shake {
          25% {
            transform: translateX(-5%);
          }

          50% {
            transform: translateX(5%);
          }
        }
      </style>
    `;
  }

  // Markup
  ////////////////////////////////////////////////////////////

  HTML() {
    this.statusbar = html `
      <tjb-statusbar></tjb-statusbar>
    `;

    this.emailInput = html `
      <tjb-input
        label="Email"
        type="email"
        name="email"
        required="true"
        errormessage="Please check your email address"
      ></tjb-input>
    `;

    this.passwordInput = html `
      <tjb-input
        label="Password"
        type="password"
        name="password"
        info="minimum 8 digits"
        pattern=".{8,}"
        required="true"
        errormessage="Please check your password"
      ></tjb-input>
    `;

    this.messageNode = html `
      <tjb-notify></tjb-notify>
    `;

    return html `
      <form class="login__form" onsubmit="${e => this.loginHandler(e)}">
        ${this.messageNode}
        <div class="login__fieldset">
          <div class="login__info">Login with your email:</div>
        </div>
        <div class="login__fieldset">
          ${this.emailInput} ${this.passwordInput}
          <slot name="submit" onclick="${e => this.loginHandler(e)}"></slot>
          <div class="login__footnote">
            <a
              href="#forgot"
              class="link"
              onclick="${e => this.openHandler(e, "forgot")}"
              >Forgot Password?</a
            >
            |
            <a
              href="#register"
              class="link"
              onclick="${e => this.openHandler(e, "register")}"
              >Register Here</a
            >
          </div>
        </div>
        ${this.statusbar}
      </form>
    `;
  }

  // Attribute Handling
  ////////////////////////////////////////////////////////////

  static get observedAttributes() {
    return ["postbody", "posturl"];
  }

  // Logic
  ////////////////////////////////////////////////////////////

  loginHandler(event) {
    event.preventDefault();
    if (!this.checkValidity()) return false;

    this.statusbar.status = "loading";

    const postbody = this.postbody && this.postbody.replace(/\'/g, '"');
    const body = Object.assign({}, {
        email: this.emailInput.value,
        password: this.passwordInput.value
      },
      JSON.parse(postbody || "{}")
    );

    return fetch(this.posturl, {
        method: "POST",
        redirect: "follow",
        credentials: "include",
        headers: new Headers({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(body)
      })
      .then(resp => resp.json())
      .then(resp => {
        if (resp.error) throw resp;
        return this._loginSuccess(resp);
      })
      .catch(resp => this._loginError(resp));
  }

  _loginSuccess(resp) {
    bounce(this.domNode, this.dispatchEvent.bind(this, "success", resp));
  }

  _loginError(resp) {
    this.dispatchEvent("error", resp);
    this.errorHandler();
  }

  checkValidity() {
    return [
      this.emailInput.checkValidity(),
      this.passwordInput.checkValidity()
    ].every(check => check);
  }

  openHandler(event, target) {
    event.preventDefault();
    bounce(event.target, this._location.bind(this, event.target.href, target));
  }

  _location(href, target) {
    this.dispatchEvent("redirect", {
      href,
      target
    });
  }

  errorHandler() {
    this.writeMessageError = this.writeMessageError.bind(this);
    this.statusbar.status = "alert";
    this.domNode.addEventListener("animationend", this.writeMessageError);
    this.domNode.classList.remove("alert");
    setTimeout(() => this.domNode.classList.add("alert"), 100);
  }

  writeMessageError() {
    this.domNode.removeEventListener("animationend", this.writeMessageError);

    this.messageNode.error = html `
      <ul>
        <li>
          <a
            onclick="${() => this.emailInput.inputNode.focus()}"
            href="#"
            class="message__link"
            >Wrong email</a
          >
          or
          <a
            onclick="${() => this.passwordInput.inputNode.focus()}"
            href="#"
            class="message__link"
            >password</a
          >
        </li>
        <li>
          Don’t have an account yet?
          <a
            onclick="${e => this.openHandler(e, "register")}"
            href="#register"
            class="message__link"
            >Register here</a
          >
        </li>
      </ul>
    `;

    this.emailInput.showMessage("error");
    this.passwordInput.showMessage("error");
  }
}

customElements.define("tjb-auth-login", tjbAuthLogin);
