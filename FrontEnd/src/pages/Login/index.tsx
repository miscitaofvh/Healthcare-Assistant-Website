import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function Login() {
    const auth = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    if (!auth) {
        return <p>Error: AuthContext is undefined</p>;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await auth.login(username, password);
    };

    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
        </form>
    );
}

export default Login;
