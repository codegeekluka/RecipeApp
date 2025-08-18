import '../../styles/layout/NavBar.css'
import { Link, useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from '../../contexts/AuthContext'


const Navbar = () => {
    const { logout, user} = useContext(AuthContext);
    const navigate = useNavigate()
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const handleLogout = () => {
        logout();
        navigate('/');
    }
    return(
        <nav className="nav">
            <Link to="/home" className="site-title">Cheffy</Link>
            <ul>
                <li>
                    <Link to="/MyRecipes">myRecipes</Link>
                </li>
                <li className="dropdown" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                    <button className="user-btn">
                        {user ? user.username : "User"} ▼
                    </button>
                    {dropdownOpen && (
                        <ul className="dropdown-menu">
                        {!user ? (
                            <>
                            <li><Link to="/">Login</Link></li>
                            <li><Link to="/register">Signup</Link></li>
                            </>
                        ) : (
                            <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                        )}
                        </ul>
                    )}
                </li>
            </ul>
        </nav>
    )
}

export default Navbar