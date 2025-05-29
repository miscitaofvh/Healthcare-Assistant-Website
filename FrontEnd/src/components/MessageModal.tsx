import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const Box = styled.div`
  text-align: center;
`;

const Icon = styled(FontAwesomeIcon)`
  font-size: 40px;
  color: green;
  margin-bottom: 20px;
`;

const Message = styled.p`
  font-size: 16px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
`;

const MessageModal = ({ message, onClose }: { message: string; onClose: () => void }) => {
  return (
    <Box>
      <Icon icon={faCheckCircle} />
      <Message>{message}</Message>
      <Button onClick={onClose}>Đóng</Button>
    </Box>
  );
};

export default MessageModal;
