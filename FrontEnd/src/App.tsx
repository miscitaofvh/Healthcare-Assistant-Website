import './App.css'
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home';
import About from './pages/About';
import Forum from './pages/Forum';
import Contact from './pages/Contact';
import Test from './pages/Test';
import VerifyPending from './pages/VerifyPending';
import Error from './pages/Error';
import VerifyEmail from './pages/VerifyEmail';
import Article from './pages/Article';
import { UserProvider } from "./contexts/UserContext";
import { ModalProvider } from './contexts/ModalContext';

function App() {
    return (
        <UserProvider>
            <ModalProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/article" element={<Article />} />
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/about" element={<About />} />
                    {/* <Route path="/login" element={<Login />} /> */}
                    {/* <Route path="/sign-up" element={<SignUp />} /> */}
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/test" element={<Test />} />
                    <Route path="/error" element={<Error />} />
                    <Route path="/verify-pending" element={<VerifyPending />} />
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="*" element={<h1>Page Not Found</h1>} />
                </Routes>
            </ModalProvider>
        </UserProvider>
    );
}

export default App;

