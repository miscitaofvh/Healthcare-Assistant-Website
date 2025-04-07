import "./Test.css";
import { generateToken } from "../../utils/auth/token";

const Test = () => {
    const payload = {
        id: "123456",
        username: "doanducanh",
        role: "admin",
        email: "doanducanh@example.com"
    };

    // const token = generateToken(payload);

    return (
        <div className="test-container">
            <h1>test</h1>
            <p>aaa</p>
        </div>
    );
};

export default Test;
