import axios from "axios"
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
        <div>
            <form onSubmit={handleLogin}>
                <div>
                    <h2>Login</h2>
                </div>
                <div className="username-container">
                    <label htmlFor="username"></label>
                    <input value={username} onChange={(e)=>setUsername(e.target.value)} id="username" className="username-input" type="text" placeholder="Type your username"/>
                </div>
                <div className="password-container">
                    <label htmlFor="password"></label>
                    <input value={password} onChange={(e)=>setPassword(e.target.value)} id="password" className="username-input" type="password" placeholder="Type your password"/>
                </div>
                {error && (
                    <div className="login-err">
                        <p>{error}</p>
                </div>)}
                <div className="register-link">
                    <p>hi</p>
                    {/*<Link to="">Register</Link>*/}
                </div>
                <div className="button-container">
                    <button type="submit" disabled={loading} className="login-btn">{loading ?
                    "Logging in..." : "Login"}</button>
                </div>
            </form>
        </div>
    )
}

export default Login
                    