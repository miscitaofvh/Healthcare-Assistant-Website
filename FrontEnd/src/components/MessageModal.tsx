import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

// Nền mờ
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

// Khung thông báo
const Box = styled.div`
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Icon = styled(FontAwesomeIcon)`
  font-size: 48px;
  color: #28a745;
  margin-bottom: 20px;
`;

const Message = styled.p`
  font-size: 18px;
  color: #333;
  margin-bottom: 24px;
`;

const Button = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;

  &:hover {
    background: #218838;
  }
`;

const MessageModal = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  return (
    <Overlay>
      <Box>
        <Icon icon={faCheckCircle} />
        <Message>{message}</Message>
        <Button onClick={onClose}>Đóng</Button>
      </Box>
    </Overlay>
  );
};

export default MessageModal;
