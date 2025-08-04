import axios from "axios"
import '../styles/Login.css'
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const Login = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate();

    const validateForm = () => {
        if (!username || !password){ //if either password or username are empty
            setError('Username and password are required')
            return false;
        }
        setError('')
        return true;
    }


    const handleLogin = async (e) =>{
        e.preventDefault()
        if(!validateForm()) return;
        setLoading(true)
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password',password);

            //creating a form-like object with username and password because OAuth2PasswordRequestForm expects application/x-www-form-urlencoded not json
            const response = await axios.post('http://localhost:8000/login', formData, {
                headers: {
                    'Content-Type' : 'application/x-www-form-urlencoded',
                },
            });
            setLoading(false)
            
            //if successful backend sends jwt token, this line stores in browser for future authenticated requests
            localStorage.setItem('token',response.data.access_token) //*second arg is token value sent by fasapi, token is the key
            navigate('/home') //redirect to homepage, page reloads at /
        }

        catch (err){
            setLoading(false)
            if(err.response) {
                const errorMsg = err.response.data.detail || 'Authentication failed';
                setError(errorMsg)
            }
            else {
                setError('An error occurred. Please try again later.');
            }
        }
    }

    return(
        <div className="login-container">
            <div className="login-form-wrapper" >
                <h2 className="login-title">Cheffy Login</h2>
                <form onSubmit={handleLogin}>
                    <input
                    className="input-login"
                    value={username} 
                    onChange={(e)=>{
                        setUsername(e.target.value)
                        setError('')
                    }} 
                    id="username" 
                    type="text"
                    placeholder="username"
                    />
                    <input 
                    className="input-login-pass" 
                    value={password} 
                    onChange={(e)=> {
                    setPassword(e.target.value)
                    setError('')
                    }} 
                    id="password" 
                    type="password" 
                    placeholder="password"
                    />
                    <div className="login-err">
                    <p className="login-err-msg" style={{ visibility: error ? "visible" : "hidden", color: "red" }}>
                            {error || "placeholder"}
                        </p>
                    </div>
                    <div className="button-container">
                        <button className="login-btn" type="submit" disabled={loading}>{loading ?
                    "Logging in..." : "Login"}</button>
                    </div>
                </form>
                <p className="register-link">
                    <a href="/register">Create new account</a>
                </p>
            </div>
        </div>
    );
}

export default Login
                    