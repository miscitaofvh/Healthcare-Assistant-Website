import React, { createContext, useContext, useState } from "react";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import MessageModal from "../components/MessageModal";
import styled from "styled-components";

// Modal layout
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

// Modal types
type ModalType = "sign-up" | "login" | "forgot-password" | "message" | null;

interface ModalContextProps {
  openModal: (type: ModalType, props?: any) => void;
  closeModal: () => void;
}

// Context
const ModalContext = createContext<ModalContextProps | undefined>(undefined);

// Provider
export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalProps, setModalProps] = useState<any>(null);

  const openModal = (type: ModalType, props?: any) => {
    setModalType(type);
    setModalProps(props || null);
  };

  const closeModal = () => {
    setModalType(null);
    setModalProps(null);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalType && (
        <Overlay onClick={closeModal}>
          <ModalContent onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            {modalType === "sign-up" && <SignUp />}
            {modalType === "login" && <Login />}
            {modalType === "forgot-password" && <ForgotPassword />}
            {modalType === "message" && (
              <MessageModal message={modalProps?.message} onClose={closeModal} />
            )}
          </ModalContent>
        </Overlay>
      )}
    </ModalContext.Provider>
  );
};

// Hook
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
};
