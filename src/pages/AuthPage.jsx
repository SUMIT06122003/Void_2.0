import { useEffect, useState } from "react";
import { products, testimonials } from "../data/storeData";
import { apiFetch } from "../utils/api";
import { formatIndianPhoneNumber, getOtpErrorMessage } from "../utils/authHelpers";

function AuthPage({ mode, onAuthSuccess }) {
  const isRegister = mode === "register";
  const isReset = mode === "reset";
  const featureProduct = products[isRegister ? 1 : 0] || products[0];
  const featureReview = testimonials[0];

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName("");
    setMobile(getMobileFromHash());
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setOtpSent(false);
    setStatus("");
    setError("");
  }, [mode]);

  const formattedPhone = formatIndianPhoneNumber(mobile);



  const handleSendOtp = async () => {
    setError("");
    setStatus("");

    if (!formattedPhone) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (isRegister && name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }

    if (isRegister && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (isReset) {
      setPassword("");
      setConfirmPassword("");
      setOtp("");
    }

    setIsSubmitting(true);
    try {
      await requestOtp("/api/auth/otp/send", {
        mode: isReset ? "reset" : mode,
        name: name.trim(),
        mobile: formattedPhone,
        password
      });
      setOtpSent(true);
      setStatus(`OTP sent to ${formattedPhone}.`);

    } catch (sendError) {
      setError(getOtpErrorMessage(sendError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    setStatus("");

    if (!formattedPhone) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await requestAuth("/api/auth/login", {
        mobile: formattedPhone,
        password
      });
      const user = await onAuthSuccess(data.token, data.user);
      setStatus("Login successful.");
      window.location.hash = user?.isAdmin ? "#/admin" : "#/account";
    } catch (loginError) {
      setError(getOtpErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setStatus("");

    if (!otpSent) {
      setError("Send OTP first.");
      return;
    }

    if (!/^\d{4,8}$/.test(otp.trim())) {
      setError("Enter the OTP sent to your mobile number.");
      return;
    }

    if (isReset && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isReset && password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await requestOtp("/api/auth/otp/verify", {
        mobile: formattedPhone,
        otp: otp.trim(),
        password: isReset ? password : undefined
      });
      const user = await onAuthSuccess(data.token, data.user);
      setStatus(isRegister ? "Account created successfully." : isReset ? "Password updated successfully." : "Login successful.");
      window.location.hash = user?.isAdmin ? "#/admin" : "#/account";
    } catch (verifyError) {
      setError(getOtpErrorMessage(verifyError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <span>VOID Account</span>
        <h1>{isRegister ? "Create Account" : isReset ? "Reset Password" : "Login"}</h1>
        <p>
          {isRegister
            ? "Create your VOID account with your mobile number and password."
            : isReset
              ? "Verify your mobile number with OTP and create a new password."
              : "Access orders, tracking, wishlist, rewards, and saved details."}
        </p>
        <div className="auth-media-card">
          <img src={featureProduct.gallery?.[0] || featureProduct.image} alt={featureProduct.name} />
          <div>
            <strong>{featureProduct.name}</strong>
            <span>{featureProduct.price}</span>
          </div>
        </div>
        <div className="auth-review-mini">
          <video src={featureReview.video} muted playsInline preload="metadata" />
          <span>{featureReview.name}</span>
        </div>
      </div>

      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        {isRegister ? (
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="mobile">Mobile Number</label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter mobile number"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
          />
        </div>

        {!isReset || otpSent ? (
          <div className="form-field">
            <label htmlFor="password">{isRegister || isReset ? "Create Password" : "Password"}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister || isReset ? "new-password" : "current-password"}
              placeholder={isRegister || isReset ? "Create password" : "Enter password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        ) : null}

        {isRegister || (isReset && otpSent) ? (
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        ) : null}

        {otpSent ? (
          <div className="form-field">
            <label htmlFor="otp">OTP</label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </div>
        ) : null}

        {error ? <p className="form-message error-message">{error}</p> : null}
        {status ? <p className="form-message success-message">{status}</p> : null}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={isRegister || isReset ? (otpSent ? handleVerifyOtp : handleSendOtp) : handleLogin}
        >
          {isSubmitting
            ? "Please Wait"
            : isRegister || isReset
              ? otpSent
                ? isReset
                  ? "Reset Password"
                  : "Verify OTP"
                : "Send OTP"
              : "Login"}
        </button>

        {!isRegister && !isReset ? (
          <a className="forgot-password-link" href="#/forgot-password">
            Forgot password?
          </a>
        ) : null}

        <p>
          {isRegister || isReset ? "Already have an account?" : "New to VOID?"}{" "}
          <a href={isRegister || isReset ? "#/login" : "#/register"}>
            {isRegister || isReset ? "Login" : "Create account"}
          </a>
        </p>
      </form>
    </section>
  );
}

function getMobileFromHash() {
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get("mobile") || "";
}

async function requestOtp(url, payload) {
  return requestAuth(url, payload);
}

async function requestAuth(url, payload) {
  const response = await apiFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Authentication request failed.");
  }

  return data;
}

export default AuthPage;
