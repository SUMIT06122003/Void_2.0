import { useEffect, useState } from "react";
import { products, testimonials } from "../data/storeData";
import { apiFetch } from "../utils/api";
import { formatIndianPhoneNumber, getOtpErrorMessage } from "../utils/authHelpers";

function AuthPage({ mode, onAuthSuccess }) {
  const isRegister = mode === "register";
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
    setMobile("");
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

    setIsSubmitting(true);
    try {
      await requestOtp("/api/auth/otp/send", {
        mode,
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

    if (!/^\d{4}$/.test(otp.trim())) {
      setError("Enter the 4-digit OTP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await requestOtp("/api/auth/otp/verify", {
        mobile: formattedPhone,
        otp: otp.trim()
      });
      const user = await onAuthSuccess(data.token, data.user);
      setStatus(isRegister ? "Account created successfully." : "Login successful.");
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
        <h1>{isRegister ? "Create Account" : "Login"}</h1>
        <p>
          {isRegister
            ? "Create your VOID account with your mobile number and password."
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

        <div className="form-field">
          <label htmlFor="password">{isRegister ? "Create Password" : "Password"}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "Create password" : "Enter password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {isRegister ? (
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
              placeholder="Enter 4-digit OTP"
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
          onClick={isRegister ? (otpSent ? handleVerifyOtp : handleSendOtp) : handleLogin}
        >
          {isSubmitting
            ? "Please Wait"
            : isRegister
              ? otpSent
                ? "Verify OTP"
                : "Send OTP"
              : "Login"}
        </button>

        <p>
          {isRegister ? "Already have an account?" : "New to VOID?"}{" "}
          <a href={isRegister ? "#/login" : "#/register"}>
            {isRegister ? "Login" : "Create account"}
          </a>
        </p>
      </form>
    </section>
  );
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
