import React, { createContext, useContext, useState } from "react";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import styled from "styled-components";

const ModalContent = styled.div`
    background: red;
    position: fixed;
    z-index: 1001;
    border-radius: 25px;
    height: auto;
`;

const Overlay = styled.div`
    background: rgba(0, 0, 0, 0.5);
    position: fixed;
    display: flex;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    align-items: center;
    justify-content: center;
`;

type ModalType = "sign-up" | "login" | null;

interface ModalContextProps {
    openModal: (type: ModalType) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalType, setModalType] = useState<ModalType>(null);

    return (
        <ModalContext.Provider value={{ openModal: setModalType, closeModal: () => setModalType(null) }}>
            {children}
            {modalType && (
                <Overlay onClick={() => setModalType(null)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        {modalType === "sign-up" && <SignUp />}
                        {modalType === "login" && <Login />}
                    </ModalContent>
                </Overlay>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error("useModal must be used within a ModalProvider");
    return context;
};
