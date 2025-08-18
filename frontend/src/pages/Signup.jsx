import { useState, useContext } from "react";
import '../styles/auth/Signup.css';
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { AuthContext } from "../contexts/AuthContext"

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { login } = useContext(AuthContext)

  const navigate = useNavigate();

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=\S{8,})/;

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) newErrors.username = "Username is required";
    if (!password1) newErrors.password1 = "Password is required";
    if (!password2) {
      newErrors.password2 = "Confirm your password";
    } else if (password1 !== password2) {
      newErrors.password2 = "Passwords do not match";
    }

    if (password1.includes(" ")) {
      newErrors.password1 = "Password must not contain spaces";
    }

    if (password1 && !passwordRegex.test(password1)) {
      newErrors.password1 = "Password must contain a letter, a number, and be at least 8 characters";
    }

    setError(newErrors);
    console.log(newErrors)
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);

    try {
        //register the user
        await axios.post('http://localhost:8000/register', {
            username: username,
            password: password1,
        });

        //Log the user in
        const loginRes = await axios.post(
            "http://localhost:8000/login",
            new URLSearchParams({
              username,
              password: password1,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
      
          //Store the token and navigate home
          login(loginRes.data.access_token)
          navigate('/home')

    } catch (err) {
        //the following ensures safe chaining
        setError(err?.response?.data?.detail || "Something went wrong");
      } finally {
        setLoading(false);
      }

  };

  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <h2 className="signup-title">Sign up</h2>
        <form onSubmit={handleSignup}>
          {/* Username */}
          <input
            className={error.username ? "input-err" : "input"}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(prev => ({...prev, username: null}))
            }}
            onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault(); // Prevent spacebar
                }
            }}
            type="text"
            placeholder="username"
          />
          {error.username && (
            <div className="err-wrapper">
              <p className='sign-up-err' style={{ color: "red" }}>{error.username}</p>
            </div>
          )}

          {/* Password */}
          <input
            className={error.password1 ? "input-err" : "input"}
            value={password1}
            onChange={(e) => {
              const val = e.target.value;
              setPassword1(val);
              setError(prev => ({...prev, password1: null}));
            }}
            type="password"
            placeholder="password"
          />

          {/* Password Hint — only after submit */}
          {submitted && !loading && (
            <div className="hint-box">
              <ul className="no-bullets">
                <li className="password-hint">
                  {/[A-Za-z]/.test(password1) && /\d/.test(password1) ? '✅' : '⬜'} <span>Must contain numbers and letters</span>
                </li>
                <li className="password-hint">
                  {password1.length >= 8 ? '✅' : '⬜'} <span>Minimum 8 characters</span>
                </li>
                <li className="password-hint">
                  {!password1.includes(" ") ? '✅' : '⬜'} <span>No spaces allowed</span>
                </li>
              </ul>
            </div>
          )}
          {/*error.password1 && (
            <div className="err-wrapper">
              <p className='sign-up-err' style={{ color: "red" }}>{error.password1}</p>
            </div>
          )*/}

          {/* Confirm Password */}
          <input
            className={error.password2 ? "input-err" : "input"}
            value={password2}
            onChange={(e) => {
              setPassword2(e.target.value);
              setError(prev => ({...prev, password2: null}))
            }}
            type="password"
            placeholder="confirm your password"
          />
          {error.password2 && (
            <div className="err-wrapper">
              <p className='sign-up-err' style={{ color: "red" }}>{error.password2}</p>
            </div>
          )}

          {/* Submit */}
          <div className="button-container">
            <button className="signup-btn" type="submit" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
        </form>

        <p className="login-link">
          <a href="/">Already have an account?</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
