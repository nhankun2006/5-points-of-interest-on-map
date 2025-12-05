import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import "./LoginRegister.css";

type LoginRegisterProps = {
  onLoginSuccess?: () => void;
};

function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Đăng nhập
        await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess?.();
      } else {
        // Đăng ký
        if (password !== confirmPassword) {
          setError("Mật khẩu không khớp!");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("Mật khẩu phải có ít nhất 6 ký tự!");
          setLoading(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, email, password);
        onLoginSuccess?.();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Dịch thông báo lỗi từ Firebase sang tiếng Việt
        if (err.message.includes("email-already-in-use")) {
          setError("Email này đã được đăng ký!");
        } else if (err.message.includes("invalid-email")) {
          setError("Email không hợp lệ!");
        } else if (err.message.includes("user-not-found")) {
          setError("Tài khoản không tồn tại!");
        } else if (err.message.includes("wrong-password")) {
          setError("Mật khẩu không đúng!");
        } else {
          setError(err.message);
        }
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-register-overlay">
      <div className="login-register-container">
        <div className="login-register-box">
          <h1>{isLogin ? "Đăng Nhập" : "Đăng Ký"}</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Đang xử lý..." : isLogin ? "Đăng Nhập" : "Đăng Ký"}
            </button>
          </form>

          <div className="toggle-form">
            <p>
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="toggle-btn"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
