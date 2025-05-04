import './App.css'
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Test from './pages/Test';
import VerifyPending from './pages/VerifyPending';
import Error from './pages/Error';
import VerifyEmail from './pages/VerifyEmail';
import Article from './pages/Article';
import ArticleDetail from './pages/Article/[id]';
import { UserProvider } from "./contexts/UserContext";
import { ModalProvider } from './contexts/ModalContext';
import ChatBot from './components/ChatBot';
import { forumRoutes } from './pages/Forum/forumRoutes'; // import Forum routes
import UserProfile from './pages/UserProfile';
import AppointDoctor from './pages/AppointDoctor';
import ChatHistory from './pages/ChatHistory';
import ChatDetail from './pages/ChatHistory/ChatDetail';

function App() {
    return (
        <UserProvider>
            <ModalProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/article" element={<Article />} />
                    <Route path="/article/:id" element={<ArticleDetail />} />
                    {forumRoutes}
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/test" element={<Test />} />
                    <Route path="/error" element={<Error />} />
                    <Route path="/verify-pending" element={<VerifyPending />} />
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="/user/profile" element={<UserProfile />} />
                    <Route path="/appointDoctor" element={<AppointDoctor />} />
                    <Route path="/user/chat-history" element={<ChatHistory />} />
                    <Route path="/user/chat/:chatId" element={<ChatDetail />} />
                    <Route path="*" element={<h1>Page Not Found</h1>} />
                </Routes>
                <ChatBot />
            </ModalProvider>
        </UserProvider>
    );
}

export default App;